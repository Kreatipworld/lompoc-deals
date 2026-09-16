#!/usr/bin/env bash
# Vercel "Ignored Build Step" (vercel.json → ignoreCommand).
# exit 0 = SKIP the build, exit 1 = build.
#
# Since Sep 16 2026 every production build is started by scripts/ship.sh
# (`vercel deploy --prod --skip-domain`, checked, then promoted) — one build per
# ship, none for social logs, docs or memory commits. Git pushes therefore build
# nothing: main pushes are just history, and the `production` branch is a record
# of what was promoted. Put "[build]" in a commit message to force a git preview.
msg="${VERCEL_GIT_COMMIT_MESSAGE:-}"
if [[ "$msg" == *"[build]"* ]]; then
  echo "commit asks for a git build ([build])"; exit 1
fi
echo "skipping git-triggered build — ship.sh builds and promotes (see scripts/ship.sh)"
exit 0
