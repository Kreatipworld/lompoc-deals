import sys, json, time, re
sys.path.insert(0, "scripts/higgsfield-mcp")
from hf import call
print("balance:", call("balance", {})["text"][:200])
VO = ("What's new in Lompoke. "
      "Thursday evening, Lompoke Fire knocked down a house fire on Palm Drive. Crews searched the home. No one was inside. "
      "Vandenberg reopened Surf, Wall, and Minuteman beaches early. The plover chicks have fledged. Dogs on leash. "
      "A new five hundred twenty-five thousand dollar Space Vandenberg fund is open to aerospace startups. Letters of intent are due October second. "
      "Football week at Hike Stadium: Cabreeyo hosts Righetti Thursday, and the three-and-oh Braves host Dublin Friday. Both at seven. "
      "The full stories are on Lompoke Locals dot com. Informed Lompoke, better Lompoke.")
vo_job = None
for attempt in range(5):
    r = call("generate_audio", {"params": {"model": "qwen_audio_tts", "prompt": VO, "voice_type": "preset", "voice_id": "30fc8796-ceb6-4a66-b3a7-4a145ef7f346", "instruction": "Warm natural American news narrator, clear, relaxed, steady pace.", "language": "en", "use_unlim": False}}, timeout=90)
    t = r["text"]; m = re.search(r'"?jobId"?\s*[:=]\s*"?([0-9a-f-]{8,})', t) or re.search(r'job[_ ]?id[^0-9a-f]*([0-9a-f-]{8,})', t, re.I)
    if m: vo_job = m.group(1); print("VO job", vo_job); break
    print("VO attempt", attempt, "→", t[:200].replace("\n"," ")); time.sleep(2)
r = call("generate_audio", {"params": {"model": "sonilo_music", "prompt": "Modern local TV news bulletin music bed: confident steady pulse, soft synth stabs, light electronic drums, clean and bright, no vocals, no melody solo, loopable, broadcast newsroom feel.", "duration": 32, "use_unlim": False}}, timeout=90)
t = r["text"]; m = re.search(r'"?jobId"?\s*[:=]\s*"?([0-9a-f-]{8,})', t) or re.search(r'job[_ ]?id[^0-9a-f]*([0-9a-f-]{8,})', t, re.I)
bed_job = m.group(1) if m else None
print("BED job", bed_job, "" if m else t[:300].replace("\n"," "))
json.dump({"vo": vo_job, "bed": bed_job}, open("scratchpad/jobs.json", "w"))
