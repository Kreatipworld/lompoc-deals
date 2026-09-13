"""Thin Higgsfield helper around hf-mcp.py (durable copy — the scratchpad one vanishes).

  python3 hf.py balance
  python3 hf.py cost   "<text>"            # Dylan preflight
  python3 hf.py submit "<text>"            # Dylan (text2speech_v2 / elevenlabs)
  python3 hf.py status <jobId>
  python3 hf.py raw <tool> '{"params":{...}}'
"""
import json, os, subprocess, sys

CLI = os.path.join(os.path.dirname(os.path.abspath(__file__)), "hf-mcp.py")
V = "b847bc29-f184-583a-8ad9-d1f1e16d1a60"  # Dylan


def _run(args, timeout):
    try:
        return subprocess.run(["python3", CLI] + args, capture_output=True, text=True, timeout=timeout)
    except subprocess.TimeoutExpired:
        return None


def call(tool, args, timeout=45):
    for attempt in range(2):
        r = _run(["call", tool, json.dumps(args)], timeout)
        if r is None:
            return {"text": "TIMEOUT"}
        out, err = r.stdout, r.stderr
        if attempt == 0 and ("401" in err or "expired" in out.lower() or "unauthorized" in (out + err).lower()):
            _run(["refresh"], 60)
            continue
        try:
            d = json.loads(out[out.index("{"):]) if "{" in out else {}
        except Exception:
            return {"text": (out + err)[-1200:]}
        res = d.get("result", d)
        parts = res.get("content") if isinstance(res, dict) else None
        if isinstance(parts, list):
            return {"text": "\n".join(p.get("text", "") for p in parts if isinstance(p, dict))}
        return {"text": json.dumps(res)[:2000]} if res else {"text": (out + err)[-1200:]}
    return {"text": ""}


def tts_args(prompt, get_cost=False):
    p = {"model": "text2speech_v2", "variant": "elevenlabs", "prompt": prompt, "voice_type": "preset", "voice_id": V}
    if get_cost:
        p["get_cost"] = True
    else:
        p["use_unlim"] = False
    return {"params": p}


if __name__ == "__main__":
    cmd = sys.argv[1]
    if cmd == "balance":
        print(json.dumps(call("balance", {})))
    elif cmd == "cost":
        print(json.dumps(call("generate_audio", tts_args(sys.argv[2], True)))[:600])
    elif cmd == "submit":
        print(json.dumps(call("generate_audio", tts_args(sys.argv[2])))[:1200])
    elif cmd == "status":
        print(json.dumps(call("job_status", {"jobId": sys.argv[2], "sync": True}, timeout=200))[:2000])
    elif cmd == "raw":
        print(json.dumps(call(sys.argv[2], json.loads(sys.argv[3]), timeout=120))[:2000])
    elif cmd == "refresh":
        print(_run(["refresh"], 60).stdout[-300:])
