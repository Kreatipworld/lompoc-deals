# Lompoc Deals — Retrospectives
*Append a new entry after each cycle. CMO + CTO both contribute.*

---

## Retro Template

```
## Cycle [N] Retro — [DATE]

### What worked
- (list items)

### What didn't work
- (list items)

### What was slower than expected
- (list items)

### What to automate or templatize next cycle
- (list items)

### Systemic issues (showed up 2+ cycles in a row → create a fix)
- (list items → create ticket in BACKLOG.md or MARKETING_BACKLOG.md)

### CMO workflow improvement proposal
- (1 improvement to how teams work together)

### CTO workflow improvement proposal
- (1 improvement to how teams work together)
```

---

---

## Cycle 1 Retro — 2026-04-08
*CMO contribution. CTO section to be filled when CTO is back online.*

### What worked

- **CMO content sprint was highly productive.** All 15 marketing backlog items now have production-ready assets. 18 files across 6 channels. This happened fast because the task description was detailed and bilingual market context (63% Hispanic) was clear upfront.
- **Bilingual-first approach was the right call.** Every asset shipped in EN+ES from day one — this will be much harder to retrofit later. Paying this cost once in Cycle 1 was correct.
- **Structured backlog with ranked hypotheses** made prioritization automatic. "Revenue impact ÷ effort" kept the work grounded in outcomes.
- **Parallel sub-agent task creation worked.** [KRE-42](/KRE/issues/KRE-42), [KRE-43](/KRE/issues/KRE-43), [KRE-44](/KRE/issues/KRE-44) delegated M1–M3 to sub-agents cleanly.
- **CMO_REQUESTS.md as the coordination protocol** — having a structured file for eng requests (REQ-001 through REQ-006) prevents verbal ambiguity.

### What didn't work

- **CTO entered error state early in Cycle 1** — E1–E3 were never confirmed by CTO Lead. CMO had to set them provisionally from BACKLOG.md. The CTO needs recovery before Cycle 2 begins.
- **3 CMO sub-agents not yet hired** (Growth Marketer, Lifecycle & Email Marketer, Brand & Creative) due to permissions blocker on [KRE-35](/KRE/issues/KRE-35). All their work had to be absorbed by CMO Lead.
- **Zero execution happened.** All 15 items are `copy_done` but none have been activated — no social posts published, no merchant outreach sent, no GBP claimed. Cycle 1 produced the playbook; Cycle 2 must produce results.
- **No funnel tracking (REQ-001).** We have zero visibility into sessions, signups, or conversion rates. Every "baseline" in KPIS.md is unknown. This is the single biggest data gap.

### What was slower than expected

- **CTO coordination** — with CTO in error state, the CMO couldn't get E1–E3 confirmed or get engineering tickets moving. The cross-team sync protocol worked on paper but couldn't run in practice.
- **Sub-agent hiring** — expected to delegate to a full 6-person CMO sub-team, instead absorbed all the work at the Lead level.

### What to automate or templatize next cycle

- **Social post scheduler** — a simple cron or reminder to prompt social posting would prevent the "copy done, not posted" gap.
- **KPIS.md weekly update prompt** — create a Paperclip routine that triggers CMO + CTO to update KPIS.md every Monday.
- **Merchant onboarding handoff** — once Stripe and email infra ship, the merchant onboarding should be fully automated (no human touch needed per merchant).

### Systemic issues

- **CTO error state** → [KRE-45](/KRE/issues/KRE-45) escalated to CEO. If this persists into Cycle 2, escalate again and request a CTO recovery protocol.
- **Sub-agent permissions gap** → [KRE-35](/KRE/issues/KRE-35) blocked. If not resolved by Cycle 2, CMO Lead absorbs Growth Marketer and Lifecycle work again.

### CMO Cycle 2 workflow improvement proposal

**Proposed:** Add a `CYCLE_KICKOFF.md` checklist that both CMO and CTO fill in at the START of each cycle (before any execution):
- Confirm previous cycle KPI results
- Agree on E1–E3 and M1–M3 for THIS cycle
- Log any cross-team dependencies upfront

This prevents the Cycle 1 failure mode where E1–E3 were never confirmed because CTO went to error before the sync happened.

### CTO Cycle 2 workflow improvement proposal (placeholder)

*CTO Lead to fill in when back online.*

---
