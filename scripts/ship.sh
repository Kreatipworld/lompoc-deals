#!/usr/bin/env bash
# ship.sh — the ONLY way code reaches https://www.lompoclocals.com
#
#   ./scripts/ship.sh "feat: what changed"     commit → push main → ONE production build (staged,
#                                              no domain) → checks → promote → checks on www
#   ./scripts/ship.sh --verify                 no commit: build + check origin/main, do not promote
#   ./scripts/ship.sh --preview "feat: ..."    commit + push + build + check, do not promote
#   ./scripts/ship.sh --promote                promote origin/main (reuses a verified build)
#   ./scripts/ship.sh --promote --recheck      rebuild + recheck even if verified already
#   ./scripts/ship.sh --no-tsc ...             skip the local type check
#   ./scripts/ship.sh --all "..."              also commit UNTRACKED files (default: refuse)
#
# How the gate works (rewritten Sep 16 2026 to cut Vercel build minutes in half):
#   1. Git pushes build NOTHING (vercel.json ignoreCommand → scripts/vercel-ignore.sh).
#      main is history; the `production` branch is a record of what was promoted.
#   2. This script checks out the exact commit into a clean worktree and runs
#      `vercel deploy --prod --skip-domain` — a real production build (production env,
#      Stripe live keys) that is NOT yet on www.lompoclocals.com.
#   3. It runs scripts/check-production.mjs + scripts/smoke-real-estate.mjs against that
#      deployment. Only if every check is green does `vercel promote` point the domain at it.
#   4. Then it checks www itself; if that is red it rolls back to the previous deployment.
#   Commits that touch only content/, docs/, memory or *.md never build at all.
# Never `vercel deploy --prod` without --skip-domain, never `vercel promote` by hand.

set -euo pipefail

PROD_URL="https://www.lompoclocals.com"
PROD_BRANCH="production"
DASHBOARD="https://vercel.com/kreatipworlds-projects/lompoc-deals"
# Paths that never change what Vercel builds. Keep in sync with the comment above.
NO_BUILD_RE='^(content/|docs/|\.claude/|\.agents/|\.superpowers/|scripts/data/|exports/|memory/|[^/]*\.md$|.*/[^/]*\.md$)'

MODE="full"; RUN_TSC=1; ADD_ALL=0; RECHECK=0; MSG=""
for arg in "$@"; do
  case "$arg" in
    --preview) MODE="preview" ;;
    --promote) MODE="promote" ;;
    --verify) MODE="verify" ;;
    --no-tsc) RUN_TSC=0 ;;
    --all) ADD_ALL=1 ;;
    --recheck) RECHECK=1 ;;
    --help|-h) sed -n 2,24p "$0"; exit 0 ;;
    *) MSG="$arg" ;;
  esac
done

cd "$(git rev-parse --show-toplevel)"
ROOT="$(pwd)"

red()   { printf '\033[31m%s\033[0m\n' "$*"; }
green() { printf '\033[32m%s\033[0m\n' "$*"; }
bold()  { printf '\033[1m%s\033[0m\n' "$*"; }
abort() { echo; red "✗ $*"; red "  Production was NOT touched."; exit 1; }

[[ -f .env.local ]] || abort ".env.local missing (needs DATABASE_URL + CRON_SECRET for the checks)"
[[ -f .vercel/project.json ]] || abort ".vercel/project.json missing — run: vercel link"
[[ "$(git rev-parse --abbrev-ref HEAD)" == "main" ]] || abort "ship from main (you are on $(git rev-parse --abbrev-ref HEAD))"

# ── 0. sanity: git pushes must not deploy on their own ───────────────────────
VERCEL_PROD_BRANCH="$(node scripts/vercel-gate.mjs production-branch)"
if [[ "$VERCEL_PROD_BRANCH" != "$PROD_BRANCH" ]]; then
  red "⚠ Vercel's production branch is '$VERCEL_PROD_BRANCH', not '$PROD_BRANCH'."
  red "  Fix once: $DASHBOARD/settings/git → Production Branch → $PROD_BRANCH"
  abort "refusing to ship while a push to main can deploy straight to production"
fi

# ── 1. local checks, commit, push main ───────────────────────────────────────
if [[ "$MODE" != "promote" && "$MODE" != "verify" ]]; then
  if [[ -z "$MSG" ]]; then echo 'Usage: ./scripts/ship.sh [--preview] [--no-tsc] "commit message"'; exit 1; fi
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
  bold "▶ Pushing main (pre-push hook runs lint + title + search checks; no Vercel build)..."
  git push origin main
  SHA="$(git rev-parse HEAD)"
else
  bold "▶ $MODE: using origin/main as-is"
  git fetch origin main "$PROD_BRANCH" --quiet
  if [[ "$(git rev-parse HEAD)" != "$(git rev-parse origin/main)" ]]; then
    red "  note: local main is $(git rev-parse --short HEAD), origin/main is $(git rev-parse --short origin/main) — ${MODE} acts on origin/main"
  fi
  SHA="$(git rev-parse origin/main)"
fi
SHORT="${SHA:0:7}"
git fetch origin "$PROD_BRANCH" --quiet || true

# ── 2. no-build fast path: nothing the app is built from changed ─────────────
if git rev-parse --verify -q "origin/$PROD_BRANCH" >/dev/null; then
  CHANGED="$(git diff --name-only "origin/$PROD_BRANCH..$SHA" || true)"
  if [[ -n "$CHANGED" ]] && ! echo "$CHANGED" | grep -Ev "$NO_BUILD_RE" >/dev/null; then
    bold "▶ ${SHORT} changes only content/docs/memory ($(echo "$CHANGED" | wc -l | tr -d ' ') files) — no build needed."
    if [[ "$MODE" == "verify" || "$MODE" == "preview" ]]; then green "  nothing to verify."; exit 0; fi
    git push origin "$SHA:refs/heads/$PROD_BRANCH"
    green "  ✓ recorded ${SHORT} on $PROD_BRANCH (Vercel skips the build). Production unchanged."
    exit 0
  fi
  if [[ -z "$CHANGED" ]]; then green "  ${SHORT} is already what production was built from."; fi
fi

# ── 3. one staged production build of this exact commit ─────────────────────
VERIFIED_MARK="$(git rev-parse --git-dir)/ship-verified-${SHA}"
DEPLOY_URL=""
if [[ -f "$VERIFIED_MARK" && "$RECHECK" != "1" && "$MODE" == "promote" ]]; then
  DEPLOY_URL="$(awk '{print $2}' "$VERIFIED_MARK")"
  green "  ${SHORT} already verified on $DEPLOY_URL ($(awk '{print $1}' "$VERIFIED_MARK")) — promoting without a rebuild."
fi

if [[ -z "$DEPLOY_URL" ]]; then
  WT="$(mktemp -d /tmp/ship-${SHORT}-XXXX)"
  cleanup() { rm -f "$WT/node_modules" 2>/dev/null; git -C "$ROOT" worktree remove --force "$WT" >/dev/null 2>&1 || rm -rf "$WT"; }
  trap cleanup EXIT
  bold "▶ Building ${SHORT} on Vercel (production target, domain NOT attached)..."
  git worktree add --detach "$WT" "$SHA" >/dev/null
  mkdir -p "$WT/.vercel" && cp .vercel/project.json "$WT/.vercel/project.json"
  DEPLOY_LOG="$ROOT/.git/ship-deploy-${SHORT}.log"
  (cd "$WT" && vercel deploy --prod --skip-domain --yes >"$DEPLOY_LOG.out" 2>"$DEPLOY_LOG") || true
  # The CLI prints the deployment URL on stdout; the build log (with a "▲ Production <url>"
  # line) goes to stderr. Take the URL from either — never trust "last line".
  DEPLOY_URL="$(grep -oE 'https://lompoc-deals-[a-z0-9]+-kreatipworlds-projects\.vercel\.app' "$DEPLOY_LOG.out" | head -1 || true)"
  [[ -n "$DEPLOY_URL" ]] || DEPLOY_URL="$(grep -E 'Production +https://' "$DEPLOY_LOG" | grep -oE 'https://[a-z0-9.-]+\.vercel\.app' | head -1 || true)"
  if [[ -z "$DEPLOY_URL" ]] || grep -qiE 'Error!|Build Failed|Command "npm run build" exited' "$DEPLOY_LOG"; then
    tail -30 "$DEPLOY_LOG" || true
    abort "build of ${SHORT} failed — see $DASHBOARD (log: $DEPLOY_LOG)"
  fi
  green "  build ready: $DEPLOY_URL"

  # Deployment URLs are protected; the checks send the automation bypass header.
  if ! grep -q '^VERCEL_AUTOMATION_BYPASS_SECRET=' .env.local; then
    export VERCEL_AUTOMATION_BYPASS_SECRET="$(node scripts/vercel-gate.mjs bypass)"
  fi
  bold "▶ Checking the build (server checks + real browser on desktop and iPhone)..."
  # The checks are the ones committed WITH this build (worktree), not whatever the working
  # tree has now — a newer check for a route this build does not have is a false red.
  CHECKS_DIR="$WT"
  ln -sfn "$ROOT/node_modules" "$WT/node_modules"
  if ! node --env-file=.env.local "$CHECKS_DIR/scripts/check-production.mjs" --base="$DEPLOY_URL" \
     || ! node --env-file=.env.local "$CHECKS_DIR/scripts/smoke-real-estate.mjs" --base="$DEPLOY_URL"; then
    echo
    red "══════════════════════════════════════════════════════════════"
    red "  ✗ BUILD FAILED CHECKS — ${SHORT} will NOT be promoted."
    red "    Build: $DEPLOY_URL"
    red "    Production stays at: $(node scripts/vercel-gate.mjs current-production)"
    red "══════════════════════════════════════════════════════════════"
    exit 1
  fi
  date -u +"%Y-%m-%dT%H:%M:%SZ $DEPLOY_URL" > "$VERIFIED_MARK"
fi

if [[ "$MODE" == "preview" || "$MODE" == "verify" ]]; then
  echo
  green "Build ${SHORT} verified and NOT promoted (as requested)."
  echo "  Build:   $DEPLOY_URL"
  echo "  Promote with: ./scripts/ship.sh --promote"
  exit 0
fi

# ── 4. promote: point www at the verified build ──────────────────────────────
PREV_PROD_URL="$(node scripts/vercel-gate.mjs current-production | awk '{print $2}')"
bold "▶ Promoting ${SHORT} → $PROD_URL (live now: ${PREV_PROD_URL:-unknown})..."
vercel promote "$DEPLOY_URL" --yes >/dev/null || abort "vercel promote failed — production unchanged ($DASHBOARD)"
git push origin "$SHA:refs/heads/$PROD_BRANCH" >/dev/null 2>&1 || red "  (could not record ${SHORT} on $PROD_BRANCH — production IS updated; push it by hand: git push origin ${SHORT}:refs/heads/$PROD_BRANCH)"

# ── 5. check production itself; roll back on red ─────────────────────────────
bold "▶ Running production checks against $PROD_URL..."
sleep 5
CHECKS_DIR="${CHECKS_DIR:-$ROOT}"
if ! node --env-file=.env.local "$CHECKS_DIR/scripts/check-production.mjs" --base="$PROD_URL" \
   || ! node --env-file=.env.local "$CHECKS_DIR/scripts/smoke-real-estate.mjs" --base="$PROD_URL"; then
  echo
  red "══════════════════════════════════════════════════════════════"
  red "  ✗ PRODUCTION IS RED after promoting ${SHORT} — rolling back now."
  red "══════════════════════════════════════════════════════════════"
  if [[ -n "${PREV_PROD_URL:-}" ]] && vercel rollback "$PREV_PROD_URL" --yes; then
    red "  Rolled back to $PREV_PROD_URL (now live: $(node scripts/vercel-gate.mjs current-production))."
    red "  $PROD_BRANCH still points at ${SHORT}; fix forward and ship again."
    node --env-file=.env.local scripts/check-production.mjs --base="$PROD_URL" >/dev/null 2>&1 && green "  production checks green again after rollback." || red "  ⚠ production STILL red after rollback — look now: $DASHBOARD"
  else
    red "  AUTOMATIC ROLLBACK FAILED — run: vercel rollback <previous-deployment-url> --yes   (dashboard: $DASHBOARD)"
  fi
  exit 1
fi

echo
green "══════════════════════════════════════════════════════════════"
green "  ✓ SHIPPED ${SHORT}"
echo  "    build:      $DEPLOY_URL"
echo  "    live:       $PROD_URL/en"
green "══════════════════════════════════════════════════════════════"
