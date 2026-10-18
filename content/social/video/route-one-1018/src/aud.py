import sys, json
sys.path.insert(0, "/home/orchestra/Projects/lompoc-deals/scripts/higgsfield-mcp")
from hf import call, job_id
MAEVE = "64cf4f1a-61c8-5938-9aea-83d12b2e1d13"
VO = "It's Sunday market day, Lompoke! Route One Farmers Market is open right now in Vandenberg Village, until two. Seasonal produce, hand-pressed juices, pastries, honey and fresh-cut flowers. Paying with EBT? Market Match doubles it, up to fifteen dollars. Thirty-seven forty-five Constellation Road. See you there!"
BED = ("Sunny acoustic folk, bright ukulele and hand claps, light whistling melody, warm Sunday morning market vibe, upbeat, no vocals", 17)
gc = sys.argv[1] == "cost"; out = {}
p = {"model": "text2speech_v2", "variant": "elevenlabs", "prompt": VO, "voice_type": "preset", "voice_id": MAEVE}
p.update({"get_cost": True} if gc else {"use_unlim": False})
r = call("generate_audio", {"params": p}, timeout=90)["text"]; print("VO →", r[:300].replace("\n"," | ")); out["vo"] = job_id(r)
p = {"model": "sonilo_music", "prompt": BED[0], "duration": BED[1]}
p.update({"get_cost": True} if gc else {"use_unlim": False})
r = call("generate_audio", {"params": p}, timeout=90)["text"]; print("BED →", r[:300].replace("\n"," | ")); out["bed"] = job_id(r)
if not gc: json.dump(out, open("jobs.json","w")); print(out)
