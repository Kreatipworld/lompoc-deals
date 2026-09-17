import json, re, sys, time, subprocess
sys.path.insert(0, "scripts/higgsfield-mcp")
import hf
ARTHUR = None
# find Arthur id from list_voices
r = hf.call("list_voices", {}, timeout=60)["text"]
m = re.search(r"Arthur[^\n]*?([0-9a-f]{8}-[0-9a-f-]{27})", r) or re.search(r"([0-9a-f]{8}-[0-9a-f-]{27})[^\n]*Arthur", r)
ARTHUR = m.group(1) if m else None
print("arthur", ARTHUR, file=sys.stderr)
if not ARTHUR:
    print(r[:3000]); sys.exit(1)
INSTR = "NFL promo announcer: deep, punchy, confident, dramatic pauses, natural breathing, not robotic"
def gen(name, text):
    for attempt in range(4):
        t = hf.call("generate_audio", {"params": {"model": "qwen_audio_tts", "prompt": text, "voice_type": "preset", "voice_id": ARTHUR, "instruction": INSTR, "language": "en", "use_unlim": False}}, timeout=90)["text"]
        jm = re.search(r" - ([0-9a-f-]{36})", t)
        if jm: break
        print("submit attempt", attempt, t[:300], file=sys.stderr); time.sleep(2)
    else:
        print("FAIL submit", name); return
    jid = jm.group(1); print(name, "job", jid, file=sys.stderr)
    for _ in range(6):
        s = hf.call("job_status", {"jobId": jid, "sync": True}, timeout=200)["text"]
        um = re.search(r"https?://\S+\.(?:wav|mp3|m4a)\S*", s)
        if um:
            url = um.group(0).rstrip('",)')
            subprocess.run(["curl", "-sL", "-o", f"content/social/video/football-hub/public/{name}.src", url], check=True)
            print(name, "OK", url); return
        print(name, "status", s[:200], file=sys.stderr); time.sleep(5)
    print("FAIL status", name, s[:500])
BODY = "Lompoke. Kickoff is Thursday. Two home games at Hike Stadium this week. Conqs Thursday. Braves Friday. Every final score. Both schools. The morning after. The whole season, next game marked. Game stories, our videos, and where to be on Friday night. Get alerts. Send it to the group chat."
CLOSER = "Lompoke football. One page. Lompoc locals dot com, slash football."
gen("vo-body", BODY)
gen("vo-closer", CLOSER)
