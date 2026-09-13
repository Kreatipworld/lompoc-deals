"""Word-level timestamps with faster-whisper (durable copy).

  <venv>/bin/python scripts/asr.py <wav 16 kHz mono> [out.json]
Prints "word@start" pairs on one line and writes JSON [{word,start,end}].
Venv: uv venv asr && uv pip install --python asr/bin/python faster-whisper
"""
import json, sys
from faster_whisper import WhisperModel

wav = sys.argv[1]
out = sys.argv[2] if len(sys.argv) > 2 else None
model = WhisperModel("small", device="cpu", compute_type="int8")
segments, _ = model.transcribe(wav, word_timestamps=True, language="en", beam_size=5)
words = []
for seg in segments:
    for w in seg.words or []:
        words.append({"word": w.word.strip(), "start": round(w.start, 2), "end": round(w.end, 2)})
print(" ".join(f"{w['word']}@{w['start']}" for w in words))
if out:
    json.dump(words, open(out, "w"), indent=1)
