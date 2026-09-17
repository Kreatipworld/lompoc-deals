import re, sys, time, subprocess
sys.path.insert(0, "scripts/higgsfield-mcp")
import hf
PROMPT = "Stadium football hype promo bed: driving marching drumline, big brass stabs, crowd energy swells, cinematic sports broadcast intro, no vocals, confident and triumphant"
t = hf.call("generate_audio", {"params": {"model": "sonilo_music", "prompt": PROMPT, "duration": 26, "use_unlim": False}}, timeout=90)["text"]
print(t[:600], file=sys.stderr)
jm = re.search(r" - ([0-9a-f-]{36})", t) or re.search(r"([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})", t)
if not jm: print("FAIL submit", t); sys.exit(1)
jid = jm.group(1); print("job", jid, file=sys.stderr)
for _ in range(12):
    s = hf.call("job_status", {"jobId": jid, "sync": True}, timeout=200)["text"]
    um = re.search(r"https?://\S+\.(?:wav|mp3|m4a)\S*", s)
    if um:
        url = um.group(0).rstrip('",)')
        subprocess.run(["curl", "-sL", "-o", "content/social/video/football-hub/public/bed.src", url], check=True)
        print("bed OK", url); sys.exit(0)
    print("status", s[:300], file=sys.stderr); time.sleep(8)
print("FAIL status", s[:800]); sys.exit(1)
