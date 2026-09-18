import re, sys, time, subprocess
sys.path.insert(0, "scripts/higgsfield-mcp"); import hf
OUT = "content/social/video/dinner-board/public"
what = sys.argv[1]

def poll(jid, name, tries=14, wait=6):
    for _ in range(tries):
        s = hf.call("job_status", {"jobId": jid, "sync": True}, timeout=200)["text"]
        m = re.search(r"https?://\S+\.(?:wav|mp3|m4a)\S*", s)
        if m:
            url = m.group(0).rstrip('",)')
            subprocess.run(["curl", "-sL", "-o", f"{OUT}/{name}.src", url], check=True)
            print(name, "OK"); return True
        print(name, "…", s[:110]); time.sleep(wait)
    print("FAIL", name); return False

if what == "vo":
    r = hf.call("list_voices", {}, timeout=60)["text"]
    m = re.search(r"Cillian[^\n]*?([0-9a-f]{8}-[0-9a-f-]{27})", r) or re.search(r"([0-9a-f]{8}-[0-9a-f-]{27})[^\n]*Cillian", r)
    vid = m.group(1) if m else None
    print("cillian", vid, file=sys.stderr)
    if not vid: print(r[:1500]); sys.exit(1)
    TEXT = ("It's Friday night. You still haven't decided. "
            "Every kitchen in Lompoke still serving. "
            "Members first. "
            "Then fifty more, all over town. "
            "Dinner in Lompoke. Pick one at lompoclocals dot com slash dinner.")
    INSTR = "Warm dry matter-of-fact narrator, relaxed, natural breathing, unhurried"
    for attempt in range(4):
        t = hf.call("generate_audio", {"params": {"model": "qwen_audio_tts", "prompt": TEXT, "voice_type": "preset",
                    "voice_id": vid, "instruction": INSTR, "language": "en", "use_unlim": False}}, timeout=90)["text"]
        jid = hf.job_id(t)
        if jid: break
        print("retry", attempt, t[:200], file=sys.stderr); time.sleep(2)
    else:
        print("FAIL submit vo"); sys.exit(1)
    print("vo job", jid, file=sys.stderr); poll(jid, "vo-raw")
else:
    P = ("Warm Friday-evening groove instrumental: rounded electric bass, brushed drums, soft Rhodes chords, "
         "a little late-night swing, relaxed and inviting, no vocals")
    for attempt in range(3):
        t = hf.call("generate_audio", {"params": {"model": "sonilo_music", "prompt": P, "duration": 24, "use_unlim": False}}, timeout=90)["text"]
        jid = hf.job_id(t)
        if jid: break
        print("retry", attempt, t[:200], file=sys.stderr); time.sleep(2)
    else:
        print("FAIL submit bed"); sys.exit(1)
    print("bed job", jid, file=sys.stderr); poll(jid, "bed-raw", tries=18, wait=8)
