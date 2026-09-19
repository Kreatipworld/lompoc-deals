import re, sys, time, subprocess
sys.path.insert(0, "scripts/higgsfield-mcp"); import hf
OUT = "content/social/video/comeshome/public"
what = sys.argv[1]
def poll(jid, name, tries=16, wait=7):
    for _ in range(tries):
        s = hf.call("job_status", {"jobId": jid, "sync": True}, timeout=200)["text"]
        m = re.search(r"https?://\S+\.(?:wav|mp3|m4a)\S*", s)
        if m:
            subprocess.run(["curl","-sL","-o",f"{OUT}/{name}.src", m.group(0).rstrip('",)')], check=True)
            print(name,"OK"); return True
        time.sleep(wait)
    print("FAIL", name); return False
if what == "vo":
    CILLIAN = "d8ba9f14-8a24-44db-932b-99e16c45bd32"
    TEXT = ("Tonight, a Lompoke kid comes home. Napoleon Kaufman. "
            "Lompoke High, class of ninety. Five thousand, one hundred fifty one yards. Eighty six touchdowns. "
            "A first round pick. Six seasons with the Raiders. "
            "Tonight he coaches Dublin, back at Hike Stadium. Welcome home, coach.")
    INSTR = "Warm storyteller, proud and unhurried, natural breathing, cinematic"
    for a in range(4):
        t = hf.call("generate_audio", {"params":{"model":"qwen_audio_tts","prompt":TEXT,"voice_type":"preset",
            "voice_id":CILLIAN,"instruction":INSTR,"language":"en","use_unlim":False}}, timeout=90)["text"]
        jid = hf.job_id(t)
        if jid: break
        time.sleep(2)
    else: print("FAIL submit vo"); sys.exit(1)
    print("vo job", jid, file=sys.stderr); poll(jid, "vo-raw")
else:
    P = ("Cinematic hometown sports story: warm piano motif, slow strings swell, soft timpani, "
         "nostalgic and proud building to uplifting, no vocals")
    for a in range(3):
        t = hf.call("generate_audio", {"params":{"model":"sonilo_music","prompt":P,"duration":24,"use_unlim":False}}, timeout=90)["text"]
        jid = hf.job_id(t)
        if jid: break
        time.sleep(2)
    else: print("FAIL submit bed"); sys.exit(1)
    print("bed job", jid, file=sys.stderr); poll(jid, "bed-raw", tries=20, wait=8)
