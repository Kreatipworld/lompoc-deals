"use client"

import { useMemo, useState, useCallback } from "react"
import MapGL, { Marker, Popup, NavigationControl, AttributionControl } from "react-map-gl/mapbox"
import { MapPin, Wine } from "lucide-react"
import { Link } from "@/i18n/navigation"
import { useLocale } from "next-intl"

/**
 * A category's own map: every approved business in that category with a
 * coordinate, nothing else. First used on /category/wineries (owner, Sep 15
 * 2026: "create a map in this section with all the pins of only wineries").
 * Pins that share an address (the Wine Ghetto has four tasting rooms at
 * 321 N D St) are fanned out a few metres so each one stays clickable.
 */
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

export type CategoryPin = {
  id: number
  name: string
  slug: string
  lat: number
  lng: number
  address: string | null
  logoUrl: string | null
  photoUrl: string | null
  tier: number
}

const PURPLE = "#650C75"
const GOLD = "#EFC618"

function Pin({ member, selected }: { member: boolean; selected: boolean }) {
  const color = member ? GOLD : PURPLE
  const ink = member ? "#3a0743" : "#ffffff"
  return (
    <div className={`relative transition-transform duration-200 ${selected ? "scale-125" : "hover:scale-110"}`}>
      <svg viewBox="0 0 36 50" width="34" height="47" xmlns="http://www.w3.org/2000/svg" style={{ filter: `drop-shadow(0 3px 6px rgba(0,0,0,${selected ? "0.45" : "0.30"}))` }}>
        <path d="M18 0 C8 0 0 8 0 18 C0 31 18 50 18 50 C18 50 36 31 36 18 C36 8 28 0 18 0 Z" fill={color} />
        <circle cx="18" cy="18" r="11" fill={ink} fillOpacity={member ? 0.14 : 0.92} />
        {/* wine glass */}
        <path d="M13 9 h10 c0 6 -1.5 9 -5 9.6 c-3.5 -0.6 -5 -3.6 -5 -9.6 z" fill={member ? ink : color} />
        <rect x="17.2" y="18.4" width="1.6" height="5" fill={member ? ink : color} />
        <rect x="14" y="23.4" width="8" height="1.6" rx="0.8" fill={member ? ink : color} />
      </svg>
    </div>
  )
}

function fanOut(pins: CategoryPin[]): CategoryPin[] {
  const groups = new Map<string, CategoryPin[]>()
  for (const p of pins) {
    const k = `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`
    groups.set(k, [...(groups.get(k) ?? []), p])
  }
  const out: CategoryPin[] = []
  for (const g of groups.values()) {
    if (g.length === 1) { out.push(g[0]); continue }
    g.forEach((p, i) => {
      const a = (i / g.length) * Math.PI * 2
      const r = 0.00022 // ≈ 24 m
      out.push({ ...p, lat: p.lat + Math.sin(a) * r, lng: p.lng + Math.cos(a) * r * 1.2 })
    })
  }
  return out
}

export function CategoryMap({ pins, labels }: { pins: CategoryPin[]; labels: { viewProfile: string; directions: string; member: string } }) {
  const locale = useLocale()
  const [selected, setSelected] = useState<CategoryPin | null>(null)
  const spread = useMemo(() => fanOut(pins), [pins])
  const bounds = useMemo(() => {
    if (spread.length === 0) return null
    let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180
    for (const p of spread) { minLat = Math.min(minLat, p.lat); maxLat = Math.max(maxLat, p.lat); minLng = Math.min(minLng, p.lng); maxLng = Math.max(maxLng, p.lng) }
    return [[minLng, minLat], [maxLng, maxLat]] as [[number, number], [number, number]]
  }, [spread])
  const onMapClick = useCallback(() => setSelected(null), [])

  if (!bounds) return null
  return (
    <MapGL
      mapboxAccessToken={MAPBOX_TOKEN}
      initialViewState={{ bounds, fitBoundsOptions: { padding: { top: 70, bottom: 40, left: 40, right: 40 }, maxZoom: 14 } }}
      style={{ width: "100%", height: "100%" }}
      mapStyle="mapbox://styles/mapbox/outdoors-v12"
      onClick={onMapClick}
      attributionControl={false}
      cooperativeGestures
    >
      <NavigationControl position="top-right" />
      <AttributionControl compact position="bottom-right" />
      {spread.map((p) => (
        <Marker key={p.id} longitude={p.lng} latitude={p.lat} anchor="bottom">
          <div className="cursor-pointer" data-category-pin={p.slug} onClick={(e) => { e.stopPropagation(); setSelected(p) }} title={p.name}>
            <Pin member={p.tier > 0} selected={selected?.id === p.id} />
          </div>
        </Marker>
      ))}
      {selected && (
        <Popup longitude={selected.lng} latitude={selected.lat} anchor="bottom" offset={50} onClose={() => setSelected(null)} closeButton closeOnClick={false} maxWidth="280px">
          <div className="lompoc-popup-content" style={{ minWidth: 220 }}>
            {(selected.photoUrl || selected.logoUrl) && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selected.photoUrl ?? selected.logoUrl ?? ""} alt="" className="mb-2 h-24 w-full rounded-lg object-cover" loading="lazy" />
            )}
            <div className="lompoc-popup-eyebrow flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-white" style={{ background: PURPLE }}>
                <Wine className="h-2.5 w-2.5" /> {locale === "es" ? "Bodega" : "Winery"}
              </span>
              {selected.tier > 0 && <span className="rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold text-[#3a0743]">{labels.member}</span>}
            </div>
            <div className="lompoc-popup-name mt-1">{selected.name}</div>
            {selected.address && (
              <div className="lompoc-popup-meta flex items-start gap-1">
                <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                <span>{selected.address.replace(/,?\s*Lompoc,?\s*CA\s*\d*$/i, "")}</span>
              </div>
            )}
            <div className="lompoc-popup-footer mt-2 flex items-center gap-3">
              <Link href={`/biz/${selected.slug}`} className="lompoc-popup-link">{labels.viewProfile} →</Link>
              <a href={`https://www.google.com/maps/dir/?api=1&destination=${selected.lat},${selected.lng}`} target="_blank" rel="noopener noreferrer" className="text-[11px] text-gray-400 underline hover:text-gray-600">
                {labels.directions}
              </a>
            </div>
          </div>
        </Popup>
      )}
    </MapGL>
  )
}
