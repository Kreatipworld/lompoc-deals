# CEO Agent Prompt — LompocLocal: Stunning Mapbox Interactive Map

Copy and paste everything below the line into your CEO agent.

---

## PROMPT START

You are the lead developer for **LompocLocal**, a Next.js + React community platform deployed on Vercel at `lompoc-deals.vercel.app`. Your mission is to build an **absolutely stunning, immersive Mapbox-powered interactive map** that becomes the centerpiece of the site — the kind of map people screenshot and share because it looks that good.

**Brand:** deep purple `#581C87` primary, electric blue `#3B82F6` accent, white `#FFFFFF` background. Fonts: **Outfit** (headings), **Inter** (body).

---

## PART 1: SETUP & DEPENDENCIES

```bash
npm install mapbox-gl react-map-gl @mapbox/mapbox-gl-geocoder
```

The user has a Mapbox token ready. Store it in `.env.local`:
```
NEXT_PUBLIC_MAPBOX_TOKEN=your_token_here
```

Import the Mapbox CSS in your layout or page:
```tsx
import 'mapbox-gl/dist/mapbox-gl.css';
```

---

## PART 2: THE MAP — MAKE IT UNFORGETTABLE

### 2A. Map Configuration

Center on Lompoc: **lat 34.6391, lng -120.4579**, initial zoom **12.5**.

Use `react-map-gl` (the `Map` component from `react-map-gl`). Configure:

```tsx
<Map
  mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
  initialViewState={{
    longitude: -120.4579,
    latitude: 34.6391,
    zoom: 12.5,
    pitch: 45,        // Tilted for 3D effect
    bearing: -15       // Slight rotation for drama
  }}
  mapStyle="mapbox://styles/mapbox/outdoors-v12"
  terrain={{ source: 'mapbox-dem', exaggeration: 1.5 }}
  fog={{
    range: [0.8, 8],
    color: '#d6e8ff',
    'horizon-blend': 0.1,
    'high-color': '#245bde',
    'space-color': '#000000',
    'star-intensity': 0.15
  }}
  maxBounds={[
    [-120.62, 34.52],   // Southwest
    [-120.28, 34.76]    // Northeast — keeps users in the Lompoc area
  ]}
/>
```

### 2B. 3D Terrain

Enable **3D terrain** so users can see Lompoc's valley and surrounding hills. Add a raster-DEM source:

```tsx
// Inside the Map, add a Source for terrain
<Source
  id="mapbox-dem"
  type="raster-dem"
  url="mapbox://mapbox.mapbox-terrain-dem-v1"
  tileSize={512}
  maxzoom={14}
/>
```

This makes the valley, the hills, the coast — all of it pop in three dimensions. Lompoc sits in a beautiful valley and this needs to be visible.

### 2C. Custom Map Style

Start with `mapbox://styles/mapbox/outdoors-v12` (shows terrain + trails), then override these layers using `Map`'s `onLoad` event to inject the LompocLocal brand feel:

- **Water:** `#3B82F6` (electric blue) at 40% opacity
- **Parks / green areas:** `#10B981` (emerald) at 30% opacity  
- **Roads — major:** `#581C87` (deep purple) thin lines
- **Roads — minor:** `#CBD5E1` (slate gray)
- **Building footprints:** Enable 3D extrusion with soft purple tint `#EDE9FE`
- **Labels:** Use the `Outfit` font if loaded into Mapbox Studio, otherwise `DIN Pro` (Mapbox default) in `#581C87`
- **Sky layer:** Add a sky layer for atmosphere:
```tsx
map.addLayer({
  id: 'sky',
  type: 'sky',
  paint: {
    'sky-type': 'atmosphere',
    'sky-atmosphere-sun': [0.0, 0.0],
    'sky-atmosphere-sun-intensity': 15
  }
});
```

### 2D. Day / Night Mode Toggle

Add a toggle button in the top-right corner of the map:
- **Day mode:** `mapbox://styles/mapbox/outdoors-v12` — bright, inviting, shows trails and nature
- **Night mode:** `mapbox://styles/mapbox/navigation-night-v1` — dramatic dark map with glowing markers, perfect for the "nightlife & wine tasting" vibe

Animate the transition with `map.setStyle()` and fade markers in/out during the switch. The toggle should be a sun/moon icon button with smooth animation.

---

## PART 3: MARKERS & POINTS OF INTEREST

### 3A. Category System

Create a category-based marker system. Each category has a unique **color**, **icon**, and **emoji** for fallback:

| Category | Color | Icon (lucide-react) | Emoji |
|---|---|---|---|
| Hotels & Stays | `#581C87` (purple) | `Bed` | 🏨 |
| Wine & Dining | `#DC2626` (red) | `Wine` | 🍷 |
| History & Culture | `#D97706` (amber) | `Landmark` | 🏛️ |
| Outdoor & Beach | `#059669` (emerald) | `Mountain` | 🌊 |
| Shopping & Local | `#3B82F6` (blue) | `ShoppingBag` | 🛍️ |
| Flowers & Nature | `#EC4899` (pink) | `Flower2` | 🌸 |
| Events & Fun | `#8B5CF6` (violet) | `PartyPopper` | 🎉 |

### 3B. Custom Animated Markers

Do NOT use default Mapbox markers. Create custom React marker components:

```tsx
// Each marker is a pulsing dot with category color + icon
<Marker longitude={lng} latitude={lat}>
  <div className="relative group cursor-pointer">
    {/* Pulse ring animation */}
    <div className="absolute inset-0 rounded-full animate-ping opacity-20"
         style={{ backgroundColor: categoryColor }} />
    {/* Main marker dot */}
    <div className="w-10 h-10 rounded-full flex items-center justify-center
                    shadow-lg border-2 border-white transform transition-transform
                    group-hover:scale-125"
         style={{ backgroundColor: categoryColor }}>
      <CategoryIcon className="w-5 h-5 text-white" />
    </div>
    {/* Label on hover */}
    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap
                    bg-white px-2 py-1 rounded-md text-xs font-semibold shadow-md
                    opacity-0 group-hover:opacity-100 transition-opacity"
         style={{ color: categoryColor }}>
      {placeName}
    </div>
  </div>
</Marker>
```

### 3C. Full Point-of-Interest Data

Plot ALL of these on the map. This is the heart of the experience:

**🏨 Hotels & Stays**

| Name | Lat | Lng | Price | Rating | Highlight |
|---|---|---|---|---|---|
| Embassy Suites by Hilton Lompoc | 34.6475 | -120.4530 | $$$ | 4.2 | Full suites, complimentary breakfast & evening reception |
| Hilton Garden Inn Lompoc | 34.6480 | -120.4525 | $$$ | 4.0 | Modern rooms, on-site restaurant, pool |
| Holiday Inn Express Lompoc | 34.6350 | -120.4610 | $$ | 3.8 | Free breakfast, indoor pool, reliable comfort |
| SureStay Plus by Best Western | 34.6385 | -120.4570 | $$ | 3.6 | Free Wi-Fi, parking, continental breakfast |
| O'Cairns Inn & Suites | 34.6410 | -120.4560 | $$ | 3.7 | Charming local inn with garden courtyard |
| Inn of Lompoc | 34.6360 | -120.4590 | $ | 3.3 | Budget-friendly, outdoor pool, highway access |
| Lotus of Lompoc | 34.6395 | -120.4545 | $ | 3.5 | Cozy boutique feel, personalized service |
| Village Inn | 34.6370 | -120.4580 | $ | 3.2 | Classic inn, walking distance to Old Town |
| Motel 6 Lompoc | 34.6340 | -120.4600 | $ | 3.0 | Affordable, pet-friendly |
| Red Roof Inn Lompoc | 34.6330 | -120.4615 | $ | 3.0 | No-frills, free parking, pet-friendly |

**🍷 Wine & Dining**

| Name | Lat | Lng | Type | Highlight |
|---|---|---|---|---|
| Lompoc Wine Ghetto | 34.6420 | -120.4498 | Wine District | 17+ tasting rooms in one industrial complex — the crown jewel |
| Palmina Wines | 34.6418 | -120.4502 | Tasting Room | Italian varietals from Santa Barbara County |
| Fiddlehead Cellars | 34.6422 | -120.4495 | Tasting Room | Award-winning Pinot Noir and Sauvignon Blanc |
| Flying Goat Cellars | 34.6425 | -120.4492 | Tasting Room | Small-batch Pinot Noir specialist |
| Lompoc Craft Beer Trail | 34.6390 | -120.4565 | Brewery Hub | Local craft breweries worth exploring |
| South Side Coffee Co. | 34.6388 | -120.4572 | Café | Best local coffee and pastries |
| Sissy's Uptown Café | 34.6392 | -120.4568 | Restaurant | Beloved local brunch spot |

**🏛️ History & Culture**

| Name | Lat | Lng | Highlight |
|---|---|---|---|
| La Purisima Mission State Historic Park | 34.6689 | -120.4190 | Most fully restored of California's 21 missions. Daily tours at 1 PM |
| Lompoc Museum | 34.6388 | -120.4578 | Local history from Chumash to present day |
| Old Town Mural Walk | 34.6385 | -120.4575 | Self-guided tour of 30+ stunning outdoor murals |
| Cypress Gallery | 34.6390 | -120.4580 | Rotating exhibits from local artists |

**🌊 Outdoor & Beach**

| Name | Lat | Lng | Highlight |
|---|---|---|---|
| Jalama Beach County Park | 34.5108 | -120.5004 | Hidden gem beach — camping, surfing, and the famous Jalama Burger |
| Surf Beach | 34.6850 | -120.6050 | Popular surf spot near Vandenberg |
| River Park Trail | 34.6400 | -120.4650 | Scenic walking and biking along the Santa Ynez River |
| Allan Hancock Trail | 34.6450 | -120.4700 | Easy hiking with valley views |
| Skydive Lompoc | 34.6650 | -120.4680 | Tandem jumps with views of the Channel Islands |

**🌸 Flowers & Nature**

| Name | Lat | Lng | Highlight |
|---|---|---|---|
| Lompoc Flower Fields | 34.6500 | -120.4400 | Sweet pea, larkspur & more — blooming April through September |
| Vandenberg Launch Viewing | 34.7483 | -120.5182 | Watch rocket launches from public viewing areas |

**🎉 Events & Fun**

| Name | Lat | Lng | Highlight |
|---|---|---|---|
| Lompoc Flower Festival (Ryon Park) | 34.6380 | -120.4620 | Annual celebration of Lompoc's floral heritage |
| Old Town Friday Market | 34.6387 | -120.4573 | Weekly farmers market — produce, crafts, live music |

---

## PART 4: POPUP CARDS (THE WOW FACTOR)

When a user clicks a marker, show a rich popup card — not a boring default tooltip. Use Mapbox GL JS `Popup` or a custom React overlay positioned over the map.

**Popup card design:**

```
┌──────────────────────────────────┐
│ [Category Badge]    [★ 4.2]     │
│                                  │
│  Embassy Suites by Hilton        │
│  Full suites with complimentary  │
│  breakfast & evening reception   │
│                                  │
│  💰 $$$  📍 0.3 mi from center  │
│                                  │
│  ┌──────────┐  ┌──────────────┐ │
│  │ Directions│  │  View Details │ │
│  └──────────┘  └──────────────┘ │
└──────────────────────────────────┘
```

- **Category badge:** Colored pill with icon + category name
- **Star rating:** Gold stars, numerically displayed
- **Distance:** Calculate distance from map center to the POI (use Turf.js `@turf/distance`)
- **Directions button:** Opens Google Maps directions in a new tab (`https://www.google.com/maps/dir/?api=1&destination={lat},{lng}`)
- **View Details button:** Links to that POI's page on LompocLocal (future feature — for now, scrolls to a details section)
- **Smooth entrance animation:** Popup fades in and slides up 10px on open

---

## PART 5: FILTER & SEARCH CONTROLS

### 5A. Category Filter Bar

Place a horizontal scrollable filter bar **on top of the map** (floating, semi-transparent glass effect):

```tsx
<div className="absolute top-4 left-4 right-4 z-10 flex gap-2 overflow-x-auto
                bg-white/80 backdrop-blur-md rounded-2xl p-2 shadow-lg">
  {categories.map(cat => (
    <button
      key={cat.id}
      onClick={() => toggleCategory(cat.id)}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold
                  whitespace-nowrap transition-all ${
                    activeCategories.includes(cat.id)
                      ? 'text-white shadow-md scale-105'
                      : 'text-gray-500 bg-gray-100 hover:bg-gray-200'
                  }`}
      style={activeCategories.includes(cat.id) ? { backgroundColor: cat.color } : {}}
    >
      <cat.Icon className="w-4 h-4" />
      {cat.name}
    </button>
  ))}
</div>
```

When a category is toggled off, its markers fade out with a smooth opacity transition (don't just remove them — animate them).

### 5B. Search Box

Add a search/geocoder input that:
- Filters POIs by name as the user types (fuzzy search)
- Shows an autocomplete dropdown with matching POIs, grouped by category
- When a result is selected, the map flies to that location (`flyTo` with zoom 16, pitch 60) and opens its popup
- Use a debounced input (300ms) for smooth performance

### 5C. "Near Me" Button

A GPS button that:
- Requests the user's location via `navigator.geolocation`
- Drops a blue pulsing "You are here" marker
- Calculates and displays distance to each POI
- Sorts the sidebar list by proximity

---

## PART 6: SIDEBAR LIST (SYNCED WITH MAP)

On desktop (>1024px), show a **sidebar panel** to the left of the map (350px wide). On mobile, it becomes a **bottom drawer** that the user can swipe up.

**Sidebar features:**
- Lists all visible POIs grouped by category
- Each item shows: icon, name, one-line description, distance (if location enabled), rating
- Clicking an item flies the map to that POI and opens its popup
- When the user pans/zooms the map, the sidebar updates to show only POIs currently visible in the viewport
- Active/hovered item in the sidebar highlights the corresponding marker on the map (scale up + glow effect)
- Smooth scroll to active item in sidebar when a marker is clicked on the map

**Bottom drawer (mobile):**
- Default state: shows a "peek" bar with "12 places nearby" and a drag handle
- Half-open: shows the list scrollable
- Full-open: covers most of the screen for easy browsing
- Use CSS `scroll-snap` and touch gestures for the drawer

---

## PART 7: ANIMATED FLY-TO JOURNEYS

Add a **"Take a Tour"** button that triggers an automated camera journey through Lompoc's highlights:

```tsx
const tourStops = [
  { center: [-120.4579, 34.6391], zoom: 13, pitch: 0, bearing: 0, label: "Welcome to Lompoc" },
  { center: [-120.4498, 34.6420], zoom: 16, pitch: 60, bearing: 30, label: "The Wine Ghetto" },
  { center: [-120.4190, 34.6689], zoom: 15, pitch: 50, bearing: -20, label: "La Purisima Mission" },
  { center: [-120.4400, 34.6500], zoom: 14, pitch: 45, bearing: 10, label: "Flower Fields" },
  { center: [-120.5004, 34.5108], zoom: 14, pitch: 55, bearing: -30, label: "Jalama Beach" },
  { center: [-120.4579, 34.6391], zoom: 12.5, pitch: 45, bearing: -15, label: "Explore Lompoc" },
];
```

For each stop:
1. `map.flyTo()` with `duration: 3000`, `essential: true`
2. Show a floating label card with the stop name + a brief one-liner
3. Pause 2 seconds at each stop
4. Show a progress bar at the bottom indicating tour progress
5. Allow the user to skip or exit the tour at any time

---

## PART 8: MICRO-INTERACTIONS & POLISH

These details separate a good map from a **jaw-dropping** one:

1. **Marker entrance animation:** When the map loads, markers don't just appear — they drop in from above with a staggered delay (50ms between each), bouncing slightly on landing.

2. **Cluster markers:** When zoomed out, nearby POIs cluster into a single circle showing the count. The circle's color is a gradient of the categories within it. Clicking a cluster zooms in to reveal individual markers with a smooth spread animation.

3. **Hover glow:** When hovering over a marker, add a soft colored glow/shadow behind it using CSS `box-shadow` with the category color.

4. **Map loading shimmer:** While the map tiles load, show a skeleton loader with a subtle shimmer animation in the map container (purple-to-blue gradient shimmer).

5. **"Explore" floating action button:** A branded purple FAB in the bottom-right corner with a compass icon. Tapping it resets the view to the default position with a smooth animation.

6. **Current weather badge:** A small floating pill in the top-right of the map showing real-time Lompoc weather (temperature + icon). Use OpenWeatherMap free API or hardcode seasonal data.

7. **Scroll-triggered reveal:** When the map section scrolls into view, it fades in and the camera does a gentle zoom-in animation from zoom 10 to 12.5, giving a cinematic "arriving in Lompoc" feel.

8. **Share this map:** A share button that copies a deep link with the current map state (center, zoom, selected POI) to the clipboard.

---

## PART 9: PERFORMANCE & ACCESSIBILITY

- **Lazy load** the entire map component with `next/dynamic` and `ssr: false`
- **Preload** critical Mapbox assets with `<link rel="preload">`
- Map container must have `role="application"` and `aria-label="Interactive map of Lompoc, California"`
- All markers must be keyboard focusable (`tabIndex={0}`) and show popups on Enter
- Provide a **"List View" toggle** for users who prefer a non-map experience (shows all POIs as cards)
- Image optimization: use `next/image` for any photos in popups
- Keep the map performant: use `useMemo` for marker arrays, debounce viewport calculations

---

## PART 10: FILE STRUCTURE

```
src/app/map/page.tsx                    — Full-page map experience
src/components/map/LompocMap.tsx        — Main map component (dynamic import, no SSR)
src/components/map/MapMarker.tsx        — Custom animated marker component
src/components/map/MapPopup.tsx         — Rich popup card component  
src/components/map/CategoryFilter.tsx   — Floating filter bar
src/components/map/SearchBox.tsx        — Fuzzy search with autocomplete
src/components/map/Sidebar.tsx          — Desktop sidebar / mobile bottom drawer
src/components/map/TourButton.tsx       — "Take a Tour" fly-to journey
src/components/map/WeatherBadge.tsx     — Live weather floating pill
src/components/map/MapSkeleton.tsx      — Loading skeleton shimmer
src/data/pois.ts                        — All points of interest with coordinates
src/data/categories.ts                  — Category definitions (color, icon, label)
src/lib/mapUtils.ts                     — Distance calculations, viewport helpers
src/hooks/useMapFilter.ts              — Filter/search state management
src/hooks/useGeolocation.ts            — "Near Me" geolocation hook
```

---

## TONE & EXPERIENCE GOALS

This map should make someone feel like **Lompoc is the most exciting hidden gem in California**. It's not just a utility — it's an experience. When someone opens this map, they should:

1. Say "whoa" at the 3D terrain and tilted perspective
2. Want to click every single marker because they look alive and inviting
3. Use the "Take a Tour" button and feel like they're virtually visiting Lompoc
4. Share the map link with friends and say "look at this"
5. End up actually planning a trip to Lompoc

**This is the feature that makes LompocLocal unforgettable. Build it like it's going on the front page of Product Hunt.**

## PROMPT END
