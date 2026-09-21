"""Voiceover assembly: one take per line, placed at known positions.

Why per line. A single take of five sentences has to be cut apart again by
detecting silence, and silence detection does not reliably map to sentences —
a comma pause splits one sentence into two segments, and a fast join merges two
sentences into one. Getting that wrong shifts every caption after it. One take
per line removes the guesswork: each file holds exactly one sentence, its
duration is measured, and its position on the timeline is arithmetic.
"""
import os
import subprocess

LEAD = 0.04          # keep this much air before each line so onsets are not clipped
GAP = 0.30           # silence between lines
START = 0.40         # when the read begins


def _probe(path: str) -> float:
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                        "-of", "csv=p=0", path], capture_output=True, text=True)
    return float(r.stdout.strip())


def speech_span(path: str, floor_db: int = 38, min_sil: float = 0.15) -> tuple:
    """(start, end) of the audible part, so leading and trailing air is trimmed."""
    r = subprocess.run(["ffmpeg", "-v", "info", "-i", path, "-af",
                        f"silencedetect=n=-{floor_db}dB:d={min_sil}", "-f", "null", "-"],
                       capture_output=True, text=True)
    dur = _probe(path)
    starts, ends = [], []
    for line in r.stderr.splitlines():
        if "silence_start:" in line:
            starts.append(float(line.split("silence_start:")[1].split()[0]))
        if "silence_end:" in line:
            ends.append(float(line.split("silence_end:")[1].split()[0]))
    begin = ends[0] if ends and starts and starts[0] <= 0.05 else 0.0
    finish = starts[-1] if starts and starts[-1] > begin else dur
    return max(0.0, begin - LEAD), min(dur, finish + LEAD)


def plan(line_files: list, start: float = START, gap: float = GAP) -> list:
    """Where each line will land, computed before anything is rendered.

    Scene lengths are derived from this, so a scene is on screen for exactly as
    long as the sentence about it is being spoken.
    """
    out, cursor = [], 0.0
    for i, src in enumerate(line_files):
        a, b = speech_span(src)
        cursor += (start if i == 0 else gap)
        out.append({"index": i, "start": round(cursor, 3), "end": round(cursor + (b - a), 3)})
        cursor += b - a
    return out


def assemble(line_files: list, out_path: str, total: float,
             start: float = START, gap: float = GAP) -> dict:
    """Concatenate the lines with deterministic silence between them.

    Built by generating real silence and concatenating, never with `adelay` +
    `amix`, which introduced a systematic offset the last time this was done by
    hand. Returns the measured position of every line so captions can be timed
    to the voice instead of the voice being cut to fit the captions.
    """
    work = os.path.join(os.path.dirname(out_path), ".vo-work")
    os.makedirs(work, exist_ok=True)
    subprocess.run(f"rm -f {work}/*.wav", shell=True)

    parts, cursor, placed = [], 0.0, []
    for i, src in enumerate(line_files):
        a, b = speech_span(src)
        lead = (start if i == 0 else gap)
        sil = os.path.join(work, f"g{i}.wav")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i",
                        "anullsrc=r=48000:cl=mono", "-t", f"{lead:.6f}", sil], check=True)
        parts.append(sil); cursor += lead

        seg = os.path.join(work, f"s{i}.wav")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{a:.6f}", "-to", f"{b:.6f}",
                        "-i", src, "-ar", "48000", "-ac", "1", seg], check=True)
        d = _probe(seg)
        placed.append({"index": i, "start": round(cursor, 3), "end": round(cursor + d, 3),
                       "dur": round(d, 3), "src": os.path.basename(src)})
        parts.append(seg); cursor += d

    if cursor > total:
        raise ValueError(
            f"voiceover runs {cursor:.2f}s but the video is {total:.2f}s. "
            f"Shorten a line or lengthen the scenes; do not speed up the read.")

    tail = os.path.join(work, "tail.wav")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", "anullsrc=r=48000:cl=mono",
                    "-t", f"{max(0.01, total - cursor):.6f}", tail], check=True)
    parts.append(tail)

    listing = os.path.join(work, "list.txt")
    with open(listing, "w") as f:
        for p in parts:
            f.write(f"file '{os.path.abspath(p)}'\n")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", listing,
                    "-ar", "48000", "-ac", "2", out_path], check=True)
    subprocess.run(f"rm -rf {work}", shell=True)
    return {"total": round(cursor, 3), "speech_end": round(cursor, 3), "lines": placed}


def master(src: str, dst: str, lufs: float = -15.0) -> None:
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src,
                    "-af", f"loudnorm=I={lufs}:TP=-1.5:LRA=11", "-c:v", "copy", dst], check=True)
