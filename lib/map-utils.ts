// eslint-disable-next-line @typescript-eslint/no-require-imports
const turfDistance = require("@turf/distance").default as (
  from: [number, number],
  to: [number, number],
  options?: { units?: string }
) => number

export function distanceMiles(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): number {
  return turfDistance([fromLng, fromLat], [toLng, toLat], { units: "miles" })
}

export function formatDistance(miles: number): string {
  if (miles < 0.1) return "< 0.1 mi"
  if (miles < 10) return `${miles.toFixed(1)} mi`
  return `${Math.round(miles)} mi`
}

export const LOMPOC_CENTER = { lat: 34.6391, lng: -120.4579 }
