import re, sys, time, subprocess
sys.path.insert(0, "scripts/higgsfield-mcp"); import hf
OUT = "content/social/video/launch-alert/public"
what = sys.argv[1]
def poll(jid, name, tries=16, wait=6):
    for _ in range(tries):
        s = hf.call("job_status", {"jobId": jid, "sync": True}, timeout=200)["text"]
        m = re.search(r"https?://\S+\.(?:wav|mp3|m4a)\S*", s)
        if m:
            subprocess.run(["curl","-sL","-o",f"{OUT}/{name}.src", m.group(0).rstrip('",)')], check=True)
            print(name,"OK"); return True
        time.sleep(wait)
    print("FAIL", name); return False
if what == "vo":
    ARTHUR = "30fc8796-ceb6-4a66-b3a7-4a145ef7f346"
    TEXT = ("Heads up, Lompoke. Tonight at six forty seven, a Falcon nine lifts off from Vandenberg. "
            "Twenty seven Starlink satellites. Look southwest. "
            "Launch times shift, so check before you step outside.")
    INSTR = "Urgent broadcast alert announcer, clear and steady, not shouting, natural breathing"
    for a in range(4):
        t = hf.call("generate_audio", {"params":{"model":"qwen_audio_tts","prompt":TEXT,"voice_type":"preset",
            "voice_id":ARTHUR,"instruction":INSTR,"language":"en","use_unlim":False}}, timeout=90)["text"]
        jid = hf.job_id(t)
        if jid: break
        time.sleep(2)
    else: print("FAIL submit vo"); sys.exit(1)
    print("vo job", jid, file=sys.stderr); poll(jid, "vo-raw")
else:
    P = ("Countdown tension bed: low pulsing synth, ticking percussion, rising strings, "
         "cinematic space launch anticipation resolving to awe, no vocals")
    for a in range(3):
        t = hf.call("generate_audio", {"params":{"model":"sonilo_music","prompt":P,"duration":20,"use_unlim":False}}, timeout=90)["text"]
        jid = hf.job_id(t)
        if jid: break
        time.sleep(2)
    else: print("FAIL submit bed"); sys.exit(1)
    print("bed job", jid, file=sys.stderr); poll(jid, "bed-raw", tries=20, wait=8)
