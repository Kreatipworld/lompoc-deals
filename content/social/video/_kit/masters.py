#!/usr/bin/env python3
"""Build the master set: every ratio re-rendered from the composition.

    python3 _kit/masters.py member-spotlight --slug in-out-tires-lpc \
        --merge "$(cat out/in-out-tires/curation.json)" --project out/in-out-tires

Each ratio is a fresh build at that frame size, not a crop of the 9:16 export.
A caption safe zoned for a phone frame sits in the middle of a 16:9 letterbox,
so the layout has to be recomputed — which is what `brand.geom()` is for.

Every ratio gets the same audio and the same measured loudness. `-MASTER.mp4`
is the 9:16 at full quality, the archival copy the rest derive from, and
`-poster.jpg` is frame 0 of the 16:9, which is the shape a poster is used in.
"""
import argparse
import json
import os
import shutil
import subprocess
import sys

KIT = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(KIT, "..", "..", ".."))
sys.path.insert(0, os.path.dirname(KIT))
from _kit import brand as B  # noqa: E402

HF = "hyperframes@0.8.26"
RATIOS = ["9x16", "4x5", "1x1", "16x9"]


def run(cmd, cwd=None, check=True):
    r = subprocess.run(cmd, cwd=cwd, shell=isinstance(cmd, str))
    if check and r.returncode != 0:
        raise SystemExit(f"failed: {cmd}")
    return r.returncode


def lufs(path):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af",
                        "loudnorm=I=-15:TP=-1.5:LRA=11:print_format=summary", "-f", "null", "-"],
                       capture_output=True, text=True)
    out = {}
    for line in r.stderr.splitlines():
        if "Input Integrated:" in line:
            out["lufs"] = line.split(":")[1].strip()
        if "Input True Peak:" in line:
            out["tp"] = line.split(":")[1].strip()
    return out


def main():
    p = argparse.ArgumentParser()
    p.add_argument("format")
    p.add_argument("--slug", default="", help="business slug for --auto formats")
    p.add_argument("--data", default="", help="JSON facts (or @file) for formats without a live query")
    p.add_argument("--merge", default="")
    p.add_argument("--ratios", default=",".join(RATIOS), help="comma list, e.g. 9x16,4x5")
    p.add_argument("--project", required=True, help="the locked 9:16 project directory")
    p.add_argument("--name", help="basename for the master set (default: project dir name)")
    p.add_argument("--gap", type=float, default=0.16)
    p.add_argument("--tail", type=float, default=0.85)
    a = p.parse_args()

    project = os.path.abspath(a.project)
    name = a.name or os.path.basename(project)
    masters = os.path.join(project, "masters")
    os.makedirs(masters, exist_ok=True)
    pub = os.path.join(project, "public")
    report = {}

    data = a.data
    if data.startswith("@"):
        data = open(data[1:]).read()

    for ratio in [r for r in a.ratios.split(",") if r]:
        work = os.path.join(project, ".ratio", ratio)
        os.makedirs(work, exist_ok=True)
        # Reuse the locked project's media and voiceover; only the layout changes.
        wp = os.path.join(work, "public")
        if not os.path.exists(wp):
            os.symlink(pub, wp)

        cmd = ["python3", os.path.join(KIT, "make.py"), a.format,
               "--out", work, "--size", ratio, "--vo", pub,
               "--gap", str(a.gap), "--tail", str(a.tail)]
        cmd += ["--data", data] if data else ["--auto", "--slug", a.slug]
        if a.merge:
            cmd += ["--merge", a.merge]
        run(cmd, cwd=REPO)
        run(["python3", os.path.join(KIT, "finalize.py"), work, str(a.gap)], cwd=REPO)

        print(f"\n  == {ratio}: check ==")
        run(["npx", "--yes", HF, "check"], cwd=work)
        print(f"  == {ratio}: render ==")
        run(["npx", "--yes", HF, "render"], cwd=work)

        src = max((os.path.join(work, "renders", f) for f in os.listdir(os.path.join(work, "renders"))
                   if f.endswith(".mp4")), key=os.path.getmtime)
        dst = os.path.join(masters, f"{name}-{ratio}.mp4")
        run(["ffmpeg", "-v", "error", "-y", "-i", src, "-af",
             "loudnorm=I=-15:TP=-1.5:LRA=11", "-ar", "48000", "-c:a", "aac", "-b:a", "192k",
             "-c:v", "copy", dst])
        report[ratio] = lufs(dst)
        if ratio == "9x16":
            shutil.copy2(dst, os.path.join(masters, f"{name}-MASTER.mp4"))
            run(["ffmpeg", "-v", "error", "-y", "-ss", "0", "-i", dst, "-frames:v", "1",
                 "-q:v", "2", os.path.join(masters, f"{name}-cover-9x16.jpg")])
        if ratio == "16x9":
            run(["ffmpeg", "-v", "error", "-y", "-ss", "0", "-i", dst, "-frames:v", "1",
                 "-q:v", "2", os.path.join(masters, f"{name}-poster.jpg")])

    # The per-ratio builds are scratch: the deliverables are in masters/.
    shutil.rmtree(os.path.join(project, ".ratio"), ignore_errors=True)

    print("\n  master set")
    for r, v in report.items():
        print(f"    {name}-{r}.mp4   {v.get('lufs','?')} LUFS   TP {v.get('tp','?')}")
    json.dump(report, open(os.path.join(masters, "loudness.json"), "w"), indent=2)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
