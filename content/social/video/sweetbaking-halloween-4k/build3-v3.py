# Sweet Baking Co. Halloween v3 (Oct 22 2026). Andres: "don't repeat scenes", "drinks look just square",
# "add motion and graphics". Push-ins on every shot, sliding captions + slime drip, bats, cobwebs, xfades.
import subprocess, os
H = os.path.dirname(os.path.abspath(__file__)); os.chdir(H)
for d in ("seg", "txt", "masters"): os.makedirs(d, exist_ok=True)
CR, FR, FI = "assets/Creepster.ttf", "assets/Fraunces.ttf", "assets/Fraunces-Italic.ttf"
OR, XF = "0xFF7A1A", 0.3
ENC = ["-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p", "-r", "30"]
n = 0
def tf(s):
    global n; n += 1; p = f"txt/t{n}.txt"; open(p, "w").write(s); return p
def dt(text, font, size, color, y, t0, t1, border=6):
    a = f"if(lt(t,{t0}+0.25),max(0,(t-{t0})/0.25),if(gt(t,{t1}-0.15),max(0,({t1}-t)/0.15),1))"
    yy = f"{y}+60*max(0,1-(t-{t0})/0.3)" if t0 >= 0 else str(y)
    return (f"drawtext=fontfile={font}:textfile={tf(text)}:fontsize={size}:fontcolor={color}:borderw={border}:bordercolor=black@0.85"
            f":shadowx=0:shadowy=6:shadowcolor=black@0.5:x=(w-text_w)/2:y='{yy}':enable='between(t,{t0},{t1})':alpha='{a}'")
def push(dur, out=False):
    f = int(dur * 30)
    z = f"1.09-0.09*on/{f}" if out else f"1+0.09*on/{f}"
    return f"zoompan=z='{z}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1080x1920:fps=30"
BASE = "scale=1080:-2:flags=lanczos,crop=1080:1920,setsar=1,fps=30,eq=contrast=1.07:saturation=1.08"
# overlays: (png, filter for the png, x expr, y expr, enable)
def drip(y, t0, t1):
    return ("assets/drip.png", "scale=600:-1", f"-720+min(1,max(0,(t-{t0})/0.35))*(W/2-300+720)", str(y), f"between(t,{t0},{t1})")
def bat(t0, t1, y, size, speed, phase=0):
    return ("assets/bat.png", f"scale={size}:-1", f"W-(t-{t0})*{speed}", f"{y}+35*sin(t*7+{phase})", f"between(t,{t0},{t1})")
WEB_L = ("assets/web.png", "scale=330:-1,format=rgba,colorchannelmixer=aa=0.85", "0", "0", "1")
WEB_R = ("assets/web.png", "scale=330:-1,hflip,format=rgba,colorchannelmixer=aa=0.85", "W-w", "0", "1")
def render(name, inputs, vf, overlays, dur):
    args = ["ffmpeg", "-v", "error", "-y"] + inputs
    for o in overlays: args += ["-loop", "1", "-i", o[0]]
    fc = f"[0]{vf}[v0]"
    for i, o in enumerate(overlays, 1):
        fc += f";[{i}]{o[1]}[g{i}];[v{i-1}][g{i}]overlay=x='{o[2]}':y='{o[3]}':enable='{o[4]}':shortest=1[v{i}]"
    subprocess.run(args + ["-filter_complex", fc, "-map", f"[v{len(overlays)}]", "-t", str(dur), "-an"] + ENC + [f"seg/{name}.mp4"], check=True)
def clip(name, src, ss, dur, texts, overlays=(), out=False, extra=""):
    vf = ",".join([BASE, push(dur, out)] + ([extra] if extra else []) + ["vignette=PI/4.5"] + texts)
    render(name, ["-ss", str(ss), "-t", str(dur), "-i", "raw/" + src], vf, list(overlays), dur)
D = [5.6, 3.6, 4.0, 5.2, 2.0, 2.4, 4.3, 4.0]   # each +XF except the last; cuts land where they did in v2
clip("s1", "clip3.mov", 0.0, D[0], [dt("HALLOWEEN", CR, 190, OR, 330, -1, 0.6, 8), dt("at Sweet Baking Co.", FI, 78, "white", 560, -1, 0.6),
     dt("Lompoc, CA", FR, 50, "white", 670, -1, 0.6, 4), dt("SOMETHING SWEET", CR, 120, OR, 300, 0.6, D[0]),
     dt("is haunting North H Street...", FI, 62, "white", 470, 1.4, D[0])],
     [WEB_L, drip(440, 0.8, D[0]), bat(1.0, D[0], 760, 230, 520), bat(1.6, D[0], 980, 150, 640, 2)])
clip("s2", "clip1.mov", 1.0, D[1], [dt("FULL HALLOWEEN", CR, 128, OR, 300, 0.1, D[1]), dt("at Sweet Baking Co.", FI, 66, "white", 475, 0.5, D[1])],
     [drip(445, 0.3, D[1]), bat(0.2, D[1], 820, 190, 600, 1)], out=True)
clip("s3", "clip2.mov", 1.0, D[2], [dt("SPOOKY RED VELVET", CR, 104, OR, 280, 0.1, 2.05), dt("MIDNIGHT MINT OREO", CR, 104, OR, 280, 2.05, D[2])],
     [WEB_R, drip(410, 0.3, D[2])])
clip("s4", "clip4.mov", 0.5, D[3], [dt("MYSTERY CUPCAKE", CR, 120, OR, 300, 0.1, D[3]), dt("What's inside?", FI, 70, "white", 470, 1.9, D[3])],
     [drip(440, 0.4, D[3])], out=True)
# fall drink menu: flattened straight-on (perspective-corrected), as a card on purple with a push-in
mv = ("[1]crop=iw-14:ih-10:4:4,scale=880:-1,pad=iw+24:ih+24:12:12:color=0xFF7A1A[c];[0][c]overlay=(W-w)/2:470,"
      + push(D[4]) + ",vignette=PI/3.5," + dt("SEASONAL DRINKS", CR, 120, OR, 230, 0.0, D[4]))
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", f"color=c=0x2A0632:s=1080x1920:r=30:d={D[4]}", "-i", "assets/menu-flat.png",
    "-filter_complex", mv, "-t", str(D[4])] + ENC + ["seg/s5a.mp4"], check=True)
clip("s5b", "clip5.mov", 2.3, D[5], [dt("PUMPKIN IN EVERY CUP", CR, 100, OR, 300, 0.1, D[5])], [drip(420, 0.3, D[5])])
clip("s6", "clip6.mov", 0.05, D[6], [dt("SMALL BATCHES", CR, 124, OR, 300, 0.1, D[6]), dt("when they're gone, they're gone", FI, 58, "white", 470, 1.2, D[6])],
     [drip(440, 0.3, D[6])], out=True)
# end card
endvf = ",".join(["format=yuv420p", "vignette=PI/3.5", dt("322 N H St, Lompoc", FR, 70, "white", 1010, 0.2, D[7], 5),
    dt("Tue-Fri 9:30-4:30  ·  Sat 11-3", FR, 52, "white", 1105, 0.4, D[7], 4), dt("IF YOU DARE...", CR, 130, OR, 1250, 1.0, D[7]),
    dt("lompoclocals.com", FR, 46, "white", 1560, 0.2, D[7], 4)])
render("s7", ["-f", "lavfi", "-i", f"color=c=0x2A0632:s=1080x1920:r=30:d={D[7]}"], endvf,
       [("assets/sbc-logo.png", "scale=640:-1,pad=iw+80:ih+60:40:30:white,format=rgba", "(W-w)/2", "360-80*max(0,1-t/0.35)", "1"),
        WEB_L, WEB_R, bat(0.3, D[7], 1380, 200, 480), bat(0.9, D[7], 1700, 140, 560, 3)], D[7])
# xfade chain
segs = ["s1", "s2", "s3", "s4", "s5a", "s5b", "s6", "s7"]
kinds = ["fadeblack", "circleopen", "slideleft", "fadewhite", "wipeup", "smoothleft", "fadeblack"]
args = ["ffmpeg", "-v", "error", "-y"]
for s in segs: args += ["-i", f"seg/{s}.mp4"]
fc, prev, off = "", "[0]", 0.0
for i in range(1, len(segs)):
    off += D[i-1] - XF
    fc += f"{prev}[{i}]xfade=transition={kinds[i-1]}:duration={XF}:offset={off:.3f}[x{i}];"
    prev = f"[x{i}]"
subprocess.run(args + ["-filter_complex", fc.rstrip(";"), "-map", prev] + ENC + ["seg/video.mp4"], check=True)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "seg/video.mp4", "-i", "audio/vo.mp3", "-i", "audio/bed-organ.m4a", "-filter_complex",
    "[1]adelay=600|600,apad[vo];[2]volume=0.2,afade=t=out:st=27.6:d=1.4[bed];[vo]asplit[v1][v2];[bed][v2]sidechaincompress=threshold=0.05:ratio=3:attack=20:release=300[bd];"
    "[v1][bd]amix=inputs=2:duration=longest:normalize=0,loudnorm=I=-14:TP=-1.5[a]",
    "-map", "0:v", "-map", "[a]", "-t", "29.0", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "masters/sweet-baking-halloween-MASTER.mp4"], check=True)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "masters/sweet-baking-halloween-MASTER.mp4", "-frames:v", "1", "-q:v", "2", "masters/cover.jpg"], check=True)
print("ok")
