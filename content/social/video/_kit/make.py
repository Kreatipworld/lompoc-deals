#!/usr/bin/env python3
"""Build a recurring video from data.

    python3 _kit/make.py game-result --auto
    python3 _kit/make.py game-night  --auto --render
    python3 _kit/make.py game-night  --data '{"school":"Lompoc", ...}'

--auto pulls the facts from the live database via _kit/data.mjs, so the video
states what /football states. Without --render this only writes files: no
credits are spent and nothing is published.
"""
import argparse
import json
import os
import shutil
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from _kit import brand as B          # noqa: E402
from _kit import compose             # noqa: E402
from _kit.formats import REGISTRY    # noqa: E402

KIT = os.path.dirname(os.path.abspath(__file__))
VIDEO_DIR = os.path.dirname(KIT)
REPO = os.path.abspath(os.path.join(VIDEO_DIR, "..", "..", ".."))

AUTO_QUERY = {"game-night": "next-game", "game-night-town": "friday-games", "game-result": "latest-result",
              "season-recap": "season", "member-spotlight": "member", "deal-promo": "deal"}


def load_auto(fmt: str, slug: str = "", row_id: int = 0) -> dict:
    q = AUTO_QUERY.get(fmt)
    if not q:
        raise SystemExit(f"{fmt} has no --auto data source; pass --data")
    argv = ["node", "--env-file=.env.local", os.path.join(KIT, "data.mjs"), q]
    if slug:
        argv.append(f"--slug={slug}")
    if row_id:
        argv.append(f"--id={row_id}")
    out = subprocess.run(argv, cwd=REPO, capture_output=True, text=True)
    if out.returncode != 0:
        raise SystemExit(f"data.mjs {q} failed:\n{out.stderr.strip() or out.stdout.strip()}")
    return json.loads(out.stdout)


def stage_assets(out_dir: str, video) -> list:
    """Copy the shared pool into the project's public/. Returns missing audio.

    A format may also declare `assets`: media that belongs to this video only —
    a member's photos and logo, say — as staged filename -> URL or local path.
    Each one is fetched once and then reused, so re-running is free.
    """
    pub = os.path.join(out_dir, "public")
    os.makedirs(pub, exist_ok=True)
    pool = os.path.join(KIT, "assets")
    for name in os.listdir(pool):
        src, dst = os.path.join(pool, name), os.path.join(pub, name)
        if os.path.isdir(src):
            if not os.path.exists(dst):
                shutil.copytree(src, dst)
        elif not os.path.exists(dst):
            shutil.copy2(src, dst)

    for name, source in (video.assets or {}).items():
        dst = os.path.join(pub, name)
        if os.path.exists(dst):
            continue
        if str(source).startswith(("http://", "https://")):
            r = subprocess.run(["curl", "-sfL", "-o", dst, source])
            if r.returncode != 0 or not os.path.exists(dst):
                raise SystemExit(f"could not fetch asset {name} from {source}")
        else:
            path = source if os.path.isabs(source) else os.path.join(REPO, source)
            if not os.path.exists(path):
                raise SystemExit(f"asset {name}: no such file {path}")
            shutil.copy2(path, dst)

    missing = [a.src for a in video.audio if not os.path.exists(os.path.join(out_dir, a.src))]
    return missing


HF_VERSION = "0.8.26"


def scaffold(out_dir: str, video) -> None:
    """The two files HyperFrames expects next to index.html."""
    hf = {
        "$schema": "https://hyperframes.heygen.com/schema/hyperframes.json",
        "registry": "https://raw.githubusercontent.com/heygen-com/hyperframes/main/registry",
        "paths": {"blocks": "compositions", "components": "compositions/components", "assets": "assets"},
        "media": {"autoProxy": True},
        "authoringSkill": "general-video",
    }
    pkg = {
        "name": video.slug, "private": True, "type": "module",
        "scripts": {k: f"npx --yes hyperframes@{HF_VERSION} {k}" for k in ("check", "render", "publish")},
    }
    pkg["scripts"]["dev"] = f"npx --yes hyperframes@{HF_VERSION} preview"
    for name, obj in (("hyperframes.json", hf), ("package.json", pkg)):
        path = os.path.join(out_dir, name)
        if not os.path.exists(path):
            open(path, "w").write(json.dumps(obj, indent=2) + "\n")


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("format", choices=sorted(REGISTRY))
    p.add_argument("--auto", action="store_true", help="pull the facts from the live database")
    p.add_argument("--data", help="JSON object of facts, instead of --auto")
    p.add_argument("--slug", help="business slug, for formats whose data source takes one")
    p.add_argument("--id", type=int, help="row id, for formats whose data source takes one (deal-promo)")
    p.add_argument("--merge", help="JSON object layered over the loaded data: curated photos, "
                                   "beats, generated b-roll. Nothing here may contradict the profile.")
    p.add_argument("--out", help="output directory (default: out/<slug>-<date>)")
    p.add_argument("--size", choices=sorted(B.SIZES), help="frame shape (default: the format's own)")
    p.add_argument("--render", action="store_true", help="also run hyperframes check + render")
    p.add_argument("--vo", help="directory holding line-*.wav, to size the video to the read")
    p.add_argument("--gap", type=float, help="silence between spoken lines, in seconds. A 30s "
                                             "commercial breathes tighter than a game recap.")
    p.add_argument("--tail", type=float, default=1.10, help="hold after the last word, in seconds")
    args = p.parse_args()

    if args.auto and args.data:
        raise SystemExit("use --auto or --data, not both")
    data = load_auto(args.format, args.slug or "", args.id or 0) if args.auto else json.loads(args.data or "{}")
    if "error" in data:
        raise SystemExit(f"no data: {data['error']}")
    if args.merge:
        data.update(json.loads(args.merge))

    video = REGISTRY[args.format].build(data)
    if args.size:
        video.size = B.SIZES[args.size]

    # If the voiceover has already been generated, size the video to the read
    # before anything is written, rather than discovering the overrun later.
    if args.vo:
        from _kit import audio as _audio
        wavs = sorted((f for f in os.listdir(args.vo) if f.startswith("line-") and f.endswith(".wav")),
                      key=lambda f: int(f.split("-")[1].split(".")[0]))
        if wavs:
            gap = args.gap if args.gap is not None else _audio.GAP
            placed = _audio.plan([os.path.join(args.vo, f) for f in wavs], gap=gap)
            if video.time_to_read(placed, tail=args.tail):
                print(f"  scenes timed to the read — {video.total:.2f}s")
            else:
                need = placed[-1]["end"] + args.tail
                grew = video.stretch_to(round(need, 2))
                if grew:
                    print(f"  read needs {need:.2f}s — closing scene extended by {grew:.2f}s")

    stamp = data.get("gameDate") or __import__("datetime").date.today().isoformat()
    out_dir = args.out or os.path.join(VIDEO_DIR, "out", f"{video.slug}-{stamp}")
    os.makedirs(out_dir, exist_ok=True)

    manifest = compose.write(video, out_dir)
    scaffold(out_dir, video)
    missing = stage_assets(out_dir, video)

    # Drop audio the project does not have yet, and say so, rather than letting
    # `hyperframes check` fail on a missing file.
    if missing:
        video.audio = [a for a in video.audio if a.src not in missing]
        compose.write(video, out_dir)

    # The voiceover script, ready for ONE text-to-speech call. Lompoc is already
    # respelled here; never re-spell it by hand.
    vo_path = os.path.join(out_dir, "VO.txt")
    open(vo_path, "w").write("\n".join(video.vo_lines) + "\n")

    print(f"\n  {video.title}")
    print(f"  {out_dir}")
    print(f"  {len(video.scenes)} scenes · {video.total:.2f}s · {video.size[0]}x{video.size[1]}")
    print(f"  note: {video.note}")
    print(f"\n  voiceover script ({len(video.vo_lines)} lines) → {os.path.relpath(vo_path, REPO)}")
    for line in video.vo_lines:
        print(f"    {line}")
    if missing:
        print("\n  missing audio (timeline built silent):")
        for m in missing:
            print(f"    {m}")
        print("  generate the voiceover and bed, drop them in public/, re-run to include them.")

    if args.render:
        for cmd in (["npx", "hyperframes", "check"], ["npx", "hyperframes", "render"]):
            print(f"\n  $ {' '.join(cmd)}")
            if subprocess.run(cmd, cwd=out_dir).returncode != 0:
                return 1
    else:
        print(f"\n  not rendered. To render:  cd {os.path.relpath(out_dir, REPO)} && npx hyperframes render")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
