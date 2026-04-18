"use client"

import { CATEGORIES } from "@/lib/map-categories"
import type { CategoryId } from "@/lib/map-categories"

interface CategoryFilterProps {
  activeCategories: Set<CategoryId>
  onToggle: (id: CategoryId) => void
  onSelectAll: () => void
}

export function CategoryFilter({
  activeCategories,
  onToggle,
  onSelectAll,
}: CategoryFilterProps) {
  const allActive = activeCategories.size === CATEGORIES.length

  return (
    <div className="absolute left-3 right-3 top-3 z-10 flex items-center gap-1.5 overflow-x-auto rounded-2xl bg-white/85 p-2 shadow-lg backdrop-blur-md">
      <button
        onClick={onSelectAll}
        className={`flex-shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap ${
          allActive
            ? "bg-gray-900 text-white shadow-sm"
            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
        }`}
      >
        All
      </button>
      {CATEGORIES.map((cat) => {
        const active = activeCategories.has(cat.id)
        const Icon = cat.icon
        return (
          <button
            key={cat.id}
            onClick={() => onToggle(cat.id)}
            className={`flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
              active
                ? "scale-105 text-white shadow-md"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
            style={active ? { backgroundColor: cat.color } : {}}
          >
            <Icon className="h-3.5 w-3.5" />
            {cat.name}
          </button>
        )
      })}
    </div>
  )
}
