/**
 * scripts/translate-content.ts
 *
 * Spanish pass over database content. Dry by default-ish: pass --dry to only
 * count candidates; without it, rows are translated and a before/after sample
 * is printed.
 *
 *   node --env-file=.env.local node_modules/.bin/tsx scripts/translate-content.ts --dry --limit 3 [--table blog_posts]
 */

import { runTranslationPass, TABLE_NAMES } from "../lib/translate-content"

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`)
  return i === -1 ? undefined : process.argv[i + 1]
}

async function main() {
  const dryRun = process.argv.includes("--dry")
  const limitPerTable = Number(arg("limit") ?? (dryRun ? 500 : 20))
  const table = arg("table")
  if (table && !TABLE_NAMES.includes(table)) {
    console.error(`unknown table "${table}"; one of ${TABLE_NAMES.join(", ")}`)
    process.exit(1)
  }
  if (!dryRun && !process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY is not set")
    process.exit(1)
  }

  console.log(`translate-content ${dryRun ? "(dry run)" : "(LIVE — writes Spanish)"} limit=${limitPerTable}${table ? ` table=${table}` : ""}`)
  const { perTable, sample } = await runTranslationPass({ limitPerTable, dryRun, tables: table ? [table] : undefined })

  console.log("\ntable            candidates  translated  errors  model                          tokens(in/out)   est $")
  for (const t of perTable) {
    console.log(
      `${t.table.padEnd(16)} ${String(t.candidates).padStart(10)}  ${String(t.translated).padStart(10)}  ${String(t.errors).padStart(6)}  ${t.model.padEnd(30)} ${`${t.tokens.input}/${t.tokens.output}`.padEnd(16)} ${t.estCostUsd.toFixed(4)}`
    )
    for (const n of t.notes) console.log(`   note: ${n}`)
  }

  if (sample.length) {
    console.log(`\n--- ${dryRun ? "candidates" : "before / after"} ---`)
    for (const s of sample) {
      console.log(`\n[${s.table} #${s.id}] ${s.field}`)
      console.log(`  EN: ${s.en}`)
      if (!dryRun) console.log(`  ES: ${s.es}`)
    }
  }
}

main().then(() => process.exit(0)).catch((err) => { console.error(err); process.exit(1) })
