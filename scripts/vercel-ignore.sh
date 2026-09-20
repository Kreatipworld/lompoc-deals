#!/usr/bin/env bash
# Vercel "Ignored Build Step"  (vercel.json → ignoreCommand)
#   exit 0 = SKIP this build      exit 1 = RUN this build
#
# Why this exists (Sep 20 2026 build-cost audit):
#   Build CPU-minutes = wall-clock minutes ROUNDED UP to the next whole minute,
#   times the number of vCPUs on the machine. On Pro + Elastic that multiplier
#   runs at ~30. So a 28-second build that we throw away still bills a full
#   minute at ~30 vCPU. The cheapest build is the one that never starts.
#
#   Every production build is started by scripts/ship.sh
#   (`vercel deploy --prod --skip-domain` → checks → `vercel promote`).
#   Git pushes exist to record history, not to deploy.
#
# NOTE: a skipped build still boots a build machine and is still billed at least
# one rounded-up minute. This script reduces cost; it does not make it free.
# The only way to stop the boot is to turn automatic deploys off for the branch
# in Vercel → Project → Settings → Git. See docs/ops/vercel-build-cost.md.

set -uo pipefail

ref="${VERCEL_GIT_COMMIT_REF:-}"
msg="${VERCEL_GIT_COMMIT_MESSAGE:-}"

skip() { echo "SKIP: $1"; exit 0; }
build() { echo "BUILD: $1"; exit 1; }

# 1. Explicit opt-in always wins, on any branch.
#    The token must OPEN the subject line: "[build] fix the header". A loose
#    substring match fires on any commit that merely mentions the token, which
#    is exactly what happened to 9841ec6 — a commit documenting this gate said
#    "[build] still forces one" in its body and bought a 93s build for nothing.
subject="${msg%%$'\n'*}"
[[ "$subject" == "[build]"* ]] && build "subject line opens with [build]"

# 2. The `production` branch is a RECORD of what ship.sh already built and
#    promoted. That exact commit has a live production deployment. Rebuilding
#    it from git is duplicate work, every single time.
[[ "$ref" == "production" ]] && skip "'production' is a record branch — ship.sh already built and promoted this commit"

# 3. Preview builds off `main`.
#    ship.sh builds and checks the real production target for every ship, so a
#    git preview of main is a second build of the same code that nobody looks
#    at. Default is therefore OFF and main skips outright.
#    To turn path-based previews on, set PREVIEW_BUILDS=paths in
#    Vercel → Project → Settings → Environment Variables (Preview scope). Then
#    main builds only when a compiled path changed, per the diff below.
if [[ "${PREVIEW_BUILDS:-off}" != "paths" ]]; then
  skip "preview builds are off (PREVIEW_BUILDS != paths) — ship.sh builds production directly"
fi

#    Paths the app is actually compiled from. Anything not listed here
#    (content/, docs/, scripts/, videos/, marketing/, exports/, scratchpad/,
#    .claude/, *.md) never reaches the bundle.
BUILD_PATHS=(
  app components lib hooks i18n messages db types public
  middleware.ts next.config.js next.config.mjs next.config.ts
  package.json package-lock.json tailwind.config.ts tailwind.config.js
  postcss.config.js tsconfig.json vercel.json
)

# Vercel shallow-clones, so HEAD^ is often absent. Deepen just enough; if the
# diff cannot be computed, fail SAFE by building rather than skipping silently.
git rev-parse --verify -q HEAD^ >/dev/null 2>&1 || git fetch --depth=2 origin "$ref" >/dev/null 2>&1 || true
git rev-parse --verify -q HEAD^ >/dev/null 2>&1 || build "no parent commit available — cannot diff, building to be safe"

changed="$(git diff --name-only HEAD^ HEAD -- "${BUILD_PATHS[@]}" 2>/dev/null)" \
  || build "git diff failed — building to be safe"

if [[ -n "$changed" ]]; then
  build "build-relevant paths changed:
$(echo "$changed" | head -10 | sed 's/^/    /')"
fi

skip "no build-relevant paths changed on '$ref' (docs / content / scripts only)"
