#!/usr/bin/env bash
# ship.sh — commit all changes and push to GitHub → triggers Vercel auto-deploy
# Usage: ./scripts/ship.sh "your commit message"
# Example: ./scripts/ship.sh "feat: add new promo page"

set -euo pipefail

MSG="${1:-}"
if [[ -z "$MSG" ]]; then
  echo "Usage: ./scripts/ship.sh \"your commit message\""
  exit 1
fi

cd "$(git rev-parse --show-toplevel)"

echo "▶ Checking for changes..."
if git diff --quiet && git diff --cached --quiet && [[ -z "$(git ls-files --others --exclude-standard)" ]]; then
  echo "Nothing to commit. Pushing current branch to trigger Vercel redeploy..."
  git push
  echo "✓ Push complete — Vercel will redeploy in ~30s"
  echo "  Live: https://lompoc-deals.vercel.app/en"
  exit 0
fi

echo "▶ Staging all changes..."
git add .

echo "▶ Committing: $MSG"
git commit -m "$MSG"

echo "▶ Pushing to origin/main → Vercel auto-deploys..."
git push

echo ""
echo "✓ Done! Vercel will build and deploy in ~1–2 minutes."
echo "  Live site: https://lompoc-deals.vercel.app/en"
echo "  Vercel dashboard: https://vercel.com/kreatipworlds-projects/lompoc-deals"
