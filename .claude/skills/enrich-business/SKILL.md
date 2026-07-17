---
name: enrich-business
description: Enrich a Lompoc Locals business profile with accurate, verifiable data — curated Google photos, factual about text, verified contacts, socials. Use when asked to revamp/enrich/fix a business profile or listing, or to run an enrichment sweep over many businesses.
---

# Enrich a business profile (accuracy-first playbook)

Lompoc Locals wins by being the most **accurate** information source in town. Every field
we publish must trace to a source. Never invent facts, history, awards, or specialties.

DB: Neon project `twilight-boat-62678930`, table `businesses`. Live page:
`https://www.lompoclocals.com/en/biz/<slug>`.

## Order of operations (per business)

1. **Read the row first.** `SELECT * FROM businesses WHERE slug = '...'`. Note what's
   already good — don't clobber accurate existing data.

2. **Photos (Google Places, curated by eye):**
   - Key: `export $(grep GOOGLE_MAPS_API_KEY .env.local | xargs)`
   - Details: `/maps/api/place/details/json?place_id=<PID>&fields=photos,website,formatted_phone_number,editorial_summary,url`
   - Per photo ref: hit `/maps/api/place/photo?maxwidth=1600&photoreference=<REF>` with
     `curl -o /dev/null -w '%{redirect_url}'`, store the **permanent lh3 URL** (never a
     URL containing the API key), download it to the scratchpad.
   - **VIEW every image with Read.** Keep up to 8: drop duplicates, blurry/tilted shots,
     reviewer selfies, flyers. Order: best interior/food/product hero FIRST, exterior last.
   - Write `photos_json` (jsonb array) + `cover_url` = hero.

3. **Website/social research:** curl their site; extract about facts, mailto/contact
   email, IG/FB/TikTok links (footer or schema.org sameAs), logo URL (must return 200).
   Facebook pages usually won't curl — use Places `editorial_summary` instead.

4. **Write, with sources tagged:**
   - `description` ~140–160 chars, factual. Only overwrite if existing is worse.
   - `about` = 2 short paragraphs of verifiable facts. `about_source` = 'website' | 'google'.
   - `email` + `email_source` ('website' | 'instagram' | ...). Socials only if found.
   - `google_place_id` if missing (Places Text Search with name + address).
   - Single `UPDATE ... WHERE slug = '...' RETURNING id`. Double single-quotes in SQL.

5. **Verify live:** curl the profile page, grep for the new content.

## Accuracy rules (non-negotiable)

- **Facts-only:** if there's no source, leave the field null. A missing about beats an
  invented one.
- **Phone conflicts:** if Places' phone differs from the row, report it — a stale phone
  burns outreach calls. Update the row to Google's current number and note the change.
- **Wrong-entity traps:** verify socials actually belong to the business (check bio,
  location). A same-name page in another state is worse than none.
- **Watch for relocation/closure signals** on their site (moved, appointment-only,
  closed) — flag them; they change whether outreach makes sense.
- **Dupes:** if you find a near-duplicate row, flag it in your report. Never DELETE.
- **Never touch:** owner_user_id, status, hours_json, plan/stripe fields.

## Report format

Per business, output the dossier block (profile URL, website, email, phone, socials,
Google Maps URL, photos count + hero description, SEO hooks, backlink ops) so results
feed `docs/marketing/beachhead-25-seo-dossier.md` and the outreach tracker
(`docs/marketing/beachhead-25-tracker.csv` — keep its Email/Phone columns in sync).
