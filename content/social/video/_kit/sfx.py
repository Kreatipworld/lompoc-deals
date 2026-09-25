"""Synthesized sound effects, pure Python, deterministic — typewriter clacks and
counter ticks written to 48 kHz mono WAV. Owned, never licensed."""
import math, random, struct, wave

SR = 48000


def _write(path, samples):
    data = struct.pack("<%dh" % len(samples), *(max(-32767, min(32767, int(s * 32767))) for s in samples))
    with wave.open(path, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(data)


def _burst(buf, at, dur=0.018, gain=0.6, tone=0.0, seed=0):
    """A short noise burst (a key strike) with a tiny tonal body."""
    rnd = random.Random(seed)
    n = int(dur * SR); i0 = int(at * SR)
    for k in range(n):
        if i0 + k >= len(buf): break
        env = math.exp(-k / (n * 0.28))
        v = (rnd.random() * 2 - 1) * env
        if tone:
            v = 0.6 * v + 0.4 * math.sin(2 * math.pi * tone * k / SR) * env
        buf[i0 + k] += v * gain


def typewriter(path, total, char_times, gain=0.5):
    """One clack per character time; the carriage return gets a heavier strike."""
    buf = [0.0] * int(total * SR + SR)
    for i, (t, ch) in enumerate(char_times):
        if ch == "\n":
            _burst(buf, t, dur=0.05, gain=gain * 1.3, tone=180, seed=i)
        elif ch != " ":
            _burst(buf, t, dur=0.016 + (i % 3) * 0.003, gain=gain * (0.8 + (i % 5) * 0.05), tone=0, seed=i)
    _write(path, buf[: int(total * SR)])


def ticks(path, total, t0, t1, n_ticks, hit_at=None, gain=0.55):
    """n_ticks between t0 and t1 with accelerating spacing (ease-in), then an optional low hit."""
    buf = [0.0] * int(total * SR + SR)
    for i in range(n_ticks):
        u = i / max(1, n_ticks - 1)
        t = t0 + (t1 - t0) * (1 - (1 - u) ** 2.2)       # dense at the end
        _burst(buf, t, dur=0.012, gain=gain * (0.5 + 0.5 * u), tone=900 - 500 * u, seed=i)
    if hit_at is not None:
        n = int(0.9 * SR); i0 = int(hit_at * SR)
        for k in range(n):
            if i0 + k >= len(buf): break
            env = math.exp(-k / (n * 0.35))
            f = 55 + 40 * math.exp(-k / (SR * 0.05))
            buf[i0 + k] += 0.9 * env * math.sin(2 * math.pi * f * k / SR)
    _write(path, buf[: int(total * SR)])
