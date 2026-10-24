#!/bin/bash
# Seeds Phillip Segura's preview profile (Plus trial, 4 active Lompoc listings) and refreshes the pages.
# Run from the repo root:  bash scripts/seed-realtor-segura.sh
set -e
cd "$(dirname "$0")/.."
node --env-file=.env.local scripts/seed-realtor-segura.mjs scripts/invites/segura-cover.png
SEC=$(grep '^REVALIDATE_SECRET=' .env.local | sed 's/^REVALIDATE_SECRET=//; s/"//g')
for p in /biz/phillip-segura-realtor /homes /category/real-estate /businesses /; do
  echo "$p -> $(curl -s "https://www.lompoclocals.com/api/revalidate?secret=$SEC&path=$p" | head -c 60)"
done
echo "Live: https://www.lompoclocals.com/biz/phillip-segura-realtor"
