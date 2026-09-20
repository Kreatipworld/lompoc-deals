import re, sys, time, subprocess
sys.path.insert(0, "scripts/higgsfield-mcp"); import hf
OUT = "content/social/video/thanks-3k/public"
what = sys.argv[1]
def poll(jid, name, tries=18, wait=7):
    for _ in range(tries):
        s = hf.call("job_status", {"jobId": jid, "sync": True}, timeout=200)["text"]
        m = re.search(r"https?://\S+\.(?:wav|mp3|m4a)\S*", s)
        if m:
            subprocess.run(["curl","-sL","-o",f"{OUT}/{name}.src", m.group(0).rstrip('",)')], check=True)
            print(name,"OK"); return True
        time.sleep(wait)
    print("FAIL", name); return False
if what == "vo":
    ARTHUR = "30fc8796-ceb6-4a66-b3a7-4a145ef7f346"  # Arthur says "Lompoke" the way the football spot does; Cillian did not
    TEXT = ("Three thousand of you follow Lompoke Locals on Instagram. "
            "Every business. Every Friday night. Every launch. Every taco. "
            "This town showed up. Thank you, Lompoke.")
    INSTR = "Warm grateful narrator, sincere and unhurried, natural breathing, close and personal"
    for a in range(4):
        t = hf.call("generate_audio", {"params":{"model":"qwen_audio_tts","prompt":TEXT,"voice_type":"preset",
            "voice_id":ARTHUR,"instruction":INSTR,"language":"en","use_unlim":False}}, timeout=90)["text"]
        jid = hf.job_id(t)
        if jid: break
        time.sleep(2)
    else: print("FAIL submit vo"); sys.exit(1)
    print("vo job", jid, file=sys.stderr); poll(jid, "vo-raw")
else:
    P = ("Warm celebratory hometown anthem: bright acoustic guitar, hand claps, uplifting strings, "
         "gentle build to a proud swell, hopeful and community-spirited, no vocals")
    for a in range(3):
        t = hf.call("generate_audio", {"params":{"model":"sonilo_music","prompt":P,"duration":18,"use_unlim":False}}, timeout=90)["text"]
        jid = hf.job_id(t)
        if jid: break
        time.sleep(2)
    else: print("FAIL submit bed"); sys.exit(1)
    print("bed job", jid, file=sys.stderr); poll(jid, "bed-raw", tries=20, wait=8)
