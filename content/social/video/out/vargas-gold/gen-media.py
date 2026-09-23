#!/usr/bin/env python3
"""Generated media for the Vargas Jewelers gold coupon promo. Run from the repo root.

    python3 content/social/video/out/vargas-gold/gen-media.py vo          # Arthur, one take per line
    python3 content/social/video/out/vargas-gold/gen-media.py bed 30      # brand-new sonilo bed, N seconds
    python3 content/social/video/out/vargas-gold/gen-media.py clip 0      # one Seedance clip by index

Budget is an 8-credit hard cap. The clip is atmosphere for the cold open only:
a plain gold chain on velvet, nobody's piece — no text, no hallmarks, no
engraving, no logos, no hands, no faces — and it is checked frame by frame
before it is used. Their own photos carry every identity beat.
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
INSTR = "Warm confident retail commercial read, brisk and clear, no long pauses, a smile in the voice, natural"
assert len(INSTR) <= 128, len(INSTR)

CLIPS = [
    # cold open — a plain gold chain, nobody's piece
    "Extreme macro of a plain yellow gold rope chain coiled on dark navy velvet, a warm light "
    "sweeping slowly across the links so they sparkle, shallow depth of field, slow gentle push-in, "
    "cinematic, luxurious, no text, no letters, no engraving, no hallmarks, no logos, no people, no hands",
    # second attempt — clip-0's chain re-coiled itself mid-shot. Static product shot: only the light moves.
    "Static product shot, extreme macro: a plain polished yellow gold curb chain lying perfectly still "
    "on dark navy velvet, the chain does not move at all, only a warm soft light sweeps slowly across the "
    "links making them glint one after another, locked-off camera with a very slow push-in, shallow depth "
    "of field, cinematic, luxurious, no text, no letters, no engraving, no hallmarks, no logos, no people, no hands",
]

BED = ("Warm elegant jewelry-store commercial bed: soft felt piano, gentle string pad, a light "
       "glockenspiel shimmer, slow tasteful build, intimate and confident, resolves warmly at the "
       "end, no vocals, no drums")


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
        print("  retry", label, t[:160])
        time.sleep(3)
    raise SystemExit(f"could not submit {label}")


def main(what: str, arg: str = "") -> int:
    os.makedirs(OUT, exist_ok=True)
    if what == "vo":
        lines = [l.strip() for l in open(os.path.join(HERE, "VO.txt")) if l.strip()]
        only = {int(x) for x in arg.split(",")} if arg else None
        jobs = []
        for i, line in enumerate(lines):
            if only is not None and i not in only:
                continue
            if os.path.exists(f"{OUT}/line-{i}.wav") and only is None:
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
        raise SystemExit("vo [i,j] | bed <secs> | clip <i>")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else ""))
