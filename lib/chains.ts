/**
 * National chains with a Lompoc address.
 *
 * They belong in the directory — a resident searching "Starbucks" should find one — but they must
 * never be what we *feature*. The whole premise is that this is the town's own paper, and a digest
 * that opens with Wingstop is indistinguishable from a coupon mailer. Corporate marketing does not
 * need our help; the taqueria on North H does.
 *
 * Word-boundary regexes, not substring matches: a bare `includes("ross")` matched Crossroads,
 * "flower" matched Lowe's, and "mobil" matched three independent mobile detailers.
 *
 * NOTE: `scripts/lib/voice.mjs` carries the identical list for the caption pipeline, which is
 * plain ESM and cannot import this module. `lib/chains.test.ts` asserts the two stay in sync.
 */
export const CHAIN_PATTERNS: RegExp[] = [
  /\bsmart\s*&\s*final\b/i, /\bwal-?mart\b/i, /\btarget\b/i, /\bcostco\b/i, /\bhome depot\b/i,
  /\bcvs\b/i, /\bwalgreens\b/i, /\brite aid\b/i, /\bstarbucks\b/i, /\bmcdonald/i, /\bburger king\b/i,
  /\btaco bell\b/i, /\bwendy/i, /\bsubway\b/i, /\bdomino/i, /\bpizza hut\b/i, /\bkfc\b/i,
  /\bjack in the box\b/i, /\bdel taco\b/i, /\bin-n-out\b/i, /\bchipotle\b/i, /\bpanda express\b/i,
  /\bdollar tree\b/i, /\bdollar general\b/i, /\bfamily dollar\b/i, /\bbig lots\b/i,
  /\bross dress\b/i, /\bmarshalls\b/i, /\btj ?maxx\b/i, /\bold navy\b/i, /\bgamestop\b/i,
  /\bautozone\b/i, /\bo'?reilly\b/i, /\bnapa auto\b/i, /\bjiffy lube\b/i, /\bmidas\b/i,
  /\bfirestone\b/i, /\bles schwab\b/i, /\bgoodwill\b/i, /\bups store\b/i, /\bfedex\b/i,
  /\bverizon\b/i, /\bat&t\b/i, /\bt-mobile\b/i, /\bchase bank\b/i, /\bwells fargo\b/i,
  /\bbank of america\b/i, /\bus bank\b/i, /\bgrocery outlet\b/i, /\bvons\b/i, /\balbertsons\b/i,
  /\bsafeway\b/i, /\bfood 4 less\b/i, /\b7-eleven\b/i, /\bcircle k\b/i, /\bchevron\b/i,
  /\bholiday inn\b/i, /\bhampton inn\b/i, /\bmarriott\b/i, /\bhilton\b/i, /\bmotel 6\b/i,
  /\bsuper 8\b/i, /\bbest western\b/i, /\bembassy suites\b/i,
  // Deliberately NOT a bare /motel/ — that caught Star Motel, which is an independent Lompoc
  // motel and exactly the kind of business a feature exists to name.
  /\baldi\b/i, /\bapplebee/i, /\bbig 5\b/i, /\bbig brand tire\b/i, /\bcarl'?s jr\b/i,
  /\bcarquest\b/i, /\bcentury ?21\b/i, /\bc21\b/i, /\bdutch bros\b/i, /\bexxon\b/i,
  /\bfantastic sam/i, /\bfosters? freeze\b/i, /\bh&r block\b/i, /\bhomegoods\b/i,
  /\bjersey mike/i, /\bkeller williams\b/i, /\blittle caesars\b/i, /\bace hardware\b/i,
  /\bmassage envy\b/i, /\bmobil\b/i, /\bono hawaiian\b/i, /\bpep boys\b/i, /\bpetco\b/i,
  /\bplanet fitness\b/i, /\bregal\b/i, /\bhabit burger\b/i, /\bvip petcare\b/i,
  /\bamerican tire depot\b/i, /\bpacific premier bank\b/i, /\bquiznos\b/i,
  // Found while auditing the first live digest build, which led with Wingstop and Blaze Pizza.
  /\bwingstop\b/i, /\bblaze pizza\b/i, /\bpapa john/i, /\bround table pizza\b/i,
  /\bpanera\b/i, /\bdenny'?s\b/i, /\bihop\b/i, /\bsonic drive/i, /\bpopeyes\b/i,
  /\bchick-?fil-?a\b/i, /\bfive guys\b/i, /\bbaskin-?robbins\b/i, /\bdunkin/i,
  /\bcold stone\b/i, /\bjamba\b/i, /\bwienerschnitzel\b/i, /\bel pollo loco\b/i,
]

export const isChain = (name: string | null | undefined) =>
  CHAIN_PATTERNS.some((re) => re.test(String(name || "")))
