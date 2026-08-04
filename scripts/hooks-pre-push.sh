#!/bin/bash
# Pre-push hook for lompoc-deals
# Runs `next lint` to catch ESLint errors before pushing.
# Same checks Vercel runs during `next build` — fails fast locally instead
# of after a 90-second Vercel deploy.

set -e
cd "$(git rev-parse --show-toplevel)"

echo ""
echo "[pre-push] Running ESLint via next lint..."
echo ""

if ! node node_modules/next/dist/bin/next lint 2>&1; then
  echo ""
  echo "[pre-push] ❌ Lint failed. Push aborted."
  echo "[pre-push]    Fix the errors above, then 'git push' again."
  echo "[pre-push]    To bypass (NOT recommended), use: git push --no-verify"
  echo ""
  exit 1
fi

echo ""
echo "[pre-push] Checking page titles..."
if ! node scripts/check-title-metadata.mjs; then
  echo ""
  echo "[pre-push] ❌ Title check failed. Push aborted."
  echo "[pre-push]    The root layout adds \"| Lompoc Locals\" — page titles must not repeat it."
  echo ""
  exit 1
fi

echo ""
echo "[pre-push] Checking search matching..."
if ! node scripts/check-search-matching.mjs; then
  echo ""
  echo "[pre-push] ❌ Search check failed. Push aborted."
  echo "[pre-push]    ILIKE hid a pizzeria from \"pizza\" and a third of the directory from its own name."
  echo ""
  exit 1
fi

echo "[pre-push] ✓ Lint passed. Pushing..."
exit 0
