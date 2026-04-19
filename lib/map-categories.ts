import {
  Wine,
  UtensilsCrossed,
  ShoppingBag,
  Heart,
  PartyPopper,
  Wrench,
  Car,
  MapPin,
  Leaf,
  Home,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

export type CategoryId =
  | "wineries"
  | "food-drink"
  | "retail"
  | "health-beauty"
  | "entertainment"
  | "services"
  | "auto"
  | "other"
  | "dispensaries"
  | "real-estate"

export interface Category {
  id: CategoryId
  name: string
  color: string
  icon: LucideIcon
  emoji: string
}

export const CATEGORIES: Category[] = [
  {
    id: "wineries",
    name: "Wine & Wineries",
    color: "#DC2626",
    icon: Wine,
    emoji: "🍷",
  },
  {
    id: "food-drink",
    name: "Food & Drink",
    color: "#EA580C",
    icon: UtensilsCrossed,
    emoji: "🍽️",
  },
  {
    id: "retail",
    name: "Shopping & Retail",
    color: "#3B82F6",
    icon: ShoppingBag,
    emoji: "🛍️",
  },
  {
    id: "health-beauty",
    name: "Health & Beauty",
    color: "#EC4899",
    icon: Heart,
    emoji: "💆",
  },
  {
    id: "entertainment",
    name: "Entertainment",
    color: "#8B5CF6",
    icon: PartyPopper,
    emoji: "🎉",
  },
  {
    id: "services",
    name: "Services",
    color: "#64748B",
    icon: Wrench,
    emoji: "🔧",
  },
  {
    id: "auto",
    name: "Auto",
    color: "#1E40AF",
    icon: Car,
    emoji: "🚗",
  },
  {
    id: "dispensaries",
    name: "Dispensaries",
    color: "#16A34A",
    icon: Leaf,
    emoji: "🌿",
  },
  {
    id: "real-estate",
    name: "Real Estate",
    color: "#D97706",
    icon: Home,
    emoji: "🏠",
  },
  {
    id: "other",
    name: "Other",
    color: "#6B7280",
    icon: MapPin,
    emoji: "📍",
  },
]

export const CATEGORY_MAP = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c])
) as Record<CategoryId, Category>
