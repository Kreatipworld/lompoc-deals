#!/usr/bin/env python3
"""Fold the voiceover into a built project, then time the captions to the voice.

Run after `make.py` once public/line-*.wav and public/bed.wav exist.
Captions move to wherever the sentence actually lands. The alternative is
cutting the read to fit fixed caption slots, which is what made the last video
take an afternoon and land half a second early.
"""
import json
import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from _kit import audio  # noqa: E402

HOLD = 0.35   # leave a caption up this long after its sentence ends


def main(project: str, gap: float = audio.GAP) -> int:
    man = json.load(open(os.path.join(project, "build.json")))
    pub = os.path.join(project, "public")
    lines = sorted(
        (f for f in os.listdir(pub) if f.startswith("line-") and f.endswith(".wav")),
        key=lambda f: int(f.split("-")[1].split(".")[0]),
    )
    if not lines:
        print("no public/line-*.wav — generate the voiceover first"); return 1

    placed = audio.assemble([os.path.join(pub, f) for f in lines],
                            os.path.join(pub, "vo.wav"), man["total"], gap=gap)
    print(f"  voiceover {placed['total']:.2f}s of {man['total']:.2f}s")
    for p in placed["lines"]:
        print(f"    L{p['index']}  {p['start']:6.2f} → {p['end']:6.2f}")

    # Re-time the surviving captions onto their own sentence.
    by_index = {p["index"]: p for p in placed["lines"]}
    retimed = 0
    for sub in man["subs"]:
        p = by_index.get(sub.get("vo_index", -1))
        if not p:
            continue
        sub["start"], sub["end"] = p["start"], min(man["total"], p["end"] + HOLD)
        retimed += 1
    json.dump(man, open(os.path.join(project, "build.json"), "w"), indent=2)
    print(f"  {retimed} caption(s) timed to the read")

    # Rewrite just the caption composition; scene markup is unchanged.
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from _kit.compose import Sub, Video, _subs_html
    stub = Video(slug=man["slug"], title=man["title"], total=man["total"],
                 scenes=[], size=tuple(man["size"]),
                 subs=[Sub(s["start"], s["end"], s["text"], s.get("say", "")) for s in man["subs"]])
    open(os.path.join(project, "compositions", "subs.html"), "w").write(_subs_html(stub))

    # Put the audio tags back into index.html now that the files exist.
    idx = os.path.join(project, "index.html")
    html = open(idx).read()
    n = len(man["scenes"]) + 3
    tags = [
        f'      <audio id="a{n}" class="clip" data-audio-group="voiceover" src="public/vo.wav" '
        f'data-start="0" data-media-start="0" data-duration="{man["total"]:.2f}" data-track-index="{n}" '
        f'data-volume="0.80" data-fade-in="0.05" data-fade-out="0.20"></audio>',
        f'      <audio id="a{n+1}" class="clip" data-audio-group="music" src="public/bed.wav" '
        f'data-start="0" data-media-start="0" data-duration="{man["total"]:.2f}" data-track-index="{n+1}" '
        f'data-volume="0.26" data-fade-in="0.4" data-fade-out="1.2" '
        f'data-fx-carve=\'{{"enabled":true,"sources":["voiceover"],"strength":0.60}}\'></audio>',
    ]
    # Own the audio block outright. The builder may already have emitted tags for
    # files that existed at build time; appending to those duplicates media ids.
    import re as _re
    html = _re.sub(r"[ \t]*<audio\b[^>]*></audio>\n?", "", html)
    html = html.replace("    </div>\n    <script>window.__timelines",
                        "\n".join(tags) + "\n    </div>\n    <script>window.__timelines")
    open(idx, "w").write(html)
    print("  audio tracks written (voice + bed, bed carved under the voice)")
    return 0


if __name__ == "__main__":
    # argv[2] is the same --gap make.py was given; the two have to agree or the
    # captions land on the wrong sentence.
    raise SystemExit(main(sys.argv[1], float(sys.argv[2]) if len(sys.argv) > 2 else audio.GAP))
