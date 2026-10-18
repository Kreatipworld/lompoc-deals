import sys, json
sys.path.insert(0, "/home/orchestra/Projects/lompoc-deals/scripts/higgsfield-mcp")
from hf import call, job_id
MAEVE = "64cf4f1a-61c8-5938-9aea-83d12b2e1d13"
VO = {
 "guess": "Football Friday! The Braves host Nipomo. Cabreeyo plays at Santa Ynez. Guess both final scores in the comments. Closest guess gets a shout-out Saturday!",
 "gameday": "Game day, Lompoke! Seven o'clock, the six-and-one Braves host Nipomo at Hike Stadium. Cabreeyo, unbeaten in league, plays at Santa Ynez. Eat first at Eddie's, Toro Loco or Eye on I. Then pack Hike tonight! Scores at Lompoke Locals dot com slash football.",
}
BED = {
 "guess": ("Playful game-show countdown music, marching band snare rolls, tuba bounce, clock ticks, quirky and fun, upbeat, no vocals", 10),
 "gameday": ("High school marching band drumline cadence fused with a hard modern trap beat, brass hits, crowd claps, Friday night lights energy, no vocals", 19),
}
mode = sys.argv[1]  # cost | submit
gc = mode == "cost"
out = {}
for k, t in VO.items():
    p = {"model": "text2speech_v2", "variant": "elevenlabs", "prompt": t, "voice_type": "preset", "voice_id": MAEVE}
    p.update({"get_cost": True} if gc else {"use_unlim": False})
    r = call("generate_audio", {"params": p}, timeout=90)["text"]
    print("VO", k, "→", r[:300].replace("\n", " | ")); out["vo_" + k] = job_id(r)
for k, (pr, d) in BED.items():
    p = {"model": "sonilo_music", "prompt": pr, "duration": d}
    p.update({"get_cost": True} if gc else {"use_unlim": False})
    r = call("generate_audio", {"params": p}, timeout=90)["text"]
    print("BED", k, "→", r[:300].replace("\n", " | ")); out["bed_" + k] = job_id(r)
if not gc: json.dump(out, open("/tmp/claude-1000/-home-orchestra-Projects-lompoc-deals/7b4509c9-0987-499e-bc2c-c54c6ec6de9b/scratchpad/fbf/jobs.json", "w")); print(out)
