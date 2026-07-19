# Lompoc Locals — Weekly Digest Email Plan

**Goal:** keep the community captivated with one email every week — four a month,
each with a distinct theme so subscribers always know what's coming and always
have a reason to open. Built entirely on the real content we already have
(96 upcoming events, partner deals, wineries & things to do, 9 Official Partners,
48 blog posts). Bilingual (EN/ES). Sends **Monday 9:00 AM PT**.

## The rhythm — 4 themed emails a month

| Week | Theme | Subject-line formula | What it's built from |
|---|---|---|---|
| **1** | 📅 **This Month in Lompoc** — events recap | "What's happening in Lompoc this month 🚀" | Upcoming events (launches, markets, festivals, live music, wine events) |
| **2** | 🎟️ **Deals of the Week** | "This week's best local deals in Lompoc" | Active Official Partner coupons + new specials |
| **3** | 🌟 **Things to Do** | "Get out this weekend — things to do in Lompoc" | Activities, the Wine Ghetto, hidden gems, seasonal picks |
| **4** | 🤝 **Featured Locals** | "Meet a few of your Lompoc neighbors" | Official Partner spotlights + new business + a story |

Why themed: a predictable weekly rhythm trains the open ("Monday = my Lompoc email"),
each week has a clear reason to click, and nothing feels repetitive. A fifth Monday
(quarterly) rolls over to a bonus **"Best of the Month"** recap.

---

## What each email contains

Every email uses the same branded shell — **logo header (purple), a warm one-line
intro, the themed section, one light cross-link, and a footer** (visit site ·
unsubscribe · EN/ES). Neighborly voice, never "salesy."

### Week 1 — 📅 This Month in Lompoc (Events)
- **Hook:** "Here's your month in Lompoc — plan ahead."
- 6–8 upcoming events with date, place, and a link to the event page.
- **Always lead with the Vandenberg rocket launches** (our signature draw) + the
  recurring anchors (Old Town Market Fridays, Movies in the Park, Wine Ghetto events),
  then festivals/live music.
- Recurring series collapse to their next date (no 18 copies of Old Town Market).
- Cross-link: "See the full calendar →"

### Week 2 — 🎟️ Deals of the Week (Deals)
- **Hook:** "Save a little this week, close to home."
- The current Official Partner coupons as cards (image, business, offer, "how to redeem").
- Purple "with Lompoc Locals" styling — the deals people can actually claim.
- Cross-link: "Browse all deals →" · a soft "post a deal?" line for businesses.

### Week 3 — 🌟 Things to Do (Explore)
- **Hook:** "Looking for something to do? Here's Lompoc."
- A mix: 2–3 activities/attractions, a **Wine Ghetto / winery** highlight (we list 38),
  a seasonal pick (flower fields, a launch-viewing spot), and one blog read.
- Frames Lompoc as a place to *do*, not just shop — pulls in visitors + locals.
- Cross-link: "Explore things to do →"

### Week 4 — 🤝 Featured Locals (Features / Partners)
- **Hook:** "A few local businesses worth knowing."
- **Spotlight 2–3 Official Partners** (photo, one-line story, their current offer) —
  this is a real **partner perk**: their business, in every subscriber's inbox.
- Plus one "new on Lompoc Locals" business and a short community note.
- Cross-link: "Meet all our featured members →"

---

## The strategy underneath it

- **Captivation:** four different reasons to open each month; predictable Monday habit.
- **Partner value:** partners appear in Week 2 (their deal) *and* get a Week-4 spotlight —
  another placement their membership buys. The digest is also **ad inventory**
  (a sponsor banner slot: ~$49/wk or $149/mo).
- **Two-sided:** locals get value (events, deals, things to do); businesses get seen —
  which we can quote back when pitching the next Partner.
- **Bilingual:** every issue ships EN + ES (subscriber's locale).
- **Honest cadence:** if a given week is thin (few deals), the email still sends with
  events/things-to-do so we never go dark — but each week keeps its lead theme.

## Before we press go
- **Grow the list first.** The subscribe audience is still small. Priority: prominent
  "get the weekly Lompoc email" prompts on the homepage, feed, and every profile —
  the list is the asset (and the ad inventory).
- **Sender setup:** verify the sending domain in Resend (SPF/DKIM/DMARC) and switch
  the from-address to `hello@lompoclocals.com` before scaling.
- **Content is ready today:** 96 events, partner deals, 38 wineries + activities, and
  9 partners to spotlight — enough to run all four themes immediately.

## Build status
The weekly digest **infrastructure already exists** (subscribers table, Monday cron,
Resend integration, and an events+deals email). Turning this plan on means: a theme
selector by week-of-month, content queries per theme (events / deals / things-to-do /
partners), and four themed email templates wired into the existing Monday cron. That's
a focused build whenever you want it — say the word and I'll ship it.
