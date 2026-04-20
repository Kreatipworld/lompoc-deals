import { streamText, stepCountIs, tool, convertToModelMessages } from "ai"
import { createAnthropic } from "@ai-sdk/anthropic"
import { z } from "zod"
import { db } from "@/db/client"
import { deals, businesses, categories, activities, events } from "@/db/schema"
import { and, eq, gt, ilike, or, desc } from "drizzle-orm"
import { sql as sqlExpr } from "drizzle-orm"

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const SYSTEM_PROMPT = `You are the Lompoc Guide — a friendly, knowledgeable local assistant for Lompoc, California. You help residents and visitors discover deals, local businesses, activities, and events in Lompoc.

You have access to real-time data from the Lompoc Deals platform including:
- Active deals and coupons from local businesses
- Business directory with contact info, hours, and categories
- Local activities and things to do
- Upcoming community events

Guidelines:
- Be warm, helpful, and concise
- Always use the search tools to get accurate, up-to-date information before answering
- When recommending deals, mention the discount, business name, and when it expires
- When recommending businesses, include their address and phone if available
- For directions, provide the address and suggest using Google Maps or Apple Maps
- If you can't find something specific, suggest alternatives or broader searches
- Keep responses focused and practical — people want to act on your recommendations
- Use bullet points for lists of 3+ items
- Always mention if a deal is expiring soon (within 3 days)`

export async function POST(req: Request) {
  const { messages } = await req.json()

  const result = streamText({
    model: anthropic("claude-haiku-4-5-20251001"),
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    stopWhen: stepCountIs(5),
    tools: {
      searchDeals: tool({
        description: "Search for active deals and coupons in Lompoc by keyword or category",
        inputSchema: z.object({
          query: z.string().optional().describe("Keyword to search in deal titles and descriptions"),
          category: z.string().optional().describe("Category slug like food-drink, retail, services, health-beauty"),
          type: z.enum(["coupon", "special", "announcement"]).optional().describe("Type of deal"),
          limit: z.number().min(1).max(20).default(8).describe("Number of results to return"),
        }),
        execute: async ({ query, category, type, limit }) => {
          const now = new Date()
          const conditions = [
            gt(deals.expiresAt, now),
            eq(businesses.status, "approved"),
            sqlExpr`${deals.paused} = false`,
          ]

          if (type) conditions.push(eq(deals.type, type))
          if (query) {
            conditions.push(
              or(
                ilike(deals.title, `%${query}%`),
                ilike(deals.description, `%${query}%`),
                ilike(businesses.name, `%${query}%`)
              )!
            )
          }
          if (category) {
            conditions.push(eq(categories.slug, category))
          }

          const rows = await db
            .select({
              id: deals.id,
              type: deals.type,
              title: deals.title,
              description: deals.description,
              discountText: deals.discountText,
              expiresAt: deals.expiresAt,
              bizName: businesses.name,
              bizSlug: businesses.slug,
              bizAddress: businesses.address,
              bizPhone: businesses.phone,
              catName: categories.name,
            })
            .from(deals)
            .innerJoin(businesses, eq(deals.businessId, businesses.id))
            .leftJoin(categories, eq(businesses.categoryId, categories.id))
            .where(and(...conditions))
            .orderBy(desc(deals.createdAt))
            .limit(limit)

          return rows.map((r) => ({
            ...r,
            expiresAt: r.expiresAt.toISOString(),
            daysLeft: Math.ceil((r.expiresAt.getTime() - now.getTime()) / 86400000),
          }))
        },
      }),

      searchBusinesses: tool({
        description: "Search for local businesses in Lompoc by name or category",
        inputSchema: z.object({
          query: z.string().optional().describe("Business name or keyword"),
          category: z.string().optional().describe("Category slug like food-drink, retail, services, health-beauty, entertainment"),
          limit: z.number().min(1).max(15).default(6).describe("Number of results"),
        }),
        execute: async ({ query, category, limit }) => {
          const conditions = [eq(businesses.status, "approved")]

          if (query) {
            conditions.push(
              or(
                ilike(businesses.name, `%${query}%`),
                ilike(businesses.description, `%${query}%`)
              )!
            )
          }
          if (category) {
            conditions.push(eq(categories.slug, category))
          }

          const rows = await db
            .select({
              id: businesses.id,
              name: businesses.name,
              slug: businesses.slug,
              description: businesses.description,
              address: businesses.address,
              phone: businesses.phone,
              website: businesses.website,
              categoryName: categories.name,
            })
            .from(businesses)
            .leftJoin(categories, eq(businesses.categoryId, categories.id))
            .where(and(...conditions))
            .limit(limit)

          return rows
        },
      }),

      getActivities: tool({
        description: "Get local activities and things to do in Lompoc (parks, wineries, trails, attractions)",
        inputSchema: z.object({
          query: z.string().optional().describe("Activity type or keyword"),
          limit: z.number().min(1).max(10).default(5),
        }),
        execute: async ({ query, limit }) => {
          const conditions = query
            ? [or(ilike(activities.title, `%${query}%`), ilike(activities.description, `%${query}%`), ilike(activities.category, `%${query}%`))!]
            : []

          const rows = await db
            .select({
              id: activities.id,
              title: activities.title,
              category: activities.category,
              description: activities.description,
              address: activities.address,
              tips: activities.tips,
              seasonality: activities.seasonality,
            })
            .from(activities)
            .where(conditions.length ? and(...conditions) : undefined)
            .limit(limit)

          return rows
        },
      }),

      getUpcomingEvents: tool({
        description: "Get upcoming community events in Lompoc",
        inputSchema: z.object({
          query: z.string().optional().describe("Event type or keyword"),
          limit: z.number().min(1).max(10).default(5),
        }),
        execute: async ({ query, limit }) => {
          const now = new Date()
          const conditions = [
            gt(events.startsAt, now),
            eq(events.status, "approved"),
          ]

          if (query) {
            conditions.push(
              or(
                ilike(events.title, `%${query}%`),
                ilike(events.description, `%${query}%`)
              )!
            )
          }

          const rows = await db
            .select({
              id: events.id,
              title: events.title,
              description: events.description,
              location: events.location,
              category: events.category,
              startsAt: events.startsAt,
              endsAt: events.endsAt,
            })
            .from(events)
            .where(and(...conditions))
            .orderBy(events.startsAt)
            .limit(limit)

          return rows.map((r) => ({
            ...r,
            startsAt: r.startsAt.toISOString(),
            endsAt: r.endsAt?.toISOString() ?? null,
          }))
        },
      }),

      getCategories: tool({
        description: "Get available business categories in Lompoc",
        inputSchema: z.object({}),
        execute: async () => {
          const rows = await db
            .select({ name: categories.name, slug: categories.slug })
            .from(categories)
          return rows
        },
      }),
    },
  })

  return result.toUIMessageStreamResponse()
}
