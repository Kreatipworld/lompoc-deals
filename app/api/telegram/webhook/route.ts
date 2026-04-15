import { NextRequest, NextResponse } from "next/server";
import { sendTelegramMessage, type TelegramUpdate } from "@/lib/telegram";
import { db } from "@/db/client";
import { deals, businesses } from "@/db/schema";
import { eq, sql, and, gt } from "drizzle-orm";

// Verify the request comes from Telegram using the secret token
function verifyTelegramRequest(req: NextRequest): boolean {
  const secretToken = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secretToken) return false;
  const incomingSecret = req.headers.get("x-telegram-bot-api-secret-token");
  return incomingSecret === secretToken;
}

async function handleCommand(chatId: number, command: string): Promise<string> {
  switch (command) {
    case "/start":
      return (
        "👋 *Welcome to Lompoc Deals Bot!*\n\n" +
        "I'm here to help the board stay connected with the platform.\n\n" +
        "Commands:\n" +
        "/status — Platform snapshot\n" +
        "/help — Show this message"
      );

    case "/help":
      return (
        "*Available Commands*\n\n" +
        "/status — Platform snapshot (deals, businesses)\n" +
        "/help — Show this message"
      );

    case "/status": {
      try {
        const [dealCount] = await db
          .select({ count: sql<number>`count(*)` })
          .from(deals)
          .where(
            and(
              eq(deals.paused, false),
              gt(deals.expiresAt, new Date())
            )
          );

        const [bizCount] = await db
          .select({ count: sql<number>`count(*)` })
          .from(businesses)
          .where(eq(businesses.status, "approved"));

        return (
          "*📊 Lompoc Deals — Platform Status*\n\n" +
          `Active deals: *${dealCount?.count ?? 0}*\n` +
          `Approved businesses: *${bizCount?.count ?? 0}*\n\n` +
          `_As of ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}_`
        );
      } catch (err) {
        console.error("[Telegram] /status query failed:", err);
        return "⚠️ Could not fetch platform status right now. Try again shortly.";
      }
    }

    default:
      return (
        "I didn't recognise that command. Try /help to see what I can do."
      );
  }
}

export async function POST(req: NextRequest) {
  // Reject requests that don't have the correct secret token
  if (!verifyTelegramRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error("[Telegram] TELEGRAM_BOT_TOKEN is not set");
    return NextResponse.json({ error: "Bot not configured" }, { status: 500 });
  }

  let update: TelegramUpdate;
  try {
    update = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const message = update.message;
  if (!message?.text) {
    // Acknowledge non-text updates silently
    return NextResponse.json({ ok: true });
  }

  const chatId = message.chat.id;
  const text = message.text.trim();

  // Extract command (strip bot username suffix if present, e.g. /start@MyBot)
  const commandMatch = text.match(/^(\/\w+)/);
  if (commandMatch) {
    const command = commandMatch[1].toLowerCase();
    const reply = await handleCommand(chatId, command);
    await sendTelegramMessage(chatId, reply);
  } else {
    // Echo acknowledgement for plain messages
    const senderName = message.from?.first_name ?? "there";
    await sendTelegramMessage(
      chatId,
      `Hi ${senderName}! I received your message. Use /help to see what I can do.`
    );
  }

  return NextResponse.json({ ok: true });
}
