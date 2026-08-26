#!/usr/bin/env python3
"""Minimal MCP streamable-HTTP client for mcp.higgsfield.ai using hf-token.json."""
import json
import os
import sys
import urllib.request as ur

DIR = os.path.dirname(os.path.abspath(__file__))
URL = "https://mcp.higgsfield.ai/mcp"
SESSION_FILE = os.path.join(DIR, "hf-mcp-session.txt")

with open(os.path.join(DIR, "hf-token.json")) as f:
    TOKEN = json.load(f)["access_token"]


def rpc(payload, session_id=None):
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
        "Authorization": f"Bearer {TOKEN}",
    }
    if session_id:
        headers["Mcp-Session-Id"] = session_id
    req = ur.Request(URL, data=json.dumps(payload).encode(), headers=headers)
    with ur.urlopen(req, timeout=120) as r:
        sid = r.headers.get("Mcp-Session-Id")
        body = r.read().decode()
        ctype = r.headers.get("Content-Type", "")
    if "text/event-stream" in ctype:
        # take the last data: line
        datas = [l[5:].strip() for l in body.splitlines() if l.startswith("data:")]
        body = datas[-1] if datas else "{}"
    return (json.loads(body) if body.strip() else {}), sid


def get_session():
    init, sid = rpc({
        "jsonrpc": "2.0", "id": 1, "method": "initialize",
        "params": {
            "protocolVersion": "2025-03-26",
            "capabilities": {},
            "clientInfo": {"name": "lompoc-locals-vo", "version": "1.0.0"},
        },
    })
    # notify initialized
    try:
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json, text/event-stream",
            "Authorization": f"Bearer {TOKEN}",
        }
        if sid:
            headers["Mcp-Session-Id"] = sid
        req = ur.Request(URL, data=json.dumps({"jsonrpc": "2.0", "method": "notifications/initialized"}).encode(), headers=headers)
        ur.urlopen(req, timeout=30).read()
    except Exception:
        pass
    return init, sid


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "tools"
    init, sid = get_session()
    info = init.get("result", {}).get("serverInfo", {})
    print(f"# server: {info}", file=sys.stderr)
    if cmd == "tools":
        out, _ = rpc({"jsonrpc": "2.0", "id": 2, "method": "tools/list", "params": {}}, sid)
        tools = out.get("result", {}).get("tools", [])
        for t in tools:
            print(f"== {t['name']}")
            print(f"   {t.get('description','')[:300]}")
        if not tools:
            print(json.dumps(out, indent=2))
    elif cmd == "call":
        name = sys.argv[2]
        args = json.loads(sys.argv[3]) if len(sys.argv) > 3 else {}
        out, _ = rpc({"jsonrpc": "2.0", "id": 3, "method": "tools/call",
                      "params": {"name": name, "arguments": args}}, sid)
        print(json.dumps(out, indent=2))
    elif cmd == "schema":
        out, _ = rpc({"jsonrpc": "2.0", "id": 2, "method": "tools/list", "params": {}}, sid)
        for t in out.get("result", {}).get("tools", []):
            if t["name"] == sys.argv[2]:
                print(json.dumps(t, indent=2))


# --- token refresh -------------------------------------------------------
# Run `python3 hf-mcp.py refresh` when calls return "session has expired". The
# refresh_token grant works without a browser (proven 2026-08-26).
if __name__ == "__main__" and len(sys.argv) > 1 and sys.argv[1] == "refresh":
    import urllib.parse as up
    p = os.path.join(DIR, "hf-token.json")
    t = json.load(open(p))
    data = up.urlencode({"grant_type": "refresh_token", "refresh_token": t["refresh_token"],
                         "client_id": t["_client_id"], "resource": "https://mcp.higgsfield.ai/mcp"}).encode()
    req = ur.Request("https://mcp.higgsfield.ai/oauth2/token", data=data,
                     headers={"Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json"})
    new = json.loads(ur.urlopen(req, timeout=60).read())
    new["_client_id"] = t["_client_id"]
    new.setdefault("refresh_token", t["refresh_token"])
    json.dump(new, open(p, "w"), indent=2)
    print("TOKEN_REFRESHED expires_in", new.get("expires_in"))
    sys.exit(0)


if __name__ == "__main__":
    main()
