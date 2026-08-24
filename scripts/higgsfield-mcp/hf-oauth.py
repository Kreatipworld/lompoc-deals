#!/usr/bin/env python3
"""Standalone OAuth client for mcp.higgsfield.ai.

Registers a client via DCR, prints the authorize URL, listens for the
callback on localhost, exchanges the code, and writes tokens to
hf-token.json. Ignores the (buggy) iss parameter on the callback.
"""
import base64
import hashlib
import json
import os
import secrets
import sys
import urllib.parse as up
import urllib.request as ur
from http.server import BaseHTTPRequestHandler, HTTPServer

BASE = "https://mcp.higgsfield.ai"
DIR = os.path.dirname(os.path.abspath(__file__))
PORT = 3987
REDIRECT_URI = f"http://localhost:{PORT}/callback"


def post_json(url, payload, headers=None):
    data = json.dumps(payload).encode()
    req = ur.Request(url, data=data, headers={"Content-Type": "application/json", **(headers or {})})
    with ur.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode())


def post_form(url, payload):
    data = up.urlencode(payload).encode()
    req = ur.Request(url, data=data, headers={"Content-Type": "application/x-www-form-urlencoded"})
    with ur.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode())


def main():
    # 1. Dynamic client registration
    reg = post_json(f"{BASE}/oauth2/register", {
        "client_name": "lompoc-locals-vo",
        "redirect_uris": [REDIRECT_URI],
        "grant_types": ["authorization_code", "refresh_token"],
        "response_types": ["code"],
        "token_endpoint_auth_method": "none",
        "scope": "openid email offline_access",
    })
    client_id = reg["client_id"]
    print(f"REGISTERED client_id={client_id}", flush=True)

    # 2. PKCE + state
    verifier = base64.urlsafe_b64encode(secrets.token_bytes(48)).rstrip(b"=").decode()
    challenge = base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).rstrip(b"=").decode()
    state = secrets.token_urlsafe(24)

    auth_url = f"{BASE}/oauth2/authorize?" + up.urlencode({
        "response_type": "code",
        "client_id": client_id,
        "code_challenge": challenge,
        "code_challenge_method": "S256",
        "redirect_uri": REDIRECT_URI,
        "state": state,
        "scope": "openid email offline_access",
        "resource": f"{BASE}/mcp",
    })
    with open(os.path.join(DIR, "hf-auth-url.txt"), "w") as f:
        f.write(auth_url)
    print(f"AUTH_URL {auth_url}", flush=True)

    # 3. Listen for the callback
    result = {}

    class Handler(BaseHTTPRequestHandler):
        def do_GET(self):
            u = up.urlsplit(self.path)
            if u.path != "/callback":
                self.send_response(404)
                self.end_headers()
                return
            q = dict(up.parse_qsl(u.query))
            result.update(q)
            self.send_response(200)
            self.send_header("Content-Type", "text/html")
            self.end_headers()
            self.wfile.write(b"<h2>Done \xe2\x80\x94 you can close this tab and return to Claude.</h2>")

        def log_message(self, *a):
            pass

    srv = HTTPServer(("127.0.0.1", PORT), Handler)
    srv.timeout = 600
    while "code" not in result and "error" not in result:
        srv.handle_request()
    srv.server_close()

    if "error" in result:
        print(f"AUTH_ERROR {result}", flush=True)
        sys.exit(1)
    if result.get("state") != state:
        print(f"STATE_MISMATCH got={result.get('state')}", flush=True)
        sys.exit(1)
    print("CALLBACK_RECEIVED (iss ignored)", flush=True)

    # 4. Exchange the code
    tok = post_form(f"{BASE}/oauth2/token", {
        "grant_type": "authorization_code",
        "code": result["code"],
        "redirect_uri": REDIRECT_URI,
        "client_id": client_id,
        "code_verifier": verifier,
        "resource": f"{BASE}/mcp",
    })
    tok["_client_id"] = client_id
    with open(os.path.join(DIR, "hf-token.json"), "w") as f:
        json.dump(tok, f, indent=2)
    print("TOKEN_SAVED hf-token.json", flush=True)


if __name__ == "__main__":
    main()
