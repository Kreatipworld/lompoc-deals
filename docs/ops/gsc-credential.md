# Search Console API credential (one-time, owner) — Sep 30 2026

Keyword position tracking reads Google Search Console through a service account. Ten minutes, once.

1. Go to https://console.cloud.google.com → pick (or create) a project, e.g. "Lompoc Locals".
2. APIs & Services → Library → search **"Google Search Console API"** → Enable.
3. IAM & Admin → **Service Accounts** → Create service account → name `gsc-reader` → Done
   (no roles needed). Open it → **Keys** → Add key → Create new key → **JSON** → it downloads a file.
4. Copy the service account's email (looks like `gsc-reader@<project>.iam.gserviceaccount.com`).
5. https://search.google.com/search-console → property **lompoclocals.com** (domain) →
   Settings → **Users and permissions** → Add user → paste that email → permission **Full** → Add.
6. Put the key in the env (never in chat, never committed):
   ```bash
   # in the repo, with the downloaded file path:
   printf 'GSC_SERVICE_ACCOUNT_JSON=%s\nGSC_SITE_URL=sc-domain:lompoclocals.com\n' "$(base64 -i ~/Downloads/<key>.json | tr -d '\n')" >> .env.local
   ```
   Then add the same two variables to the Vercel project (Settings → Environment Variables →
   Production) — the daily cron runs there.
7. Tell Claude "credential is in" → it runs the 120-day backfill, seeds the tracked keywords, and
   opens /admin/seo with real positions.
