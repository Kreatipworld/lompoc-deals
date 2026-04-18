"use client"

import dynamic from "next/dynamic"
import { MapSkeleton } from "./MapSkeleton"

export const LompocInteractiveMapLoader = dynamic(
  () => import("./LompocInteractiveMap").then((m) => ({ default: m.LompocInteractiveMap })),
  {
    ssr: false,
    loading: () => <MapSkeleton />,
  }
)
