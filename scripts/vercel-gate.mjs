#!/usr/bin/env node
/**
 * Small Vercel REST helper used by scripts/ship.sh — the production gate.
 *
 *   node scripts/vercel-gate.mjs wait <sha> [--target=preview|production] [--timeout=900]
 *       Polls until the deployment for that commit is READY and prints its URL.
 *       Exit 2 = build ERROR/CANCELED, exit 3 = timed out, exit 1 = usage/auth.
 *   node scripts/vercel-gate.mjs bypass
 *       Prints the project's "Protection Bypass for Automation" secret, creating
 *       one if the project has none (previews are SSO-protected; the check script
 *       sends this as x-vercel-protection-bypass).
 *   node scripts/vercel-gate.mjs production-branch
 *       Prints the branch Vercel deploys to production ("main" or "production").
 *   node scripts/vercel-gate.mjs set-production-branch <name>
 *       Changes it (used once, to move production off main).
 *   node scripts/vercel-gate.mjs current-production
 *       Prints "<sha> <url>" of the live production deployment.
 *
 * Auth: VERCEL_TOKEN env, else the Vercel CLI's own login (auth.json).
 * Project/team: .vercel/project.json (written by `vercel link`).
 */
import { readFileSync, existsSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"

const API = "https://api.vercel.com"

function token() {
  if (process.env.VERCEL_TOKEN) return process.env.VERCEL_TOKEN
  const candidates = [
    join(homedir(), "Library", "Application Support", "com.vercel.cli", "auth.json"),
    join(homedir(), ".config", "com.vercel.cli", "auth.json"),
    join(homedir(), ".vercel", "auth.json"),
  ]
  for (const p of candidates) {
    if (!existsSync(p)) continue
    try {
      const t = JSON.parse(readFileSync(p, "utf8")).token
      if (t) return t
    } catch {}
  }
  die("No Vercel token. Run `vercel login` (or set VERCEL_TOKEN).")
}

function project() {
  const p = join(process.cwd(), ".vercel", "project.json")
  if (!existsSync(p)) die("Not linked: .vercel/project.json missing. Run `vercel link`.")
  const { projectId, orgId } = JSON.parse(readFileSync(p, "utf8"))
  return { projectId, teamId: orgId }
}

function die(msg, code = 1) {
  console.error(`vercel-gate: ${msg}`)
  process.exit(code)
}

async function api(path, init = {}) {
  const { teamId } = project()
  const sep = path.includes("?") ? "&" : "?"
  const res = await fetch(`${API}${path}${sep}teamId=${teamId}`, {
    ...init,
    headers: { authorization: `Bearer ${token()}`, "content-type": "application/json", ...(init.headers || {}) },
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`${init.method || "GET"} ${path} → ${res.status} ${body?.error?.message || JSON.stringify(body)}`)
  return body
}

const args = process.argv.slice(2)
const cmd = args[0]
const flag = (name, dflt) => {
  const a = args.find((x) => x.startsWith(`--${name}=`))
  return a ? a.slice(name.length + 3) : dflt
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function wait() {
  const sha = args[1]
  if (!sha) die("usage: wait <sha> [--target=preview|production]")
  const target = flag("target", "preview")
  const timeout = Number(flag("timeout", "900")) * 1000
  const { projectId } = project()
  const started = Date.now()
  let lastState = ""
  while (Date.now() - started < timeout) {
    const { deployments = [] } = await api(`/v6/deployments?projectId=${projectId}&sha=${sha}&limit=10`)
    const match = deployments
      .filter((d) => (target === "production" ? d.target === "production" : d.target !== "production"))
      .sort((a, b) => b.created - a.created)[0]
    if (match) {
      const state = match.readyState || match.state
      if (state !== lastState) {
        console.error(`  ${target} deployment ${match.uid} for ${sha.slice(0, 7)}: ${state}`)
        lastState = state
      }
      if (state === "READY") {
        console.log(`https://${match.url}`)
        return
      }
      if (state === "ERROR" || state === "CANCELED") {
        die(`build ${state} — https://vercel.com/${match.inspectorUrl ? match.inspectorUrl.replace("https://vercel.com/", "") : ""}`, 2)
      }
    } else if (!lastState) {
      console.error(`  waiting for Vercel to pick up ${sha.slice(0, 7)} (${target})…`)
      lastState = "PENDING"
    }
    await sleep(10_000)
  }
  die(`timed out after ${timeout / 1000}s waiting for ${target} deployment of ${sha.slice(0, 7)}`, 3)
}

async function bypass() {
  const { projectId } = project()
  const proj = await api(`/v9/projects/${projectId}`)
  const existing = Object.entries(proj.protectionBypass || {}).find(([, v]) => v.scope === "automation-bypass")
  if (existing) {
    console.log(existing[0])
    return
  }
  const updated = await api(`/v1/projects/${projectId}/protection-bypass`, {
    method: "PATCH",
    body: JSON.stringify({ generate: {} }),
  })
  const created = Object.entries(updated.protectionBypass || {}).find(([, v]) => v.scope === "automation-bypass")
  if (!created) die("Vercel did not return an automation bypass secret")
  console.error("  created a new Protection Bypass for Automation secret")
  console.log(created[0])
}

async function productionBranch() {
  const { projectId } = project()
  const proj = await api(`/v9/projects/${projectId}`)
  console.log(proj.link?.productionBranch || "")
}

async function setProductionBranch() {
  const branch = args[1]
  if (!branch) die("usage: set-production-branch <name>")
  const { projectId } = project()
  const res = await api(`/v9/projects/${projectId}/branch`, { method: "PATCH", body: JSON.stringify({ branch }) })
  console.log(res.link?.productionBranch || res.productionBranch || JSON.stringify(res))
}

async function currentProduction() {
  const { projectId } = project()
  const { deployments = [] } = await api(`/v6/deployments?projectId=${projectId}&target=production&state=READY&limit=1`)
  const d = deployments[0]
  if (!d) die("no production deployment found")
  console.log(`${d.meta?.githubCommitSha || "?"} https://${d.url}`)
}

const commands = {
  wait,
  bypass,
  "production-branch": productionBranch,
  "set-production-branch": setProductionBranch,
  "current-production": currentProduction,
}
if (!commands[cmd]) die(`unknown command "${cmd || ""}". One of: ${Object.keys(commands).join(", ")}`)
commands[cmd]().catch((e) => die(e.message))
