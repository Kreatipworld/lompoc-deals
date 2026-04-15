import { NextRequest, NextResponse } from "next/server";
import { sendTelegramMessage } from "@/lib/telegram";
import { db } from "@/db/client";
import { telegramSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

function verifyCronSecret(req: NextRequest): boolean {
  const secret = req.headers.get("x-cron-secret") ?? new URL(req.url).searchParams.get("secret");
  return !!secret && secret === process.env.CRON_SECRET;
}

// POST /api/telegram/send — send a message to the board chat
// Body: { message: string, chatId?: string }
// If chatId is omitted, uses the stored board_chat_id from telegram_settings.
// Protected by CRON_SECRET.
export async function POST(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let message: string;
  let chatIdOverride: string | undefined;
  try {
    const body = await req.json();
    message = body.message;
    chatIdOverride = body.chatId;
    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Resolve target chat ID
  let chatId = chatIdOverride;
  if (!chatId) {
    const [setting] = await db
      .select()
      .from(telegramSettings)
      .where(eq(telegramSettings.key, "board_chat_id"));
    chatId = setting?.value;
  }

  if (!chatId) {
    return NextResponse.json(
      { error: "No board chat ID configured. Have a board member send /start to the bot first." },
      { status: 422 }
    );
  }

  await sendTelegramMessage(chatId, message);
  return NextResponse.json({ ok: true, chatId });
}
