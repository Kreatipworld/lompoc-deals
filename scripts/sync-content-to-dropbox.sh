#!/usr/bin/env bash
# Mirrors every generated asset to Dropbox.
#
# Generated media is deliberately untracked in git — it pushed the repo to 514 MB — so the repo
# is NOT the archive. Dropbox is. Anything here that isn't synced exists only on this machine and
# dies with it, which is why this runs after any render session.
#
# rsync, not cp: it only moves what changed, so re-running is cheap, and --delete is deliberately
# NOT set — Dropbox keeps older cuts even after they're cleaned out of the working tree.
#
# Usage:
#   ./scripts/sync-content-to-dropbox.sh          # sync everything
#   ./scripts/sync-content-to-dropbox.sh --dry    # show what would move
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$REPO/content/social"
DEST="$HOME/Dropbox/Lompoc Locals Content"
ADS="$HOME/Dropbox/Videos Ads"
KIT="$HOME/Dropbox/Lompoc Locals Brand & Marketing"

DRY=""
[ "${1:-}" = "--dry" ] && DRY="--dry-run"

if [ ! -d "$HOME/Dropbox" ]; then
  echo "Dropbox folder not found at $HOME/Dropbox — is it installed and signed in?" >&2
  exit 1
fi

mkdir -p "$DEST" "$ADS" "$KIT/brand-assets" "$KIT/sales-kit" "$KIT/marketing"

echo "→ syncing $SRC"
echo "  to      $DEST"
echo

# Everything except the working scratch: index.html and plan.html are regenerated views, and the
# launch-kit is superseded by content/social/posts.
rsync -a --stats $DRY \
  --exclude ".DS_Store" \
  "$SRC/video"   "$SRC/posts"  "$SRC/cards" \
  "$SRC/assets"  "$SRC/notes"  "$SRC/reports" \
  "$SRC/calendar.md" "$SRC/calendar.csv" "$SRC/queue.json" "$SRC/README.md" \
  "$DEST/"

# The finished ad set also lands in the ads folder the owner actually works out of.
if [ -d "$SRC/video/ad-masters" ]; then
  echo
  echo "→ ad masters to $ADS"
  rsync -a --stats $DRY --exclude ".DS_Store" "$SRC/video/ad-masters/" "$ADS/"
fi

# macOS ships rsync 2.6.9, which predates --info and several long options. Anything added here
# has to work on that version, not just on a Homebrew rsync 3.x.

# Brand and marketing. These live in the repo (and are tracked), but the owner works out of
# Dropbox and needs the logo, the decks and the playbooks to hand without cloning anything.
echo
echo "→ brand + marketing to $KIT"
rsync -a --stats $DRY --exclude ".DS_Store" "$REPO/public/brand/" "$KIT/brand-assets/"
rsync -a --stats $DRY --exclude ".DS_Store" "$REPO/docs/brand/" "$KIT/brand-assets/"
rsync -a --stats $DRY --exclude ".DS_Store" "$REPO/docs/sales-kit/" "$KIT/sales-kit/"
rsync -a --stats $DRY --exclude ".DS_Store" "$REPO/docs/marketing/" "$KIT/marketing/"

echo
echo "done. $(du -sh "$DEST" 2>/dev/null | cut -f1) in $DEST"
