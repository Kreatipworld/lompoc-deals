/**
 * Rocket-launch events are synced from Launch Library with English baked into
 * `events.title` / `events.description` (see lib/launch-sync.ts). The DB stays
 * English; /es pages render a Spanish equivalent at read time by parsing the
 * fixed shapes the sync writes. Anything we can't recognize (e.g. the mission
 * blurb, which comes from the API) passes through unchanged.
 */
export const LAUNCH_SOURCE = "launch-library"

/** "Rocket Launch: Falcon 9 Block 5 — Starlink Group 15-23" → [rocket, mission] */
export const LAUNCH_TITLE_RE = /^Rocket Launch:\s*(.+?)\s*—\s*(.+)$/

const LAUNCHING_FROM_RE = /^Launching from (.+)\.$/
const LAUNCH_NOTE_PREFIX = "Launch times shift often"

/** Translator for the `newsUi.events` namespace (server or client `t`). */
export type LaunchTranslator = (key: string, values?: Record<string, string | number>) => string

type LaunchLike = { title: string; description: string | null; source: string }

export function isLaunchEvent(ev: { source: string }): boolean {
  return ev.source === LAUNCH_SOURCE
}

type Localizable = LaunchLike & { titleEs?: string | null; descriptionEs?: string | null }

const filled = (v: string | null | undefined): v is string => !!v && v.trim().length > 0

/**
 * Title for any event on any locale. On /es the DB twin (`events.title_es`, written by the
 * translation cron) wins; a launch row without a twin still gets its parsed Spanish shape;
 * everything else falls back to English.
 */
export function eventTitle(ev: Localizable, locale: string, t: LaunchTranslator): string {
  if (locale === "es" && filled(ev.titleEs)) return ev.titleEs
  return launchTitle(ev, locale, t)
}

/** Description with the same precedence as `eventTitle`: DB twin → parsed launch text → English. */
export function eventDescription(ev: Localizable, locale: string, t: LaunchTranslator): string | null {
  if (locale === "es" && filled(ev.descriptionEs)) return ev.descriptionEs
  return launchDescription(ev, locale, t)
}

/** Localized title for any event; non-launch and English rows return the stored title. */
export function launchTitle(ev: LaunchLike, locale: string, t: LaunchTranslator): string {
  if (locale !== "es" || !isLaunchEvent(ev)) return ev.title
  const m = ev.title.match(LAUNCH_TITLE_RE)
  return m ? t("launchTitle", { rocket: m[1], mission: m[2] }) : ev.title
}

/** Localized description; the sync joins paragraphs with blank lines, so translate per paragraph. */
export function launchDescription(
  ev: LaunchLike,
  locale: string,
  t: LaunchTranslator
): string | null {
  if (locale !== "es" || !isLaunchEvent(ev) || !ev.description) return ev.description
  return ev.description
    .split("\n\n")
    .map((paragraph) => {
      const pad = paragraph.match(LAUNCHING_FROM_RE)
      if (pad) return t("launchingFrom", { pad: pad[1] })
      // The closing note may be clipped by the sync's 2000-char cap — match on its opening.
      if (paragraph.startsWith(LAUNCH_NOTE_PREFIX)) return t("launchNote")
      return paragraph
    })
    .join("\n\n")
}
