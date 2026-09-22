#!/usr/bin/env python3
"""Generated media for the aquarium 40th promo. Run from the repo root.

    python3 content/social/video/out/aquarium-40/gen-media.py vo          # Arthur, one take per line
    python3 content/social/video/out/aquarium-40/gen-media.py bed 30      # brand-new sonilo bed, N seconds
    python3 content/social/video/out/aquarium-40/gen-media.py clip 0      # one Seedance clip by index

Budget is a 10-credit hard cap. Generate ONE clip first and confirm the ledger
price with `transactions` before the other two. Every clip is generic mood —
no signage, no text, no logos, no people — and is checked frame by frame for
legible text before it is used.
"""
import os
import re
import subprocess
import sys
import time

sys.path.insert(0, "scripts/higgsfield-mcp")
import hf  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "public")
ARTHUR = "30fc8796-ceb6-4a66-b3a7-4a145ef7f346"   # Qwen preset; the reference voice for Lompoc
INSTR = "Excited event announcer, warm and proud, building energy, big finish, natural breathing"
assert len(INSTR) <= 128

CLIPS = [
    # opener — a kelp forest, nobody's tank
    "Underwater kelp forest, tall golden-green kelp fronds swaying in clear blue-green water, "
    "sunbeams shafting down from the surface, small silver fish drifting between the stalks, "
    "slow forward camera glide, cinematic natural light, no text, no letters, no people",
    # today — fish in a tank, generic
    "Inside a public aquarium tank: bright orange and silver fish gliding past dark rockwork and "
    "green sea anemones, soft blue light, gentle bubbles rising, slow lateral camera pan, "
    "cinematic, no text, no signage, no labels, no people, no logos",
    # the mural — a painted kelp wall, not any specific artwork
    "Close-up tracking shot along a hand-painted mural wall of an underwater kelp forest: bold "
    "brush strokes of kelp fronds in ochre, teal and deep blue, painted fish, matte paint texture, "
    "warm indoor light, camera slides steadily left to right with momentum, no text, no letters, "
    "no signage, no people",
]

BED = ("Anthemic celebratory event promo: bright pulsing synths, driving four-on-the-floor kick, "
       "hand claps, rising strings and brass swells, energy building every eight bars to a big "
       "triumphant crest near the end, confident sustained finish, no vocals")


def poll(jid, name, exts, tries=30, wait=8):
    for _ in range(tries):
        s = hf.call("job_status", {"jobId": jid, "sync": True}, timeout=200)["text"]
        m = re.search(r"https?://\S+\.(?:%s)\S*" % "|".join(exts), s)
        if m:
            subprocess.run(["curl", "-sL", "-o", f"{OUT}/{name}", m.group(0).rstrip('",)')], check=True)
            print("  ok", name)
            return True
        if "failed" in s.lower() or "error" in s.lower():
            print("  status:", s[:300])
        time.sleep(wait)
    print("  FAIL", name)
    return False


def submit(tool, params, label):
    for _ in range(4):
        t = hf.call(tool, {"params": params}, timeout=120)["text"]
        j = hf.job_id(t)
        if j:
            return j
        if "preset" in t.lower() and "declined_preset_id" in t:
            print("  preset intercept:", t[:200])
        print("  retry", label, t[:160])
        time.sleep(3)
    raise SystemExit(f"could not submit {label}")


def main(what: str, arg: str = "") -> int:
    os.makedirs(OUT, exist_ok=True)
    if what == "vo":
        lines = [l.strip() for l in open(os.path.join(HERE, "VO.txt")) if l.strip()]
        jobs = []
        for i, line in enumerate(lines):
            if os.path.exists(f"{OUT}/line-{i}.wav"):
                print(f"  line-{i} exists, skipping")
                continue
            j = submit("generate_audio", {
                "model": "qwen_audio_tts", "prompt": line, "voice_type": "preset",
                "voice_id": ARTHUR, "instruction": INSTR, "language": "en", "use_unlim": False,
            }, f"line-{i}")
            print(f"  line-{i} -> {j}  {line}")
            jobs.append((i, j))
            time.sleep(1)
        for i, j in jobs:
            poll(j, f"line-{i}.wav", ("wav", "mp3", "m4a"))
    elif what == "bed":
        secs = int(arg or 30)
        j = submit("generate_audio", {"model": "sonilo_music", "prompt": BED,
                                      "duration": secs, "use_unlim": False}, "bed")
        print("  bed ->", j)
        poll(j, "bed.src", ("wav", "mp3", "m4a"), tries=30, wait=8)
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", f"{OUT}/bed.src",
                        "-ar", "48000", "-ac", "2", f"{OUT}/bed.wav"], check=True)
        os.remove(f"{OUT}/bed.src")
        print("  ok bed.wav")
    elif what == "clip":
        i = int(arg)
        if os.path.exists(f"{OUT}/clip-{i}.mp4"):
            print(f"  clip-{i} exists, skipping"); return 0
        j = submit("generate_video", {
            "model": "seedance1_5", "prompt": CLIPS[i], "aspect_ratio": "9:16",
            "duration": 4, "resolution": "720p", "generate_audio": False, "use_unlim": False,
        }, f"clip-{i}")
        print(f"  clip-{i} -> {j}")
        poll(j, f"clip-{i}.mp4", ("mp4", "mov", "webm"), tries=40, wait=10)
    else:
        raise SystemExit("vo | bed <secs> | clip <i>")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else ""))
