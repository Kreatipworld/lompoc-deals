import { generateObject } from "ai"
import { createAnthropic } from "@ai-sdk/anthropic"
import { z } from "zod"
import { and, eq, getTableColumns, gt, isNull, ne, or, sql, type SQL } from "drizzle-orm"
import type { PgColumn, PgTable } from "drizzle-orm/pg-core"
import { db } from "@/db/client"
import { activities, blogPosts, businesses, deals, events, garageSales } from "@/db/schema"

/**
 * Automatic Spanish for database content.
 *
 * Contract: every translatable English column has an `_es` twin. An `_es`
 * column that is NULL while its English source is non-empty means "needs
 * translation". Setting a twin back to NULL (an owner edited the English)
 * is the staleness signal — the next pass re-translates it. Nothing here
 * ever overwrites a non-NULL Spanish value: the UPDATE uses COALESCE on the
 * twin, so the pass is idempotent and safe when two runs overlap.
 */

export const SHORT_MODEL = "claude-haiku-4-5-20251001"
export const LONG_MODEL = "claude-sonnet-4-5-20250929"

/** $ per million tokens, for the cost estimate in reports. */
const PRICE: Record<string, { input: number; output: number }> = {
  [SHORT_MODEL]: { input: 1, output: 5 },
  [LONG_MODEL]: { input: 3, output: 15 },
}

type Field = {
  /** English source column */
  en: PgColumn
  /** Spanish twin column */
  es: PgColumn
  /** key used in the model schema, e.g. "description" → "descriptionEs" */
  name: string
  /** varchar length of the twin, when it has one; text columns are unbounded */
  max?: number
  /** true when the source is HTML whose tags/attributes must be preserved */
  html?: boolean
}

export type Job = {
  table: string
  tbl: PgTable
  idCol: PgColumn
  /** present only for businesses: used to revalidate the profile pages */
  slugCol?: PgColumn
  fields: Field[]
  /** base filter (status, freshness) — the "needs translation" clause is added on top */
  where: SQL
  model: string
  batchSize: number
}

export const JOBS: Job[] = [
  {
    table: "businesses",
    tbl: businesses,
    idCol: businesses.id,
    slugCol: businesses.slug,
    fields: [
      { en: businesses.description, es: businesses.descriptionEs, name: "description" },
      { en: businesses.about, es: businesses.aboutEs, name: "about" },
    ],
    where: eq(businesses.status, "approved"),
    model: SHORT_MODEL,
    batchSize: 8,
  },
  {
    table: "deals",
    tbl: deals,
    idCol: deals.id,
    fields: [
      { en: deals.title, es: deals.titleEs, name: "title", max: 300 },
      { en: deals.description, es: deals.descriptionEs, name: "description" },
      { en: deals.terms, es: deals.termsEs, name: "terms" },
      { en: deals.discountText, es: deals.discountTextEs, name: "discountText", max: 200 },
    ],
    // Live deals only; a paused deal can be unpaused, so it still counts.
    where: gt(deals.expiresAt, sql`now()`),
    model: SHORT_MODEL,
    batchSize: 15,
  },
  {
    table: "events",
    tbl: events,
    idCol: events.id,
    fields: [
      { en: events.title, es: events.titleEs, name: "title", max: 300 },
      { en: events.description, es: events.descriptionEs, name: "description" },
    ],
    where: and(eq(events.status, "approved"), gt(events.startsAt, sql`now() - interval '1 day'`))!,
    model: SHORT_MODEL,
    batchSize: 15,
  },
  {
    table: "blog_posts",
    tbl: blogPosts,
    idCol: blogPosts.id,
    fields: [
      { en: blogPosts.title, es: blogPosts.titleEs, name: "title", max: 500 },
      { en: blogPosts.excerpt, es: blogPosts.excerptEs, name: "excerpt" },
      { en: blogPosts.content, es: blogPosts.contentEs, name: "content", html: true },
      { en: blogPosts.metaDescription, es: blogPosts.metaDescriptionEs, name: "metaDescription" },
    ],
    where: eq(blogPosts.status, "published"),
    model: LONG_MODEL,
    batchSize: 2,
  },
  {
    table: "activities",
    tbl: activities,
    idCol: activities.id,
    fields: [
      { en: activities.title, es: activities.titleEs, name: "title", max: 300 },
      { en: activities.description, es: activities.descriptionEs, name: "description" },
      { en: activities.tips, es: activities.tipsEs, name: "tips" },
      { en: activities.seasonality, es: activities.seasonalityEs, name: "seasonality", max: 200 },
    ],
    where: sql`true`,
    model: SHORT_MODEL,
    batchSize: 6,
  },
  {
    table: "garage_sales",
    tbl: garageSales,
    idCol: garageSales.id,
    fields: [{ en: garageSales.description, es: garageSales.descriptionEs, name: "description" }],
    where: and(eq(garageSales.status, "active"), gt(garageSales.endDate, sql`now() - interval '1 day'`))!,
    model: SHORT_MODEL,
    batchSize: 15,
  },
]

export const TABLE_NAMES = JOBS.map((j) => j.table)

const esKey = (name: string) => `${name}Es`

/** Drizzle's update().set() is keyed by the TS property, not the DB column name. */
function tsKey(tbl: PgTable, col: PgColumn): string {
  const hit = Object.entries(getTableColumns(tbl)).find(([, c]) => c === col)
  if (!hit) throw new Error(`column ${col.name} is not on this table`)
  return hit[0]
}

/** "needs translation" for one field: English present, Spanish missing. */
const needsField = (f: Field): SQL => and(sql`${f.en} is not null`, ne(f.en, ""), isNull(f.es))!

const SYSTEM = `You translate content for Lompoc Locals, the local hub for Lompoc, California, from English into natural US Spanish for the Lompoc community: tú form, neutral and warm, never stiff or literal.

RULES
- Keep exactly as written: business names, brand names, street addresses, prices, phone numbers, URLs, email addresses, hashtags, coupon codes, and hours like "9am–5pm".
- Keep every HTML tag and attribute exactly as it is (including href values, class names, rel). Translate only the human-readable text between tags. Preserve the HTML structure and paragraph count.
- Do not add or remove facts. Do not embellish. Do not invent any "gratis"/free offer or discount that the English does not state.
- Keep the length close to the source. Titles stay short.
- Return "" for any field whose source is empty or missing.
- Return plain translated text, no quotes, no notes, no "Traducción:" prefixes.`

/**
 * Translate one batch of rows. `fieldNames` is the union of fields present in
 * this batch; the model returns every field for every item ("" when absent).
 * Falls back to the other model on any error.
 */
export async function translateBatch(
  anthropic: ReturnType<typeof createAnthropic>,
  items: { id: number; [field: string]: string | number }[],
  fieldNames: string[],
  opts: { model: string; html?: boolean } = { model: SHORT_MODEL }
): Promise<{ items: Record<string, string | number>[]; model: string; usage: { input: number; output: number } }> {
  const shape: Record<string, z.ZodTypeAny> = { id: z.number() }
  for (const n of fieldNames) shape[esKey(n)] = z.string().describe(`Spanish for "${n}"; "" if the source was empty`)
  const schema = z.object({ items: z.array(z.object(shape)) })

  const prompt =
    `Translate the following items. Return one output item per input item, same id, with the Spanish in the "<field>Es" keys.` +
    (opts.html ? " The content field is HTML — keep all tags and attributes verbatim.\n\n" : "\n\n") +
    JSON.stringify({ items }, null, 1)

  const order = opts.model === LONG_MODEL ? [LONG_MODEL, SHORT_MODEL] : [SHORT_MODEL, LONG_MODEL]
  let lastErr: unknown = null
  for (const m of order) {
    try {
      const { object, usage } = await generateObject({
        model: anthropic(m),
        schema,
        system: SYSTEM,
        prompt,
        temperature: 0.2,
        maxOutputTokens: 16000,
      })
      return {
        items: object.items as Record<string, string | number>[],
        model: m,
        usage: { input: usage.inputTokens ?? 0, output: usage.outputTokens ?? 0 },
      }
    } catch (err) {
      lastErr = err
      console.warn(`[translate] ${m} failed, trying fallback: ${err instanceof Error ? err.message : String(err)}`)
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("translation model failed")
}

/** Clamp to a varchar length with an ellipsis — and say so, never silently. */
function clamp(value: string, max: number | undefined, where: string): string {
  if (!max || value.length <= max) return value
  console.warn(`[translate] ${where}: Spanish is ${value.length} chars, column allows ${max}; clamped with an ellipsis`)
  return value.slice(0, max - 1).trimEnd() + "…"
}

export type TableResult = {
  table: string
  candidates: number
  translated: number
  errors: number
  model: string
  tokens: { input: number; output: number }
  estCostUsd: number
  /** business slugs whose Spanish changed — for revalidation */
  slugs: string[]
  notes: string[]
}

export type PassResult = {
  perTable: TableResult[]
  sample: { table: string; id: number; field: string; en: string; es: string }[]
}

/**
 * One translation pass. `limitPerTable` caps the rows examined per table
 * (the cron uses a modest cap; the CLI can go higher). `dryRun` only counts
 * candidates and lists them. Importable from a route handler or a CLI.
 */
export async function runTranslationPass(opts: {
  limitPerTable?: number
  dryRun?: boolean
  tables?: string[]
  apiKey?: string
}): Promise<PassResult> {
  const limit = Math.max(1, Math.min(opts.limitPerTable ?? 40, 500))
  const jobs = opts.tables?.length ? JOBS.filter((j) => opts.tables!.includes(j.table)) : JOBS
  const anthropic = createAnthropic({ apiKey: opts.apiKey ?? process.env.ANTHROPIC_API_KEY })
  const perTable: TableResult[] = []
  const sample: PassResult["sample"] = []

  for (const job of jobs) {
    const result: TableResult = {
      table: job.table, candidates: 0, translated: 0, errors: 0, model: job.model,
      tokens: { input: 0, output: 0 }, estCostUsd: 0, slugs: [], notes: [],
    }
    perTable.push(result)

    const needs = or(...job.fields.map(needsField))!
    const selection: Record<string, PgColumn> = { id: job.idCol }
    if (job.slugCol) selection.slug = job.slugCol
    for (const f of job.fields) { selection[f.name] = f.en; selection[esKey(f.name)] = f.es }

    // Count everything that qualifies, then take the oldest `limit` rows.
    const [{ n }] = (await db.select({ n: sql<number>`count(*)::int` }).from(job.tbl).where(and(job.where, needs))) as { n: number }[]
    result.candidates = n
    if (n === 0) continue

    const rows = (await db.select(selection).from(job.tbl).where(and(job.where, needs)).orderBy(job.idCol).limit(limit)) as Record<string, unknown>[]

    // Which fields does each row actually need?
    const work = rows.map((r) => ({
      id: r.id as number,
      slug: (r.slug as string | undefined) ?? null,
      fields: job.fields.filter((f) => {
        const en = r[f.name]
        return typeof en === "string" && en.trim() !== "" && r[esKey(f.name)] == null
      }),
      row: r,
    }))

    if (opts.dryRun) {
      for (const w of work.slice(0, 5)) {
        const f = w.fields[0]
        sample.push({ table: job.table, id: w.id, field: f.name, en: String(w.row[f.name]).slice(0, 160), es: "(dry run)" })
      }
      continue
    }

    for (let i = 0; i < work.length; i += job.batchSize) {
      const batch = work.slice(i, i + job.batchSize)
      const fieldNames = Array.from(new Set(batch.flatMap((w) => w.fields.map((f) => f.name))))
      const items = batch.map((w) => {
        const item: { id: number; [k: string]: string | number } = { id: w.id }
        for (const f of w.fields) item[f.name] = String(w.row[f.name])
        return item
      })

      let out: Awaited<ReturnType<typeof translateBatch>>
      try {
        out = await translateBatch(anthropic, items, fieldNames, { model: job.model, html: job.fields.some((f) => f.html) })
      } catch (err) {
        result.errors += batch.length
        result.notes.push(`batch at id ${batch[0].id}: ${err instanceof Error ? err.message : String(err)}`)
        continue
      }
      result.model = out.model
      result.tokens.input += out.usage.input
      result.tokens.output += out.usage.output

      const byId = new Map(out.items.map((it) => [Number(it.id), it]))
      for (const w of batch) {
        const got = byId.get(w.id)
        if (!got) { result.errors++; result.notes.push(`id ${w.id}: missing from model output`); continue }
        // Only set the twins that were needed AND came back non-empty; COALESCE
        // keeps any Spanish another run wrote in the meantime.
        const set: Record<string, SQL> = {}
        for (const f of w.fields) {
          const raw = got[esKey(f.name)]
          const es = typeof raw === "string" ? raw.trim() : ""
          if (!es) { result.notes.push(`id ${w.id}.${f.name}: empty translation, left NULL`); continue }
          const value = clamp(es, f.max, `${job.table}#${w.id}.${f.name}`)
          set[tsKey(job.tbl, f.es)] = sql`coalesce(${f.es}, ${value})`
          if (sample.length < 40) sample.push({ table: job.table, id: w.id, field: f.name, en: String(w.row[f.name]), es: value })
        }
        if (Object.keys(set).length === 0) { result.errors++; continue }
        try {
          await db.update(job.tbl).set(set).where(eq(job.idCol, w.id))
          result.translated++
          if (w.slug) result.slugs.push(w.slug)
        } catch (err) {
          result.errors++
          result.notes.push(`id ${w.id}: update failed: ${err instanceof Error ? err.message : String(err)}`)
        }
      }
    }
    const price = PRICE[result.model] ?? PRICE[SHORT_MODEL]
    result.estCostUsd = Number(((result.tokens.input * price.input + result.tokens.output * price.output) / 1_000_000).toFixed(4))
  }

  return { perTable, sample }
}
