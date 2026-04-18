import {
  Bed,
  Wine,
  Landmark,
  Mountain,
  ShoppingBag,
  Flower2,
  PartyPopper,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

export type CategoryId =
  | "hotels"
  | "wine"
  | "history"
  | "outdoor"
  | "shopping"
  | "flowers"
  | "events"

export interface Category {
  id: CategoryId
  name: string
  color: string
  icon: LucideIcon
  emoji: string
}

export const CATEGORIES: Category[] = [
  {
    id: "hotels",
    name: "Hotels & Stays",
    color: "#581C87",
    icon: Bed,
    emoji: "🏨",
  },
  {
    id: "wine",
    name: "Wine & Dining",
    color: "#DC2626",
    icon: Wine,
    emoji: "🍷",
  },
  {
    id: "history",
    name: "History & Culture",
    color: "#D97706",
    icon: Landmark,
    emoji: "🏛️",
  },
  {
    id: "outdoor",
    name: "Outdoor & Beach",
    color: "#059669",
    icon: Mountain,
    emoji: "🌊",
  },
  {
    id: "shopping",
    name: "Shopping & Local",
    color: "#3B82F6",
    icon: ShoppingBag,
    emoji: "🛍️",
  },
  {
    id: "flowers",
    name: "Flowers & Nature",
    color: "#EC4899",
    icon: Flower2,
    emoji: "🌸",
  },
  {
    id: "events",
    name: "Events & Fun",
    color: "#8B5CF6",
    icon: PartyPopper,
    emoji: "🎉",
  },
]

export const CATEGORY_MAP = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c])
) as Record<CategoryId, Category>
