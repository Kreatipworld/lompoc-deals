# Vercel build cost — audit and plan (Sep 20 2026)

Invoice under review: **$94.16 total, of which Build CPU-minutes are $60.76 (21,960 CPU-minutes)**.

Billing formula: `build wall-clock minutes, rounded UP to the next whole minute × vCPUs on the
build machine`. Team is Pro with **Elastic** build machines (auto-assign 4–30 vCPU).

## What the data says

Pulled every deployment in the team for the trailing 30 days (`vercel ls --all --json`, 6 pages,
550 deployments in window).

| Project | Builds | Billed build-min | Avg build | Git-triggered | CLI |
|---|---|---|---|---|---|
| lompoc-deals | 325 | 542 | 68s | 297 | 28 |
| kreatip-site | 67 | 67 | 24s | 67 | 0 |
| kreatip-matrix | 64 | 64 | 28s | 0 | 64 |
| wci | 44 | 44 | 33s | 44 | 0 |
| jlz-landscaping | 26 | 26 | 23s | 26 | 0 |
| demo-plumbing | 19 | 19 | 24s | 19 | 0 |
| valley-embroidery | 5 | 5 | 41s | 5 | 0 |
| **Total** | **550** | **767** | — | **458** | **92** |

**767 billed build-minutes produced 21,960 CPU-minutes → an implied average of 28.6 vCPU.**
Elastic is sitting at or near its 30-vCPU ceiling on essentially every build.

### Driver 1 — the vCPU multiplier (dominant)

This is ~7× more expensive than it needs to be. A Next.js build does not scale to 30 cores; the
extra vCPUs are billed, not used. Same 767 minutes on a 4-vCPU fixed machine is ~3,068 CPU-minutes
instead of 21,960. Even assuming a fixed machine is 1.5× slower in wall-clock, it lands near
4,600 CPU-minutes — roughly **$13 instead of $60.76**.

### Driver 2 — rounding on sub-minute builds

Every project except lompoc-deals averages 23–33 seconds per build and is billed a full minute.
kreatip-site: 67 builds, ~27 minutes of real work, 67 billed minutes. At ~30 vCPU that is ~2,010
CPU-minutes for under half an hour of compute. Fewer, batched pushes fix this; a lower vCPU tier
fixes the cost of it.

### Driver 3 — three deployments per ship in lompoc-deals

Since the Sep 16 gate landed, one `ship.sh` run produces three deployments:

```
19:23  preview     CANCELED  27s  billed 1m   git push origin main
19:24  production  READY     48s  billed 1m   vercel deploy --prod --skip-domain  ← the real one
19:30  production  CANCELED  28s  billed 1m   git push origin production
```

Two of the three are skipped by the ignore gate and produce nothing, but each still boots a machine
and bills a rounded-up minute. Build count per day actually rose from 8.7 to 19.8 after the gate
landed, because each ship now touches three deployment slots instead of one.

### Driver 4 — history

Before Sep 16 there was no gate: 226 git builds in 26 days, all of them running to completion, 223
of them from `main`. That regime is what the invoice under review actually paid for.

### Commit volume

338 commits on `main` in 30 days. **184 of them (54%) touch only content, docs or markdown** and
have no effect on build output. `production` carries the same 338 commits and is also
deploy-connected, so each one is a second build trigger.

## What changed in code (Sep 20 2026)

`scripts/vercel-ignore.sh` rewritten:

1. A commit whose **subject line opens with** `[build]` forces a build on any branch. The first
   version matched `[build]` anywhere in the message, and commit 9841ec6 tripped its own gate by
   documenting the token in its body: it ran a 93s preview build (~2 billed minutes, ~60 CPU-minutes)
   for nothing. Anchored to the subject line in the follow-up commit.
2. `production` branch always skips — ship.sh already built and promoted that exact commit, so a
   git build of it is duplicate work every time.
3. `main` skips by default. Setting `PREVIEW_BUILDS=paths` in the project's **Preview** environment
   turns on path-based previews: it then diffs `HEAD^..HEAD` against the paths the app is compiled
   from (`app components lib hooks i18n messages db types public middleware.ts next.config.*
   package.json package-lock.json tailwind.config.* postcss.config.js tsconfig.json vercel.json`)
   and builds only when one of them changed. Replayed over the last 40 commits on `main`, that diff
   would have skipped 26 and built 14.
4. If the diff cannot be computed (shallow clone with no parent), it fails **safe** and builds.

**A skipped build still boots a machine and still bills a rounded-up minute.** This reduces cost;
it does not make it free.

## Dashboard changes only the account owner can make

Listed highest-value first.

### 1. Pin every project off Elastic — biggest single win

`Project → Settings → Build & Development → Build Machine`. Elastic is the default and is what
produced the 28.6 average vCPU.

| Project | Set to | Why |
|---|---|---|
| lompoc-deals | Standard (4 vCPU) | Largest build; 68s avg leaves headroom. Drop to Basic if builds stay under ~3 min. |
| kreatip-site | Basic | 24s builds |
| kreatip-matrix | Basic | 28s builds |
| wci | Basic | 33s builds |
| jlz-landscaping | Basic | 23s builds |
| demo-plumbing | Basic | 24s builds |
| valley-embroidery | Basic | 41s builds |
| guia-legal-latina, ads-agency, website, project-zwk34 | Basic | No builds in 30 days; set it so a future push cannot land on Elastic |

Expect wall-clock build times to rise. That is fine: CPU-minutes are minutes × vCPU, so trading 30
vCPU for 4 wins even if the build takes twice as long.

### 2. Turn off on-demand concurrent builds

`Team → Settings → Billing → On-Demand Concurrent Builds` (or the Usage page). **Disable it.**
It is a per-build surcharge for skipping the build queue, and nothing here is time-critical —
`ship.sh` runs one build at a time and waits for it anyway. Queueing costs nothing but patience.

### 3. Stop `production` and `main` from auto-deploying

`Project → Settings → Git`. For **lompoc-deals**, turn off automatic deployments for both branches
(or set Ignored Build Step to "Don't build anything" at the project level). This is the only thing
that stops the machine boot, which the `ignoreCommand` cannot do. `ship.sh` deploys via the CLI and
does not depend on the git integration. Expect this to remove two of the three deployments per ship.

### 4. Check whatever is deploying kreatip-matrix

64 builds in 30 days, all CLI-triggered, zero from git. Something is running `vercel deploy` on a
loop there. Worth finding before it runs another month.

## Projected effect

| Scenario | Billed build-min | vCPU | CPU-min | ≈ cost |
|---|---|---|---|---|
| Today | 767 | 28.6 | 21,960 | $60.76 |
| Pin to 4 vCPU only | 767 | 4 | 3,068 | ~$8.50 |
| Pin to 4 vCPU, allow 1.5× slower builds | ~1,150 | 4 | 4,600 | ~$13 |
| Pin + stop the two wasted deploys per ship | ~800 | 4 | 3,200 | ~$9 |

Cost per CPU-minute derived from the invoice ($60.76 / 21,960 = $0.00277).
