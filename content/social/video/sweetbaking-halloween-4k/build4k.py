# Sweet Baking Co. Halloween v3 + sign first (owner Oct 23) — 4K (2160x3840) rebuild of the 29.0s master Andres sent (build3-v3.py, Linux, Oct 22 2026).
# Owner, Oct 23: "i want that video in 4k" / "Exactly the same." The Linux master was cut from Telegram copies
# (464x848). Same edit, text, timings and graphics; audio copied bit-for-bit from his file; every pixel value x2; sources are the iPhone 4K HDR
# originals (tone-mapped HLG -> SDR bt709); menu re-flattened from the full-res HEIC (assets/menu-flat-4k.png).
import subprocess, os, sys
H = os.path.dirname(os.path.abspath(__file__)); os.chdir(H)
for d in ("seg4k", "txt", "masters"): os.makedirs(d, exist_ok=True)
SRC = "/Volumes/Seagate Expansion Drive/VIdeo/"
CLIPS = {"clip1.mov": SRC + "IMG_2928.MOV", "clip2.mov": SRC + "IMG_2929.MOV", "clip3.mov": SRC + "IMG_2931.MOV",
         "clip4.mov": SRC + "IMG_2933.MOV", "clip5.mov": SRC + "IMG_2936.MOV", "clip6.mov": "hq/clip6.mov"}
K = 2
W, HH = 1080 * K, 1920 * K
CR, FR, FI = "assets/Creepster.ttf", "assets/Fraunces.ttf", "assets/Fraunces-Italic.ttf"
OR, XF = "0xFF7A1A", 0.3
ENC = ["-c:v", "libx264", "-preset", "medium", "-crf", "17", "-pix_fmt", "yuv420p", "-r", "30"]
n = 0
def tf(s):
    global n; n += 1; p = f"txt/k{n}.txt"; open(p, "w").write(s); return p
def dt(text, font, size, color, y, t0, t1, border=6):
    size, y, border = size * K, y * K, border * K
    a = f"if(lt(t,{t0}+0.25),max(0,(t-{t0})/0.25),if(gt(t,{t1}-0.15),max(0,({t1}-t)/0.15),1))"
    yy = f"{y}+{60*K}*max(0,1-(t-{t0})/0.3)" if t0 >= 0 else str(y)
    return (f"drawtext=fontfile={font}:textfile={tf(text)}:fontsize={size}:fontcolor={color}:borderw={border}:bordercolor=black@0.85"
            f":shadowx=0:shadowy={6*K}:shadowcolor=black@0.5:x=(w-text_w)/2:y='{yy}':enable='between(t,{t0},{t1})':alpha='{a}'")
def push(dur, out=False):
    f = int(dur * 30)
    z = f"1.09-0.09*on/{f}" if out else f"1+0.09*on/{f}"
    return f"zoompan=z='{z}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s={W}x{HH}:fps=30"
# HLG HDR -> SDR bt709 (the Telegram copies the v4 look was graded on were already SDR)
TONE = "zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p"
BASE = f"{TONE},scale={W}:-2:flags=lanczos,crop={W}:{HH},setsar=1,fps=30,eq=contrast=1.07:saturation=1.08"
def drip(y, t0, t1):
    return ("assets/drip.png", f"scale={600*K}:-1", f"-{720*K}+min(1,max(0,(t-{t0})/0.35))*(W/2-{300*K}+{720*K})", str(y * K), f"between(t,{t0},{t1})")
def bat(t0, t1, y, size, speed, phase=0):
    return ("assets/bat.png", f"scale={size*K}:-1", f"W-(t-{t0})*{speed*K}", f"{y*K}+{35*K}*sin(t*7+{phase})", f"between(t,{t0},{t1})")
WEB_L = ("assets/web.png", f"scale={330*K}:-1,format=rgba,colorchannelmixer=aa=0.85", "0", "0", "1")
WEB_R = ("assets/web.png", f"scale={330*K}:-1,hflip,format=rgba,colorchannelmixer=aa=0.85", "W-w", "0", "1")
def render(name, inputs, vf, overlays, dur):
    args = ["ffmpeg", "-v", "error", "-y"] + inputs
    for o in overlays: args += ["-loop", "1", "-i", o[0]]
    fc = f"[0]{vf}[v0]"
    for i, o in enumerate(overlays, 1):
        fc += f";[{i}]{o[1]}[g{i}];[v{i-1}][g{i}]overlay=x='{o[2]}':y='{o[3]}':enable='{o[4]}':shortest=1[v{i}]"
    subprocess.run(args + ["-filter_complex", fc, "-map", f"[v{len(overlays)}]", "-t", str(dur), "-an"] + ENC + [f"seg4k/{name}.mp4"], check=True)
    print("seg", name, flush=True)
def clip(name, src, ss, dur, texts, overlays=(), out=False, extra=""):
    vf = ",".join([BASE, push(dur, out)] + ([extra] if extra else []) + ["vignette=PI/4.5"] + texts)
    render(name, ["-ss", str(ss), "-t", str(dur), "-i", CLIPS[src]], vf, list(overlays), dur)
only = sys.argv[1:]  # optional: render just these segments (e.g. s1) for a look test
def want(s): return not only or s in only
D = [5.6, 3.6, 4.0, 5.2, 2.0, 2.4, 4.3, 4.0]   # v3 timeline (the 29.0s master Andres sent, "MASTER (2)")
# Owner Oct 23: "I want the signs as a first shot ... is the only change I need": the sign footage (clip1) and the
# skull shelf (clip3) swap places; every text, overlay, timing and the soundtrack stay exactly where they were.
if want("s1"): clip("s1", "clip1.mov", 0.0, D[0], [dt("HALLOWEEN", CR, 190, OR, 330, -1, 0.6, 8), dt("at Sweet Baking Co.", FI, 78, "white", 560, -1, 0.6),
     dt("Lompoc, CA", FR, 50, "white", 670, -1, 0.6, 4), dt("SOMETHING SWEET", CR, 120, OR, 300, 0.6, D[0]),
     dt("is haunting North H Street...", FI, 62, "white", 545, 1.4, D[0])],
     [WEB_L, drip(432, 0.8, D[0]), bat(1.0, D[0], 700, 380, 520), bat(1.6, D[0], 1000, 260, 640, 2)])
if want("s2"): clip("s2", "clip3.mov", 0.0, D[1], [dt("FULL HALLOWEEN", CR, 128, OR, 300, 0.1, D[1]), dt("at Sweet Baking Co.", FI, 66, "white", 545, 0.5, D[1])],
     [drip(432, 0.3, D[1]), bat(0.2, D[1], 760, 320, 600, 1)], out=True)
if want("s3"): clip("s3", "clip2.mov", 1.0, D[2], [dt("SPOOKY RED VELVET", CR, 104, OR, 280, 0.1, 2.05), dt("MIDNIGHT MINT OREO", CR, 104, OR, 280, 2.05, D[2])],
     [WEB_R, drip(400, 0.3, D[2])])
if want("s4"): clip("s4", "clip4.mov", 0.5, D[3], [dt("MYSTERY CUPCAKE", CR, 120, OR, 300, 0.1, D[3]), dt("What's inside?", FI, 70, "white", 545, 1.9, D[3])],
     [drip(432, 0.4, D[3])], out=True)
if want("s5a"):
    mv = (f"[1]crop=iw-{14*K}:ih-{10*K}:{4*K}:{4*K},scale={880*K}:-1,pad=iw+{24*K}:ih+{24*K}:{12*K}:{12*K}:color=0xFF7A1A[c];[0][c]overlay=(W-w)/2:{470*K},"
          + push(D[4]) + ",vignette=PI/6," + dt("SEASONAL DRINKS", CR, 120, OR, 230, 0.0, D[4]))
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", f"color=c=0x2A0632:s={W}x{HH}:r=30:d={D[4]}", "-i", "assets/menu-flat-4k.png",
        "-filter_complex", mv, "-t", str(D[4])] + ENC + ["seg4k/s5a.mp4"], check=True); print("seg s5a", flush=True)
if want("s5b"): clip("s5b", "clip5.mov", 2.3, D[5], [dt("PUMPKIN IN EVERY CUP", CR, 100, OR, 300, 0.1, D[5])], [drip(415, 0.3, D[5])])
if want("s6"): clip("s6", "clip6.mov", 0.05, D[6], [dt("SMALL BATCHES", CR, 124, OR, 300, 0.1, D[6]), dt("when they're gone, they're gone", FI, 58, "white", 545, 1.2, D[6])],
     [drip(432, 0.3, D[6])], out=True)
if want("s7"):
    endvf = ",".join(["format=yuv420p", "vignette=PI/3.5", dt("322 N H St, Lompoc", FR, 70, "white", 1010, 0.2, D[7], 5),
        dt("Tue-Fri 11-5  ·  Sat 11-3", FR, 52, "white", 1105, 0.4, D[7], 4), dt("IF YOU DARE...", CR, 130, OR, 1250, 1.0, D[7]),
        dt("lompoclocals.com", FR, 46, "white", 1560, 0.2, D[7], 4)])
    render("s7", ["-f", "lavfi", "-i", f"color=c=0x2A0632:s={W}x{HH}:r=30:d={D[7]}"], endvf,
           [("assets/sbc-logo.png", f"scale={640*K}:-1,pad=iw+{80*K}:ih+{60*K}:{40*K}:{30*K}:white,format=rgba", "(W-w)/2", f"{360*K}-{80*K}*max(0,1-t/0.35)", "1"),
            WEB_L, WEB_R, bat(0.3, D[7], 1360, 340, 480), bat(0.9, D[7], 1680, 240, 560, 3)], D[7])
if only and only != ["join"]: sys.exit(0)  # "join" = skip segments, just xfade + mux
segs = ["s1", "s2", "s3", "s4", "s5a", "s5b", "s6", "s7"]
kinds = ["fadeblack", "circleopen", "slideleft", "fadewhite", "wipeup", "smoothleft", "fadeblack"]
args = ["ffmpeg", "-v", "error", "-y"]
for s in segs: args += ["-i", f"seg4k/{s}.mp4"]
fc, prev, off = "", "[0]", 0.0
for i in range(1, len(segs)):
    off += D[i-1] - XF
    fc += f"{prev}[{i}]xfade=transition={kinds[i-1]}:duration={XF}:offset={off:.3f}[x{i}];"
    prev = f"[x{i}]"
subprocess.run(args + ["-filter_complex", fc.rstrip(";"), "-map", prev] + ENC + ["seg4k/video.mp4"], check=True)
REF = "/Users/kreatip/Downloads/Telegram Desktop/sweet-baking-halloween-MASTER (2).mp4"   # soundtrack copied bit-for-bit
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "seg4k/video.mp4", "-i", REF, "-map", "0:v", "-map", "1:a", "-t", "29.0",
    "-c", "copy", "-movflags", "+faststart", "masters/sweet-baking-halloween-MASTER-4K.mp4"], check=True)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "masters/sweet-baking-halloween-MASTER-4K.mp4", "-frames:v", "1", "-q:v", "2", "masters/cover-4k.jpg"], check=True)
print("ok")
