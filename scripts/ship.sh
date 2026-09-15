#!/usr/bin/env bash
# ship.sh — the ONLY way code reaches https://www.lompoclocals.com
#
#   ./scripts/ship.sh "feat: what changed"     commit everything → push main → preview →
#                                              checks → promote to production → checks
#   ./scripts/ship.sh --preview "feat: ..."    stop after the preview passes (subagents:
#                                              report the preview URL, the coordinator promotes)
#   ./scripts/ship.sh --verify                 no commit: check the preview of what is on
#                                              origin/main (agents: commit explicitly, push, verify)
#   ./scripts/ship.sh --promote                promote what is already on origin/main
#   ./scripts/ship.sh --no-tsc ...             skip the local type check (Vercel still runs it)
#   ./scripts/ship.sh --all "..."              also commit UNTRACKED files (default: refuse — other
#                                              sessions' work-in-progress lives in this tree)
#   ./scripts/ship.sh --promote --recheck      re-run the preview checks even if verified already
#
# How the gate works (Sep 14 2026, after c5a36aa 500'd every /category/* page live):
#   1. Vercel's production branch is `production`, not `main`. A push to main only
#      builds a PREVIEW deployment. Nothing you push can reach residents by itself.
#   2. This script waits for that preview, then runs scripts/check-production.mjs
#      against it (every section page, search, tracking, photos, Stripe prices...).
#   3. Only if every check is green does it fast-forward `production` to the same
#      commit, which is what Vercel deploys to www.lompoclocals.com.
#   4. Then it checks production itself; if that is red it rolls back on the spot.
# Never `git push origin production` by hand — that skips the gate.

set -euo pipefail

PROD_URL="https://www.lompoclocals.com"
PROD_BRANCH="production"
DASHBOARD="https://vercel.com/kreatipworlds-projects/lompoc-deals"

MODE="full"
RUN_TSC=1
ADD_ALL=0
RECHECK=0
MSG=""
for arg in "$@"; do
  case "$arg" in
    --preview) MODE="preview" ;;
    --promote) MODE="promote" ;;
    --verify) MODE="verify" ;;
    --no-tsc) RUN_TSC=0 ;;
    --all) ADD_ALL=1 ;;
    --recheck) RECHECK=1 ;;
    --help|-h) sed -n 2,20p "$0"; exit 0 ;;
    *) MSG="$arg" ;;
  esac
done

cd "$(git rev-parse --show-toplevel)"

red()   { printf '\033[31m%s\033[0m\n' "$*"; }
green() { printf '\033[32m%s\033[0m\n' "$*"; }
bold()  { printf '\033[1m%s\033[0m\n' "$*"; }
abort() { echo; red "✗ $*"; red "  Production was NOT touched."; exit 1; }

[[ -f .env.local ]] || abort ".env.local missing (needs DATABASE_URL + CRON_SECRET for the checks)"
[[ "$(git rev-parse --abbrev-ref HEAD)" == "main" ]] || abort "ship from main (you are on $(git rev-parse --abbrev-ref HEAD))"

# ── 0. sanity: is the gate actually in place? ────────────────────────────────
VERCEL_PROD_BRANCH="$(node scripts/vercel-gate.mjs production-branch)"
if [[ "$VERCEL_PROD_BRANCH" != "$PROD_BRANCH" ]]; then
  red "⚠ Vercel's production branch is '$VERCEL_PROD_BRANCH', not '$PROD_BRANCH'."
  red "  A push to main deploys STRAIGHT to production — the gate cannot protect residents."
  red "  Fix once: $DASHBOARD/settings/git → Production Branch → $PROD_BRANCH"
  red "  (or: node scripts/vercel-gate.mjs set-production-branch $PROD_BRANCH)"
  if [[ "$MODE" == "promote" || "$MODE" == "verify" ]]; then abort "nothing to $MODE while main is the production branch"; fi
  echo
fi

# ── 1. local checks, commit, push main ───────────────────────────────────────
if [[ "$MODE" != "promote" && "$MODE" != "verify" ]]; then
  if [[ -z "$MSG" ]]; then
    echo 'Usage: ./scripts/ship.sh [--preview] [--no-tsc] "commit message"'
    exit 1
  fi
  if git diff --quiet && git diff --cached --quiet && [[ -z "$(git ls-files --others --exclude-standard)" ]]; then
    echo "Nothing to commit — shipping the current commit."
  else
    if [[ "$RUN_TSC" == "1" ]]; then
      bold "▶ Type check (npx tsc --noEmit)..."
      npx tsc --noEmit || abort "type errors — fix them before shipping (or --no-tsc to let Vercel find them)"
    fi
    UNTRACKED="$(git ls-files --others --exclude-standard)"
    if [[ -n "$UNTRACKED" && "$ADD_ALL" != "1" ]]; then
      red "Untracked files in the tree — refusing to sweep them into your commit:"
      echo "$UNTRACKED" | sed 's/^/    /' | head -30
      abort "commit your own files explicitly (git add <paths> && git commit) then run ./scripts/ship.sh --promote, or pass --all if they are all yours"
    fi
    bold "▶ Committing: $MSG"
    git add -A
    git commit -m "$MSG"
    git show --stat --format= HEAD | tail -15
  fi
  bold "▶ Pushing main (pre-push hook runs lint + title + search checks)..."
  git push origin main
else
  bold "▶ $MODE: using origin/main as-is"
  git fetch origin main --quiet
  if [[ "$(git rev-parse HEAD)" != "$(git rev-parse origin/main)" ]]; then
    red "  note: local main is $(git rev-parse --short HEAD), origin/main is $(git rev-parse --short origin/main) — ${MODE} acts on origin/main"
  fi
fi

if [[ "$MODE" == "promote" || "$MODE" == "verify" ]]; then
  SHA="$(git rev-parse origin/main)"
else
  SHA="$(git rev-parse HEAD)"
fi
SHORT="${SHA:0:7}"

# ── 2. wait for the preview build of this exact commit ───────────────────────
if [[ "$VERCEL_PROD_BRANCH" == "$PROD_BRANCH" ]]; then
  bold "▶ Waiting for the PREVIEW deployment of ${SHORT}..."
  PREVIEW_URL="$(node scripts/vercel-gate.mjs wait "$SHA" --target=preview)" || abort "preview build of ${SHORT} failed — see $DASHBOARD"
  green "  preview ready: $PREVIEW_URL"

  # Previews are SSO-protected; the check script sends the automation bypass header.
  if ! grep -q '^VERCEL_AUTOMATION_BYPASS_SECRET=' .env.local; then
    export VERCEL_AUTOMATION_BYPASS_SECRET="$(node scripts/vercel-gate.mjs bypass)"
  fi

  # ── 3. the gate: every check against the preview ───────────────────────────
  VERIFIED_MARK="$(git rev-parse --git-dir)/ship-verified-${SHA}"
  bold "▶ Running production checks against the preview..."
  if [[ -f "$VERIFIED_MARK" && "$RECHECK" != "1" && "$MODE" == "promote" ]]; then
    green "  preview ${SHORT} already passed every check on this machine ($(cat "$VERIFIED_MARK")) — skipping (use --recheck to run again)"
  elif ! node --env-file=.env.local scripts/check-production.mjs --base="$PREVIEW_URL" \
       || ! node --env-file=.env.local scripts/smoke-real-estate.mjs --base="$PREVIEW_URL"; then
    echo
    red "══════════════════════════════════════════════════════════════"
    red "  ✗ PREVIEW FAILED CHECKS — ${SHORT} will NOT be promoted."
    red "    Preview: $PREVIEW_URL"
    red "    Production stays at: $(node scripts/vercel-gate.mjs current-production)"
    red "══════════════════════════════════════════════════════════════"
    exit 1
  fi
  green "  ✓ preview ${SHORT} passed every check"
  date -u +"%Y-%m-%dT%H:%M:%SZ $PREVIEW_URL" > "$VERIFIED_MARK"

  if [[ "$MODE" == "preview" || "$MODE" == "verify" ]]; then
    echo
    green "Preview ${SHORT} verified and NOT promoted (as requested)."
    echo "  Preview URL: $PREVIEW_URL"
    echo "  Promote with: ./scripts/ship.sh --promote"
    exit 0
  fi

  # ── 4. promote: fast-forward the production branch ─────────────────────────
  # Remember what is live right now: `vercel rollback` needs an explicit target
  # (bare `vercel rollback --yes` only prints the rollback status and changes nothing).
  PREV_PROD_URL="$(node scripts/vercel-gate.mjs current-production | awk '{print $2}')"
  bold "▶ Promoting ${SHORT} → $PROD_BRANCH (fast-forward only; live now: ${PREV_PROD_URL:-unknown})..."
  git push origin "$SHA:refs/heads/$PROD_BRANCH" || abort "could not fast-forward $PROD_BRANCH — someone pushed it by hand? Inspect with: git log origin/$PROD_BRANCH"
else
  # Gate not in place yet: the push above already deployed to production.
  PREVIEW_URL="(none — main deploys straight to production)"
fi

# ── 5. wait for production, then check it for real ───────────────────────────
bold "▶ Waiting for the PRODUCTION deployment of ${SHORT}..."
PROD_DEPLOY_URL="$(node scripts/vercel-gate.mjs wait "$SHA" --target=production)" || abort "production build of ${SHORT} failed — the previous deployment is still live"
green "  production deployment ready: $PROD_DEPLOY_URL"

bold "▶ Running production checks against $PROD_URL..."
# check-production = server-side (200s, content, prices); smoke-real-estate = a real
# browser on the realtor road (hydration/client errors never show up in curl).
if ! node --env-file=.env.local scripts/check-production.mjs --base="$PROD_URL" \
   || ! node --env-file=.env.local scripts/smoke-real-estate.mjs --base="$PROD_URL"; then
  echo
  red "══════════════════════════════════════════════════════════════"
  red "  ✗ PRODUCTION IS RED after promoting ${SHORT} — rolling back now."
  red "══════════════════════════════════════════════════════════════"
  if [[ -n "${PREV_PROD_URL:-}" ]] && vercel rollback "$PREV_PROD_URL" --yes; then
    red "  Rolled back to $PREV_PROD_URL (now live: $(node scripts/vercel-gate.mjs current-production))."
    red "  $PROD_BRANCH still points at ${SHORT}; fix forward and ship again (the next promote fast-forwards past it)."
    bold "▶ Re-checking $PROD_URL after the rollback..."
    if node --env-file=.env.local scripts/check-production.mjs --base="$PROD_URL"; then
      green "  ✓ production is green again on the previous deployment"
    else
      red "══════════════════════════════════════════════════════════════"
      red "  ✗✗ PRODUCTION IS STILL RED AFTER THE ROLLBACK — fix by hand NOW: $DASHBOARD"
      red "══════════════════════════════════════════════════════════════"
    fi
  else
    red "  AUTOMATIC ROLLBACK FAILED — run: vercel rollback <previous-deployment-url> --yes   (dashboard: $DASHBOARD)"
  fi
  exit 1
fi

echo
green "══════════════════════════════════════════════════════════════"
green "  ✓ SHIPPED ${SHORT}"
echo  "    preview:    $PREVIEW_URL"
echo  "    production: $PROD_DEPLOY_URL"
echo  "    live:       $PROD_URL/en"
green "══════════════════════════════════════════════════════════════"
