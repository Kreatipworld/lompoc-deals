import { LompocInteractiveMapLoader } from "@/components/map/LompocInteractiveMapLoader"

export const metadata = {
  title: "Explore Lompoc — Interactive Map",
  description:
    "Discover Lompoc, California on an immersive 3D map. Hotels, wineries, historic sites, outdoor adventures, and more — all in one place.",
}

export default function MapPage() {
  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden">
      <LompocInteractiveMapLoader />
    </div>
  )
}
