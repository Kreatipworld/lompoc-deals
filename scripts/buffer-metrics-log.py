#!/usr/bin/env python3
"""Append Buffer post metrics to the durable log content/social/reports/buffer-metrics.csv.

Buffer is only reachable through the Claude connector (no API token in .env.local), so the flow is:
  1. In session: mcp__buffer__list_posts(organizationId=6a6a2617653404d8bc6cf4a5, includeMetrics=true, status=[sent], dueAt window)
     — the result lands in ~/.claude/projects/<proj>/<session>/tool-results/mcp-buffer-list_posts-*.txt
  2. python3 scripts/buffer-metrics-log.py <those files...>
One row per (snapshot_date, post_id); re-running the same day updates the row. Read it before every build.
"""
import csv, json, os, sys, datetime
OUT = "content/social/reports/buffer-metrics.csv"
COLS = ["snapshot_date","post_id","due_at","channel","is_video","views","impressions","reach","reactions","comments","shares","saves","clicks","follows","engagement_rate","avg_time_watched","text"]
today = datetime.date.today().isoformat()
posts = []
for f in sys.argv[1:]:
    raw = json.load(open(f)); txt = "".join(x["text"] for x in raw)
    dec = json.JSONDecoder(); i = 0
    while i < len(txt):
        while i < len(txt) and txt[i] in " \n\r\t": i += 1
        if i >= len(txt): break
        o, i = dec.raw_decode(txt, i)
        if isinstance(o, list): posts += o
        elif isinstance(o, dict):
            ps = o.get("posts") or o.get("data") or o.get("edges") or []
            if isinstance(ps, dict): ps = ps.get("edges") or ps.get("nodes") or []
            posts += [p.get("node", p) for p in ps]
rows = {}
if os.path.exists(OUT):
    for r in csv.DictReader(open(OUT)): rows[(r["snapshot_date"], r["post_id"])] = r
n = 0
for p in posts:
    if not isinstance(p, dict) or not p.get("id") or not p.get("metrics"): continue
    m = {x.get("type"): x.get("value") for x in p["metrics"] if isinstance(x, dict)}
    vid = any("video" in json.dumps(a).lower() for a in (p.get("assets") or []))
    rows[(today, p["id"])] = {"snapshot_date": today, "post_id": p["id"], "due_at": p.get("dueAt") or "", "channel": p.get("channelService") or "",
        "is_video": int(vid), "views": m.get("views",""), "impressions": m.get("impressions",""), "reach": m.get("reach",""), "reactions": m.get("reactions",""),
        "comments": m.get("comments",""), "shares": m.get("shares",""), "saves": m.get("saves",""), "clicks": m.get("clicks",""), "follows": m.get("follows",""),
        "engagement_rate": m.get("engagementRate",""), "avg_time_watched": m.get("averageTimeWatched",""), "text": (p.get("text") or "").replace("\n"," ")[:120]}
    n += 1
with open(OUT, "w", newline="") as f:
    w = csv.DictWriter(f, fieldnames=COLS); w.writeheader()
    for k in sorted(rows, key=lambda k: (k[0], rows[k]["due_at"]), reverse=True): w.writerow(rows[k])
print(f"logged {n} posts for {today}; {len(rows)} rows total in {OUT}")
