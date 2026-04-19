"use client"

import {
  useState,
  useCallback,
  useRef,
  useMemo,
  useEffect,
} from "react"
import MapGL, { Marker, Popup, Source, NavigationControl } from "react-map-gl/mapbox"
import type { MapRef, MapMouseEvent } from "react-map-gl/mapbox"
import { Compass, LocateFixed, Sun, Moon, Share2, LayoutList, Map as MapIcon } from "lucide-react"

import type { POI } from "@/lib/map-pois"
import { CATEGORY_MAP } from "@/lib/map-categories"
import { distanceMiles, LOMPOC_CENTER } from "@/lib/map-utils"
import { useMapFilter } from "@/hooks/useMapFilter"
import { useGeolocation } from "@/hooks/useGeolocation"

import { MapMarker } from "./MapMarker"
import { MapPopup } from "./MapPopup"
import { CategoryFilter } from "./CategoryFilter"
import { SearchBox } from "./SearchBox"
import { Sidebar } from "./Sidebar"
import { TourButton } from "./TourButton"

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
const DAY_STYLE = "mapbox://styles/mapbox/outdoors-v12"
const NIGHT_STYLE = "mapbox://styles/mapbox/navigation-night-v1"

export function LompocInteractiveMap() {
  const mapRef = useRef<MapRef | null>(null)
  const [selectedPoi, setSelectedPoi] = useState<POI | null>(null)
  const [hoveredPoi, setHoveredPoi] = useState<POI | null>(null)
  const [nightMode, setNightMode] = useState(false)
  const [showListView, setShowListView] = useState(false)
  const [markersVisible, setMarkersVisible] = useState(false)
  const [popupPos, setPopupPos] = useState<{ lng: number; lat: number } | null>(null)
  const [pois, setPois] = useState<POI[]>([])

  // Fetch real business POIs from the database
  useEffect(() => {
    fetch("/api/map-pois")
      .then((r) => r.json())
      .then((data) => setPois(data))
      .catch(() => {})
  }, [])

  const { activeCategories, toggleCategory, selectAllCategories, searchQuery, setSearchQuery, filteredPois, searchResults } = useMapFilter(pois)
  const { location: userLocation, loading: geoLoading, requestLocation } = useGeolocation()

  // Staggered marker entrance on load
  useEffect(() => {
    const t = setTimeout(() => setMarkersVisible(true), 300)
    return () => clearTimeout(t)
  }, [])

  // Distance map (from user if available, otherwise center)
  const distanceMap = useMemo(() => {
    const base = userLocation ?? LOMPOC_CENTER
    const map = new globalThis.Map<string, number>()
    pois.forEach((p) => {
      map.set(p.id, distanceMiles(base.lat, base.lng, p.lat, p.lng))
    })
    return map
  }, [pois, userLocation])

  // Sort sidebar pois by distance if user location available
  const sidebarPois = useMemo(() => {
    if (!userLocation) return filteredPois
    return [...filteredPois].sort((a, b) => {
      const da = distanceMap.get(a.id) ?? 999
      const db = distanceMap.get(b.id) ?? 999
      return da - db
    })
  }, [filteredPois, userLocation, distanceMap])

  const handleMarkerClick = useCallback((poi: POI) => {
    setSelectedPoi(poi)
    setPopupPos({ lng: poi.lng, lat: poi.lat })
    mapRef.current?.getMap().flyTo({
      center: [poi.lng, poi.lat],
      zoom: 15,
      pitch: 55,
      duration: 1200,
      essential: true,
    })
    // Scroll sidebar
    setTimeout(() => {
      document.getElementById(`poi-${poi.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" })
    }, 400)
  }, [])

  const handleSidebarSelect = useCallback((poi: POI) => {
    handleMarkerClick(poi)
  }, [handleMarkerClick])

  const handleSearchSelect = useCallback((poi: POI) => {
    setSearchQuery("")
    handleMarkerClick(poi)
  }, [handleMarkerClick, setSearchQuery])

  const handleMapClick = useCallback((e: MapMouseEvent) => {
    // Close popup if clicking empty space
    if (!(e.originalEvent.target as HTMLElement)?.closest?.(".mapboxgl-marker")) {
      setSelectedPoi(null)
      setPopupPos(null)
    }
  }, [])

  const resetView = useCallback(() => {
    mapRef.current?.getMap().flyTo({
      center: [LOMPOC_CENTER.lng, LOMPOC_CENTER.lat],
      zoom: 12.5,
      pitch: 45,
      bearing: -15,
      duration: 1800,
      essential: true,
    })
  }, [])

  const handleLocateMe = useCallback(() => {
    requestLocation()
  }, [requestLocation])

  // Fly to user location when it updates
  useEffect(() => {
    if (userLocation) {
      mapRef.current?.getMap().flyTo({
        center: [userLocation.lng, userLocation.lat],
        zoom: 14,
        pitch: 45,
        duration: 1500,
        essential: true,
      })
    }
  }, [userLocation])

  const handleShare = useCallback(() => {
    const map = mapRef.current?.getMap()
    if (!map) return
    const center = map.getCenter()
    const zoom = map.getZoom()
    const url = `${window.location.origin}/map?lat=${center.lat.toFixed(4)}&lng=${center.lng.toFixed(4)}&zoom=${zoom.toFixed(1)}${selectedPoi ? `&poi=${selectedPoi.id}` : ""}`
    navigator.clipboard.writeText(url).catch(() => {})
  }, [selectedPoi])

  const onMapLoad = useCallback(() => {
    const map = mapRef.current?.getMap()
    if (!map) return

    // Sky layer for atmosphere
    if (!map.getLayer("sky")) {
      map.addLayer({
        id: "sky",
        type: "sky",
        paint: {
          "sky-type": "atmosphere",
          "sky-atmosphere-sun": [0.0, 0.0],
          "sky-atmosphere-sun-intensity": 15,
        },
      })
    }

    // Custom water color
    if (map.getLayer("water")) {
      map.setPaintProperty("water", "fill-color", "#3B82F6")
      map.setPaintProperty("water", "fill-opacity", 0.4)
    }

    // 3D buildings
    const layers = map.getStyle()?.layers ?? []
    const labelLayer = layers.find(
      (l) => l.type === "symbol" && (l.layout as Record<string, unknown>)?.["text-field"]
    )
    if (!map.getLayer("3d-buildings")) {
      map.addLayer(
        {
          id: "3d-buildings",
          source: "composite",
          "source-layer": "building",
          filter: ["==", "extrude", "true"],
          type: "fill-extrusion",
          minzoom: 15,
          paint: {
            "fill-extrusion-color": "#EDE9FE",
            "fill-extrusion-height": [
              "interpolate",
              ["linear"],
              ["zoom"],
              15, 0,
              15.05,
              ["get", "height"],
            ],
            "fill-extrusion-base": [
              "interpolate",
              ["linear"],
              ["zoom"],
              15, 0,
              15.05,
              ["get", "min_height"],
            ],
            "fill-extrusion-opacity": 0.8,
          },
        },
        labelLayer?.id
      )
    }
  }, [])

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* ── Sidebar (desktop) ── */}
      <div
        className={`hidden flex-shrink-0 flex-col overflow-hidden border-r bg-white transition-all duration-300 lg:flex ${
          showListView ? "w-80" : "w-80"
        }`}
      >
        <Sidebar
          pois={sidebarPois}
          selectedPoi={selectedPoi}
          hoveredPoi={hoveredPoi}
          userLocation={userLocation}
          distanceMap={distanceMap}
          onSelect={handleSidebarSelect}
        />
      </div>

      {/* ── Map column ── */}
      <div className="relative flex-1 overflow-hidden">
        {/* Map */}
        <MapGL
          ref={mapRef}
          mapboxAccessToken={MAPBOX_TOKEN}
          initialViewState={{
            longitude: LOMPOC_CENTER.lng,
            latitude: LOMPOC_CENTER.lat,
            zoom: 12.5,
            pitch: 45,
            bearing: -15,
          }}
          style={{ width: "100%", height: "100%" }}
          mapStyle={nightMode ? NIGHT_STYLE : DAY_STYLE}
          terrain={{ source: "mapbox-dem", exaggeration: 1.5 }}
          fog={{
            range: [0.8, 8],
            color: "#d6e8ff",
            "horizon-blend": 0.1,
            "high-color": "#245bde",
            "space-color": "#000000",
            "star-intensity": nightMode ? 0.6 : 0.15,
          }}
          maxBounds={[
            [-120.65, 34.45],
            [-120.25, 34.80],
          ]}
          onClick={handleMapClick}
          onLoad={onMapLoad}
        >
          {/* Terrain source */}
          <Source
            id="mapbox-dem"
            type="raster-dem"
            url="mapbox://mapbox.mapbox-terrain-dem-v1"
            tileSize={512}
            maxzoom={14}
          />

          <NavigationControl position="bottom-right" />

          {/* Markers */}
          {markersVisible &&
            pois.map((poi, index) => {
              const cat = CATEGORY_MAP[poi.category]
              const isFiltered = !filteredPois.some((p) => p.id === poi.id)
              return (
                <Marker
                  key={poi.id}
                  longitude={poi.lng}
                  latitude={poi.lat}
                  anchor="center"
                >
                  <MapMarker
                    poi={poi}
                    category={cat}
                    isSelected={selectedPoi?.id === poi.id}
                    isFiltered={isFiltered}
                    index={index}
                    onClick={handleMarkerClick}
                    onHover={setHoveredPoi}
                  />
                </Marker>
              )
            })}

          {/* User location marker */}
          {userLocation && (
            <Marker longitude={userLocation.lng} latitude={userLocation.lat} anchor="center">
              <div className="relative">
                <div className="absolute inset-0 -m-2 animate-ping rounded-full bg-blue-500/30" />
                <div className="h-4 w-4 rounded-full border-2 border-white bg-blue-500 shadow-lg" />
              </div>
            </Marker>
          )}

          {/* Popup */}
          {selectedPoi && popupPos && (
            <Popup
              longitude={popupPos.lng}
              latitude={popupPos.lat}
              anchor="bottom"
              offset={28}
              onClose={() => {
                setSelectedPoi(null)
                setPopupPos(null)
              }}
              closeButton={false}
              closeOnClick={false}
              maxWidth="none"
            >
              <MapPopup
                poi={selectedPoi}
                category={CATEGORY_MAP[selectedPoi.category]}
                distanceMiles={distanceMap.get(selectedPoi.id)}
                onClose={() => {
                  setSelectedPoi(null)
                  setPopupPos(null)
                }}
              />
            </Popup>
          )}
        </MapGL>

        {/* ── Floating controls ── */}

        {/* Category filter bar (top) */}
        <CategoryFilter
          activeCategories={activeCategories}
          onToggle={toggleCategory}
          onSelectAll={selectAllCategories}
        />

        {/* Search + tour (bottom-left area, above filter) */}
        <div className="absolute bottom-20 left-3 z-10 flex flex-col items-start gap-2 sm:flex-row sm:items-end">
          <TourButton mapRef={mapRef} />
        </div>

        {/* Search box (top-right below nav) */}
        <div className="absolute right-3 top-16 z-10">
          <SearchBox
            query={searchQuery}
            results={searchResults}
            onChange={setSearchQuery}
            onSelect={handleSearchSelect}
          />
        </div>

        {/* Action buttons (right side, above nav) */}
        <div className="absolute bottom-32 right-3 z-10 flex flex-col gap-2">
          {/* Day/Night toggle */}
          <button
            onClick={() => setNightMode((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-black/10 transition-all hover:bg-gray-50"
            title={nightMode ? "Switch to day mode" : "Switch to night mode"}
          >
            {nightMode ? (
              <Sun className="h-5 w-5 text-amber-500" />
            ) : (
              <Moon className="h-5 w-5 text-indigo-600" />
            )}
          </button>

          {/* Near Me */}
          <button
            onClick={handleLocateMe}
            disabled={geoLoading}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-black/10 transition-all hover:bg-gray-50 disabled:opacity-60"
            title="Show my location"
          >
            <LocateFixed
              className={`h-5 w-5 ${geoLoading ? "animate-pulse text-blue-500" : userLocation ? "text-blue-500" : "text-gray-600"}`}
            />
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-black/10 transition-all hover:bg-gray-50"
            title="Copy map link"
          >
            <Share2 className="h-5 w-5 text-gray-600" />
          </button>

          {/* List view toggle (mobile) */}
          <button
            onClick={() => setShowListView((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-black/10 transition-all hover:bg-gray-50 lg:hidden"
            title="Toggle list view"
          >
            {showListView ? (
              <MapIcon className="h-5 w-5 text-gray-600" />
            ) : (
              <LayoutList className="h-5 w-5 text-gray-600" />
            )}
          </button>
        </div>

        {/* Reset / Compass FAB (bottom-right) */}
        <button
          onClick={resetView}
          className="absolute bottom-3 right-3 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-purple-700 shadow-xl shadow-purple-900/30 ring-2 ring-white transition-all hover:bg-purple-800 active:scale-95"
          title="Reset view to Lompoc"
        >
          <Compass className="h-6 w-6 text-white" />
        </button>

        {/* Mobile bottom drawer */}
        {showListView && (
          <div className="absolute bottom-0 left-0 right-0 z-20 max-h-[60vh] overflow-auto rounded-t-2xl bg-white shadow-2xl lg:hidden">
            <div className="sticky top-0 flex justify-center bg-white pt-2 pb-1">
              <div className="h-1 w-12 rounded-full bg-gray-300" />
            </div>
            <Sidebar
              pois={sidebarPois}
              selectedPoi={selectedPoi}
              hoveredPoi={hoveredPoi}
              userLocation={userLocation}
              distanceMap={distanceMap}
              onSelect={(poi) => {
                handleSidebarSelect(poi)
                setShowListView(false)
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
