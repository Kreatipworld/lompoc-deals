# Trails of Lompoc (Town Guides Nº 2) — resume notes (Aug 7 2026)

APPROVED: new friendly narration ("Lompoke" phonetic fix, user signed off):
  https://d8j0ntlcm91z4.cloudfront.net/user_3CuWntmy2lNmJohSFZzzxO6qy1E/hf_20260807_200415_57f36e40-d383-4c0e-88df-89e82ae3ca8a.mp3

BUILD SCRIPT: trails-build.py (= v10) — whisper-free, hardcoded anchors for the
approved take, real OpenTopoMap tiles per card + cover, true OSM trail geometry
(Bodger highlight way 16228351), per-scene captions, OSM/OpenTopoMap credits.
Also on CDN: https://d2ol7oe51mr4n9.cloudfront.net/user_3CuWntmy2lNmJohSFZzzxO6qy1E/b2a97187-19d0-497f-acdc-f85591d183ac.py
Geometry JSON: .../13b92c32-ba11-489a-849b-75d9b01afee2.json (fetched in prep).

TO FINISH (when Higgsfield sandbox is stable — it was recycling every few
seconds tonight): one sandbox_exec run, ~90s:
  curl script -> python3 build.py prep && anim && final -> PUT final.mp4 to a
  FRESH media slot (never reuse a slot). Then QC frame 0, download, user review,
  then Buffer push to all four placements (poster frame 0, thumbnailOffset 0,
  IG story with link sticker).

LAST GOOD RENDER (old voice, 2 gray cover tiles): ~/Downloads/trails-of-lompoc-final.mp4
and CDN .../1d04ddf5-6aa5-44f9-b978-bc3782d58567.mp4 — do NOT publish (voice superseded).

## v13 (current, Aug 7 late) — CLARITY PASS, user-approved direction
- One bold gold route per card (explicit highlight or longest way), start/end markers
- Other paths faint grey context; fragments <6 pts dropped
- Cover legend: "01 BODGER · 02 LA PURISIMA · 03 BURTON MESA · 04 OCEAN BEACH"
- NEXT UPGRADE (user wants): "point of view" follow-cam — crop window tracks the
  route head as it draws (2D flyover, GIS-reel style like tiktok @mbforrgis).

## SHIPPED-READY (Aug 7 night) — rendered LOCALLY
Higgsfield sandbox was down all evening; installed static ffmpeg/ffprobe on the
Mac (scratchpad/bin, evermeet.cx builds, quarantine removed) and rendered locally
with no time limits. Local pipeline: PATH=<scratchpad>/bin python3 build.py
prep|anim|final in a work dir. Scene timings synced to the approved v3 narration
via ffmpeg silencedetect (no whisper needed). Robust multi-host tile fetch added.
FINAL: ~/Downloads/trails-of-lompoc-FINAL.mp4 (40.4s) — awaiting user approval to post.

## EPISODE ASSEMBLED (Aug 8) — awaiting post approval
- HyperFrames theme sting (videos/trails-theme, editorial-paper style v3: cream/tape/green
  script/ink title/purple band) + map documentary, concat locally -> 44.4s episode.
- Files: ~/Downloads/trails-of-lompoc-EPISODE.mp4; sting render videos/trails-theme/renders/sting.mp4.
- Publish plan: Buffer all 4 placements, thumbnailOffset ~3.9s (sting lockup frame).
- Theme is the reusable series intro: edit "nº 2" line + re-render (25s) per episode.
