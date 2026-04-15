import { NextRequest, NextResponse } from "next/server";
import { sendTelegramMessage, type TelegramUpdate } from "@/lib/telegram";
import { db } from "@/db/client";
import { deals, businesses, telegramSettings, telegramMessages } from "@/db/schema";
import { eq, sql, and, gt } from "drizzle-orm";

// Verify the request comes from Telegram using the secret token
function verifyTelegramRequest(req: NextRequest): boolean {
  const secretToken = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secretToken) return false;
  const incomingSecret = req.headers.get("x-telegram-bot-api-secret-token");
  return incomingSecret === secretToken;
}

async function saveChatId(chatId: number): Promise<void> {
  await db
    .insert(telegramSettings)
    .values({ key: "board_chat_id", value: String(chatId) })
    .onConflictDoUpdate({
      target: telegramSettings.key,
      set: { value: String(chatId), updatedAt: new Date() },
    });
}

async function handleCommand(chatId: number, command: string, args?: string): Promise<string> {
  switch (command) {
    case "/start":
      await saveChatId(chatId);
      return (
        "👋 *Welcome to Lompoc Deals Bot!*\n\n" +
        "I'm here to help the board stay connected with the platform.\n\n" +
        "Commands:\n" +
        "/status — Platform snapshot\n" +
        "/ask <question> — Send a message to the CEO\n" +
        "/help — Show this message\n\n" +
        "_Your chat has been registered for board updates._"
      );

    case "/help":
      return (
        "*Available Commands*\n\n" +
        "/status — Platform snapshot (deals, businesses)\n" +
        "/ask <question> — Send a message to the CEO agent\n" +
        "/help — Show this message\n\n" +
        "_You can also send any free-text message to reach the CEO._"
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

    case "/ask": {
      if (!args?.trim()) {
        return "Usage: /ask <your question>\n\nExample: /ask What is the current revenue?";
      }
      return null as unknown as string; // signal: handled by caller via queueMessage
    }

    default:
      return (
        "I didn't recognise that command. Try /help to see what I can do."
      );
  }
}

async function queueMessage(
  chatId: number,
  text: string,
  fromName?: string,
  fromUsername?: string
): Promise<void> {
  await db.insert(telegramMessages).values({
    chatId: String(chatId),
    text,
    fromName: fromName ?? null,
    fromUsername: fromUsername ?? null,
  });
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
  const senderName = message.from?.first_name ?? "Board member";
  const senderUsername = message.from?.username;

  // Extract command (strip bot username suffix if present, e.g. /start@MyBot)
  const commandMatch = text.match(/^(\/\w+)(?:\s+([\s\S]*))?$/);
  if (commandMatch) {
    const command = commandMatch[1].toLowerCase();
    const args = commandMatch[2]?.trim();

    if (command === "/ask") {
      // Queue the /ask message for CEO to read
      const question = args ?? "";
      if (!question) {
        await sendTelegramMessage(chatId, "Usage: /ask <your question>\n\nExample: /ask What is the current revenue?");
      } else {
        await queueMessage(chatId, `[/ask from ${senderName}${senderUsername ? " @" + senderUsername : ""}]: ${question}`, senderName, senderUsername);
        await sendTelegramMessage(chatId, "✅ Your question has been queued for the CEO. You'll hear back soon.");
      }
    } else {
      const reply = await handleCommand(chatId, command, args);
      await sendTelegramMessage(chatId, reply);
    }
  } else {
    // Free-text message → queue for CEO
    await queueMessage(chatId, text, senderName, senderUsername);
    await sendTelegramMessage(
      chatId,
      `✅ Message received, ${senderName}. The CEO will respond shortly.`
    );
  }

  return NextResponse.json({ ok: true });
}
