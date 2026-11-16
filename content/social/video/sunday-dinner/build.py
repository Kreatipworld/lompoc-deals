#!/usr/bin/env python3
"""Sunday Dinner master (first run Nov 15 2026). Member restaurants open tonight, one per beat:
full-bleed photos of THEIR food with a slow push-in, a place card (name, street, tonight's closing time, logo,
member badge), gold plate-ring wipes between them, "Where are you eating tonight?" and the /find/dinner end card.

Each week: make out/sunday-dinner-<date>/stops.json (see README.md), copy photos/logos into its public/, then
  python3 build.py <outdir> take      # writes take.txt (VO script) from the stops' lines
  python3 build.py <outdir> vo|bed    # Holden take / new music bed (Higgsfield credits: ask first)
  python3 build.py <outdir> split     # take.wav -> public/line-N.wav at each paragraph's first word
  python3 build.py <outdir>           # writes index.html (+ public/voice.wav); then: npx hyperframes render
Hours must be re-checked live on Google the same day; members only (paying or comped), never alcohol."""
import json, os, re, subprocess, sys, time
MASTER = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.abspath(sys.argv[1]); os.chdir(OUT)
CMD = sys.argv[2] if len(sys.argv) > 2 else "build"
CFG = json.load(open("stops.json"))
STOPS = CFG["stops"]; N = len(STOPS)
HOLDEN = "3c9d6053-6334-592c-8997-4e325286af3f"

if CMD == "take":
    paras = [CFG["intro_line"]] + [s["line"] for s in STOPS] + [CFG["outro_line"]]
    open("take.txt", "w").write("\n\n".join(paras) + "\n"); print(open("take.txt").read()); sys.exit()

if CMD in ("vo", "bed"):
    sys.path.insert(0, "/home/orchestra/Projects/lompoc-deals/scripts/higgsfield-mcp"); import hf
    def submit(params):
        for _ in range(4):
            t = hf.call("generate_audio", {"params": params}, timeout=90)["text"]; j = hf.job_id(t)
            if j: return j
            time.sleep(2)
        raise SystemExit("submit failed: " + t[:300])
    def fetch(jid, dst, tries=40, wait=6):
        for _ in range(tries):
            s = hf.call("job_status", {"jobId": jid, "sync": True}, timeout=200)["text"]
            m = re.search(r"https?://\S+\.(?:wav|mp3|m4a)\S*", s)
            if m: subprocess.run(["curl", "-sL", "-o", dst, m.group(0).rstrip('",)')], check=True); return True
            time.sleep(wait)
        raise SystemExit("FAIL " + dst)
    if CMD == "vo":
        j = submit({"model": "text2speech_v2", "variant": "elevenlabs", "prompt": open("take.txt").read().strip(),
                    "voice_type": "preset", "voice_id": HOLDEN, "use_unlim": False}); print("vo job", j, flush=True)
        fetch(j, "take.src"); subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", "take.src", "-ar", "48000", "-ac", "1", "take.wav"], check=True)
    else:
        j = submit({"model": "sonilo_music", "prompt": CFG["bed_prompt"], "duration": 60, "use_unlim": False}); print("bed job", j, flush=True)
        fetch(j, "bed.src", wait=8); subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", "bed.src", "-ar", "48000", "-ac", "2", "public/bed.wav"], check=True)
    print(CMD, "ok"); sys.exit()

if CMD == "split":
    import numpy as np
    from faster_whisper import WhisperModel
    a = np.frombuffer(subprocess.run(["ffmpeg", "-loglevel", "error", "-i", "take.wav", "-f", "f32le", "-ac", "1", "-ar", "16000", "-"], capture_output=True).stdout, np.float32)
    segs, _ = WhisperModel("small.en", compute_type="int8").transcribe(a, word_timestamps=True)
    ws = [(w.word.strip(), w.start, w.end) for s in segs for w in s.words]
    print(" ".join(w[0] for w in ws))
    firsts = [p.split()[0] for p in open("take.txt").read().strip().split("\n\n")]
    norm = lambda s: re.sub(r"[^a-z0-9']", "", s.lower())
    starts, k = [], 0
    for f in firsts:
        while norm(ws[k][0]) != norm(f): k += 1
        starts.append(k); k += 1
    total = len(a) / 16000
    for i, k in enumerate(starts):
        st = max(0, ws[k][1] - 0.25, ws[k - 1][2] + 0.02 if k else 0)
        en = ws[starts[i + 1] - 1][2] + 0.12 if i + 1 < len(starts) else min(total, ws[-1][2] + 0.3)
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", "take.wav", "-af", f"atrim={st:.3f}:{en:.3f},asetpts=PTS-STARTPTS,afade=t=in:d=0.02",
                        "-ar", "48000", "-ac", "1", f"public/line-{i}.wav"], check=True)
        print(i, round(st, 2), round(en, 2))
    json.dump(ws, open("words.json", "w")); sys.exit()

# ---------- build ----------
def wavlen(f):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f], capture_output=True, text=True).stdout)
lines = [f"public/line-{i}.wav" for i in range(N + 2)]
have_vo = all(os.path.exists(f) for f in lines)
dur = [wavlen(f) for f in lines] if have_vo else [3.4] + [3.6] * N + [3.0]

INTRO = max(3.2, 0.35 + dur[0] + 0.45)
seg = []; t = INTRO
for i in range(N):
    seg.append(t); t += max(4.0, 0.25 + dur[i + 1] + 0.7)
ASK = t
ASK_LEN = max(3.0, dur[N + 1] + 0.9)
END = ASK + ASK_LEN
TOTAL = round(END + 2.8, 2)
vo_at = [0.35] + [s + 0.25 for s in seg] + [ASK + 0.3]

js = []; add = js.append
shots_html = ""; sid = 0
def shot(src, t0, t1, z0, z1, x0=0, x1=0, fit=False):
    """one full-bleed photo between t0 and t1 with a slow push (z0 -> z1); fit=True shows a non-vertical photo whole on a blurred copy"""
    global shots_html, sid
    i = sid; sid += 1
    inner = (f'<img class="blur" src="public/{src}"><img class="fit" src="public/{src}">' if fit else f'<img src="public/{src}">')
    shots_html += f'<div class="shot" id="s{i}">{inner}</div>'
    tgt = f"#s{i} img:last-child"
    add(f"tl.set('#s{i}',{{autoAlpha:1}},{t0:.2f});tl.set('#s{i}',{{autoAlpha:0}},{t1:.2f});")
    add(f"tl.fromTo('{tgt}',{{scale:{z0},xPercent:{x0}}},{{scale:{z1},xPercent:{x1},duration:{t1 - t0:.2f},ease:'none'}},{t0:.2f});")

# intro (frame 0 = the cover): each restaurant's "plate" photo in a round frame over the purple glow.
# Rule from Andres (Nov 15): never show the same picture twice in a video, and rotate away from photos past posts used.
used = [s["plate"] for s in STOPS] + [x for s in STOPS for x in s["shots"]]
assert len(used) == len(set(used)), "a photo is used twice: " + str(used)
plates = ""; W = 400; gap = (1080 - 3 * W) / 2 if N >= 3 else 0
for i, s in enumerate(STOPS[:3]):
    x = [30, 360, 690][i] if N >= 3 else 140 + i * 420
    top = [40, 0, 40][i] if N >= 3 else 20
    plates += f'<div class="pl" id="pl{i}" style="left:{x}px;top:{top}px"><img src="public/{s["plate"]}"></div>'
    add(f"tl.fromTo('#pl{i}',{{rotation:{[-8, 3, 9][i]}}},{{rotation:{[-4, 0, 5][i]},duration:{INTRO:.2f},ease:'none'}},0);")
add("tl.fromTo('#intro .tt',{scale:1},{scale:1.05,duration:%.2f,ease:'none'},0);" % INTRO)
add(f"tl.to('#intro',{{autoAlpha:0,duration:0.25}},{INTRO - 0.25:.2f});")

cards = ""; wipes = ""
for i, s in enumerate(STOPS):
    t0 = seg[i]; t1 = seg[i + 1] if i + 1 < N else ASK
    a, b = s["shots"][0], (s["shots"][1] if len(s["shots"]) > 1 else None)
    cut = t0 + (t1 - t0) * (0.6 if b else 1.0)
    fits = s.get("fit", [])
    shot(a, t0, cut, 1.12, 1.0, 0, 0, a in fits)             # opening shot tight, eases out (our photos are ~800 px: keep zoom low)
    if b: shot(b, cut, t1, 1.0, 1.1, -2, 2, b in fits)       # second shot pushes in
    # ring wipe into every stop
    wipes += f'<i id="w{i}"></i>'
    add(f"tl.set('#w{i}',{{autoAlpha:1}},{t0 - 0.05:.2f});")
    add(f"tl.fromTo('#w{i}',{{scale:0.02}},{{scale:1.1,duration:0.5,ease:'power2.in'}},{t0 - 0.05:.2f});")
    add(f"tl.set('#w{i}',{{autoAlpha:0}},{t0 + 0.45:.2f});")
    bg = s.get("logo_bg", "#fff")
    lg = f'<img class="lg" src="public/{s["logo"]}" style="background:{bg}">' if s.get("logo") else ""
    mb = '<span class="mb">LOMPOC LOCALS MEMBER</span>' if s.get("member", True) else ""
    ig = f'<span class="ig">{s["ig"]}</span>' if s.get("ig") else ""
    cards += (f'<div class="card" id="c{i}"><div class="paper"><span class="no">NO. {i + 1} OF {N}</span><span class="nm">{s["name"]}</span>'
              f'<span class="ad">{s["addr"]}</span><span class="hrs">OPEN TONIGHT · <b>{s["hrs"]}</b></span>{ig}{lg}</div>{mb}</div>')
    add(f"tl.set('#c{i}',{{autoAlpha:1}},{t0 + 0.2:.2f});")
    add(f"tl.fromTo('#c{i}',{{y:420,rotation:-3}},{{y:0,rotation:0,duration:0.55,ease:'expo.out'}},{t0 + 0.2:.2f});")
    add(f"tl.fromTo('#c{i} .hrs',{{scale:0.6,autoAlpha:0}},{{scale:1,autoAlpha:1,duration:0.35,ease:'back.out(2.2)'}},{t0 + 0.6:.2f});")
    add(f"tl.fromTo('#c{i} .mb',{{x:80,autoAlpha:0}},{{x:0,autoAlpha:1,duration:0.35,ease:'expo.out'}},{t0 + 0.8:.2f});")
    add(f"tl.to('#c{i}',{{y:500,autoAlpha:0,duration:0.3,ease:'power2.in'}},{t1 - 0.3:.2f});")

# ask: on the warm purple glow (no photo repeats)
add(f"tl.set('#askbg',{{autoAlpha:1}},{ASK:.2f});tl.fromTo('#askbg',{{autoAlpha:0}},{{autoAlpha:1,duration:0.3}},{ASK:.2f});")
add(f"tl.set('#askbg',{{autoAlpha:1}},0);tl.set('#askbg',{{autoAlpha:0}},{INTRO:.2f});")
add(f"tl.set('#ask',{{autoAlpha:1}},{ASK:.2f});tl.fromTo('#ask span',{{scale:0.7,autoAlpha:0}},{{scale:1,autoAlpha:1,duration:0.45,ease:'back.out(1.8)'}},{ASK + 0.1:.2f});")
add(f"tl.fromTo('#ask small',{{y:30,autoAlpha:0}},{{y:0,autoAlpha:1,duration:0.35}},{ASK + 0.5:.2f});")
add(f"tl.fromTo('#bug',{{autoAlpha:0,x:-40}},{{autoAlpha:1,x:0,duration:0.3}},{INTRO:.2f});")
add(f"tl.to(['#ask','#bug'],{{autoAlpha:0,duration:0.2}},{END - 0.1:.2f});")
add(f"tl.set('#en',{{autoAlpha:1}},{END:.2f});tl.fromTo('#en',{{autoAlpha:0}},{{autoAlpha:1,duration:0.3}},{END:.2f});")
add(f"tl.fromTo('#en .elogo',{{scale:0.4,autoAlpha:0}},{{scale:1,autoAlpha:1,duration:0.4,ease:'back.out(2)'}},{END + 0.05:.2f});")
add(f"tl.fromTo('#en .en',{{y:50,autoAlpha:0}},{{y:0,autoAlpha:1,duration:0.35}},{END + 0.25:.2f});")
add(f"tl.fromTo(['#en .ek','#en .eu','#en .cr'],{{autoAlpha:0}},{{autoAlpha:1,duration:0.3}},{END + 0.4:.2f});")
add(f"tl.set({{}},{{}},{TOTAL});")

audio = ""
if have_vo:
    parts, filt = [], []
    for k, f in enumerate(lines):
        parts += ["-i", f]; filt.append(f"[{k}]adelay={int(vo_at[k] * 1000)}:all=1[a{k}]")
    filt.append("".join(f"[a{k}]" for k in range(len(lines))) + f"amix=inputs={len(lines)}:normalize=0,apad=whole_dur={TOTAL}[o]")
    subprocess.run(["ffmpeg", "-y", "-v", "error", *parts, "-filter_complex", ";".join(filt), "-map", "[o]", "-t", str(TOTAL), "-ar", "48000", "public/voice.wav"], check=True)
    audio += f'<audio id="vo" class="clip" data-audio-group="voiceover" src="public/voice.wav" data-start="0" data-media-start="0" data-duration="{TOTAL}" data-track-index="3" data-volume="1.0"></audio>\n'
if os.path.exists("public/bed.wav"):
    audio += (f'<audio id="bed" class="clip" data-audio-group="music" src="public/bed.wav" data-start="0" data-media-start="0" data-duration="{TOTAL}" data-track-index="4" '
              f'data-volume="0.26" data-fade-in="0.05" data-fade-out="1.2" data-fx-carve=\'{{"enabled":true,"sources":["voiceover"],"strength":0.5}}\'></audio>\n')

html = open(os.path.join(MASTER, "index.tmpl.html")).read()
for k, v in {"TOTAL": str(TOTAL), "SHOTS": shots_html, "PLATES": plates, "CARDS": cards, "WIPES": wipes, "AUDIO": audio,
             "KICKER": CFG.get("kicker", "LOMPOC · TONIGHT"), "SUB": CFG["sub"], "CREDIT": CFG.get("credit", ""), "JS": "\n  ".join(js)}.items():
    html = html.replace("{{" + k + "}}", v)
open("index.html", "w").write(html)
json.dump({"total": TOTAL, "intro": INTRO, "stops": seg, "ask": ASK, "end": END, "vo_at": vo_at, "have_vo": have_vo}, open("timeline.json", "w"), indent=1)
print("total", TOTAL, "vo", have_vo, "stops", [round(x, 2) for x in seg])
