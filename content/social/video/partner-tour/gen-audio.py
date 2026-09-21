"""Voiceover (one take per line) and one new music bed for the partners tour.

Arthur reads. Lompoc is respelled by the kit, never by hand.
"""
import os, re, sys, time, subprocess
sys.path.insert(0, "scripts/higgsfield-mcp"); import hf
sys.path.insert(0, "content/social/video"); from _kit import brand as B

OUT = "content/social/video/partner-tour/public"
ARTHUR = "30fc8796-ceb6-4a66-b3a7-4a145ef7f346"
INSTR = "Warm natural American narrator, confident and friendly, clear, unhurried product tour"

LINES = [
    "Lompoc Locals is one place for everything happening in Lompoc.",
    "Neighbors search it the way they talk.",
    "Every live coupon in town, on one page.",
    "Every member gets a page of their own, with their photos and their offer.",
    "On the map, your pin sits where your door is.",
    "Claim your business, and the neighbors already looking will find you.",
]

BED = ("Bright modern civic-brand underscore: warm marimba pulse, soft felt piano, "
       "airy pad, light finger snaps, gentle upright bass, optimistic and open, no vocals")


def poll(jid, name, tries=20, wait=7):
    for _ in range(tries):
        s = hf.call("job_status", {"jobId": jid, "sync": True}, timeout=200)["text"]
        m = re.search(r"https?://\S+\.(?:wav|mp3|m4a)\S*", s)
        if m:
            subprocess.run(["curl", "-sL", "-o", f"{OUT}/{name}", m.group(0).rstrip('",)')], check=True)
            print(name, "OK"); return True
        time.sleep(wait)
    print("FAIL", name); return False


def submit(params, tries=4):
    for _ in range(tries):
        t = hf.call("generate_audio", {"params": params}, timeout=90)["text"]
        jid = hf.job_id(t)
        if jid:
            return jid
        time.sleep(2)
    return None


what = sys.argv[1]
if what == "vo":
    only = [int(a) for a in sys.argv[2:]] or list(range(1, len(LINES) + 1))
    for i in only:
        text = B.for_tts(LINES[i - 1])
        jid = submit({"model": "qwen_audio_tts", "prompt": text, "voice_type": "preset",
                      "voice_id": ARTHUR, "instruction": INSTR, "language": "en", "use_unlim": False})
        if not jid:
            print("FAIL submit line", i); continue
        print("line", i, jid, "|", text, file=sys.stderr)
        poll(jid, f"line-{i}.src")
else:
    jid = submit({"model": "sonilo_music", "prompt": BED, "duration": 26, "use_unlim": False})
    if not jid:
        print("FAIL submit bed"); sys.exit(1)
    print("bed job", jid, file=sys.stderr)
    poll(jid, "bed-raw.src", tries=24, wait=8)
