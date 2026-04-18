"use client"

import { useState, useMemo } from "react"
import type { CategoryId } from "@/lib/map-categories"
import { CATEGORIES } from "@/lib/map-categories"
import { POIS, type POI } from "@/lib/map-pois"

export function useMapFilter() {
  const [activeCategories, setActiveCategories] = useState<Set<CategoryId>>(
    new Set(CATEGORIES.map((c) => c.id))
  )
  const [searchQuery, setSearchQuery] = useState("")

  const toggleCategory = (id: CategoryId) => {
    setActiveCategories((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        // Don't allow deselecting all
        if (next.size === 1) return next
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const selectAllCategories = () => {
    setActiveCategories(new Set(CATEGORIES.map((c) => c.id)))
  }

  const filteredPois = useMemo(() => {
    let result = POIS.filter((p) => activeCategories.has(p.category))
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.highlight.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      )
    }
    return result
  }, [activeCategories, searchQuery])

  const searchResults = useMemo((): POI[] => {
    if (!searchQuery.trim()) return []
    const q = searchQuery.toLowerCase()
    return POIS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.highlight.toLowerCase().includes(q)
    ).slice(0, 8)
  }, [searchQuery])

  return {
    activeCategories,
    toggleCategory,
    selectAllCategories,
    searchQuery,
    setSearchQuery,
    filteredPois,
    searchResults,
  }
}
