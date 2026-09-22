#!/usr/bin/env python3
"""Find repeated shots in a rendered video by perceptual hash.

    python3 _kit/framecheck.py out/<project>/masters/<name>-MASTER.mp4

Sizing beats to a voiceover means a beat can outrun its footage, and the way
that fails is a *visible restart*: the shot snaps back to its opening framing
part-way through and plays again. `hyperframes check` has no opinion about it —
it is a valid composition — and a coarse frame sweep walks straight past it,
because the repeat is exactly as far apart as the clip is long. So sample every
second and compare every pair.

Near-identical neighbours a second apart are just a still; the interesting
result is a pair several seconds apart, which is a shot playing twice.
"""
import os
import subprocess
import sys
import tempfile

HASH_W, HASH_H = 16, 9          # dHash grid: 16x9 comparisons = 144 bits
NEAR = 12                       # bits of difference under which two frames match
MIN_GAP = 2.0                   # ignore pairs closer than this: that is a still
MOVED = 24                      # the picture has to travel this far and come back to be a repeat


def _hash(path: str) -> int:
    """Difference hash: each bit is "is this pixel brighter than the next one"."""
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", path, "-vf",
         f"scale={HASH_W + 1}:{HASH_H},format=gray", "-f", "rawvideo", "-"],
        capture_output=True).stdout
    bits, w = 0, HASH_W + 1
    for row in range(HASH_H):
        for col in range(HASH_W):
            i = row * w + col
            bits = (bits << 1) | (1 if raw[i] > raw[i + 1] else 0)
    return bits


def sweep(video: str, step: float = 1.0) -> int:
    dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                "-of", "csv=p=0", video], capture_output=True, text=True).stdout)
    frames = []
    with tempfile.TemporaryDirectory() as tmp:
        t = 0.0
        while t < dur:
            f = os.path.join(tmp, f"{t:.2f}.png")
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t:.2f}", "-i", video,
                            "-frames:v", "1", f], check=True)
            frames.append((t, _hash(f)))
            t += step

    # Two near-identical frames are only a repeat if the picture went somewhere
    # in between and came back. If everything between them also matches, it is
    # simply a still — a photo under a slow push, or the end card — and that is
    # not a defect.
    hits, stills = [], []
    for i, (ta, ha) in enumerate(frames):
        for j, (tb, hb) in enumerate(frames[i + 1:], start=i + 1):
            if tb - ta < MIN_GAP:
                continue
            d = bin(ha ^ hb).count("1")
            if d > NEAR:
                continue
            excursion = max((bin(ha ^ hm).count("1") for _, hm in frames[i + 1:j]), default=0)
            (hits if excursion > MOVED else stills).append((ta, tb, d, excursion))

    print(f"  {os.path.basename(video)}  {dur:.2f}s, {len(frames)} frames sampled every {step}s")
    for ta, tb, d, ex in stills:
        print(f"  still   {ta:6.2f}s ~ {tb:6.2f}s   {d}/144 apart, never left ({ex}/144)")
    if not hits:
        print("  no repeated shots")
        return 0
    for ta, tb, d, ex in hits:
        print(f"  REPEAT  {ta:6.2f}s ~ {tb:6.2f}s   {d}/144 apart, but moved {ex}/144 in between")
    return 1


if __name__ == "__main__":
    step = float(sys.argv[2]) if len(sys.argv) > 2 else 1.0
    raise SystemExit(sweep(sys.argv[1], step))
