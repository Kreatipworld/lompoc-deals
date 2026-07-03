/**
 * Deterministic short code shown on the claim screen. Not a security token —
 * just a stable, human-readable reference the cashier can recognize.
 */
export function claimCodeFor(dealId: number): string {
  // Knuth multiplicative hash keeps codes non-sequential but stable per deal.
  const h = (dealId * 2654435761) % 4294967296
  const code = h.toString(36).toUpperCase().padStart(4, "0").slice(-4)
  return `LOMPOC-${code}`
}
