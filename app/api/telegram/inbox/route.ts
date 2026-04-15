import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { telegramMessages } from "@/db/schema";
import { isNull, asc } from "drizzle-orm";

function verifyCronSecret(req: NextRequest): boolean {
  const secret = req.headers.get("x-cron-secret") ?? new URL(req.url).searchParams.get("secret");
  return !!secret && secret === process.env.CRON_SECRET;
}

// GET /api/telegram/inbox — returns unread messages queued from the board
// Protected by CRON_SECRET (same pattern as other protected API routes)
export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const messages = await db
    .select()
    .from(telegramMessages)
    .where(isNull(telegramMessages.readAt))
    .orderBy(asc(telegramMessages.createdAt));

  return NextResponse.json({ messages });
}

// POST /api/telegram/inbox/mark-read — mark specific message IDs as read
export async function POST(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let ids: number[];
  try {
    const body = await req.json();
    ids = body.ids;
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "ids must be a non-empty array" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { inArray } = await import("drizzle-orm");
  await db
    .update(telegramMessages)
    .set({ readAt: new Date() })
    .where(inArray(telegramMessages.id, ids));

  return NextResponse.json({ ok: true, markedRead: ids.length });
}
