#!/bin/bash
# Renders the realtor cover card and seeds the preview presence on production.
# Run from the repo root:  bash scripts/seed-realtor-preview.sh
set -e
cd "$(dirname "$0")/.."
OUT="${TMPDIR:-/tmp}/realtor-cover.png"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
cat > "${TMPDIR:-/tmp}/realtor-cover.html" <<'EOF'
<html><head><meta charset="utf-8"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;800&display=swap"><style>
body{margin:0;width:1200px;height:800px;background:radial-gradient(ellipse at 30% 20%, #8a1a9c 0%, #650c75 45%, #2c0736 100%);font-family:"Plus Jakarta Sans",system-ui,sans-serif;color:#fff;display:flex;align-items:center;justify-content:center}
.card{text-align:center}
.pill{display:inline-block;background:#efc618;color:#241629;font-weight:800;font-size:22px;letter-spacing:4px;padding:10px 24px;border-radius:999px;text-transform:uppercase}
h1{font-size:84px;font-weight:800;line-height:1.02;margin:34px 0 14px;letter-spacing:-1px}
.sub{font-size:32px;font-weight:500;opacity:.92}.co{font-size:26px;font-weight:800;color:#efc618;margin-top:18px;letter-spacing:2px;text-transform:uppercase}
.house{width:120px;height:120px;margin:0 auto 6px;border:6px solid #efc618;border-radius:24px;display:flex;align-items:center;justify-content:center;font-size:64px}
</style></head><body><div class="card"><div class="house">🏠</div><span class="pill">Realtor · Lompoc</span><h1>Maressa Martinez</h1><div class="sub">Homes for sale in Lompoc and the Central Coast</div><div class="co">Empire Real Estate Group</div></div></body></html>
EOF
"$CHROME" --headless=new --disable-gpu --hide-scrollbars --window-size=1200,800 --virtual-time-budget=4000 --screenshot="$OUT" "file://${TMPDIR:-/tmp}/realtor-cover.html" >/dev/null 2>&1
echo "cover rendered: $OUT"
node --env-file=.env.local scripts/seed-realtor-preview.mjs "$OUT"
SEC=$(grep '^REVALIDATE_SECRET=' .env.local | sed 's/^REVALIDATE_SECRET=//; s/"//g')
for p in /biz/maressa-martinez-realtor /homes /category/real-estate /businesses /; do
  echo "$p -> $(curl -s "https://www.lompoclocals.com/api/revalidate?secret=$SEC&path=$p" | head -c 60)"
done
echo
echo "Live: https://www.lompoclocals.com/biz/maressa-martinez-realtor  and  https://www.lompoclocals.com/homes"
