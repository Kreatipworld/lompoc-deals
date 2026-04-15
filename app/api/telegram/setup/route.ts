import { NextRequest, NextResponse } from "next/server";
import { registerTelegramWebhook } from "@/lib/telegram";

// One-time endpoint to register the Telegram webhook.
// Call with: GET /api/telegram/setup?secret=<CRON_SECRET>
// This endpoint is protected by CRON_SECRET so only admins can trigger it.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");

  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const authUrl = process.env.AUTH_URL;

  if (!botToken) {
    return NextResponse.json(
      { error: "TELEGRAM_BOT_TOKEN is not set" },
      { status: 500 }
    );
  }
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "TELEGRAM_WEBHOOK_SECRET is not set" },
      { status: 500 }
    );
  }
  if (!authUrl) {
    return NextResponse.json(
      { error: "AUTH_URL is not set" },
      { status: 500 }
    );
  }

  const webhookUrl = `${authUrl}/api/telegram/webhook`;
  const ok = await registerTelegramWebhook(webhookUrl, webhookSecret);

  if (ok) {
    return NextResponse.json({
      success: true,
      webhookUrl,
      message: "Telegram webhook registered successfully.",
    });
  } else {
    return NextResponse.json(
      { error: "Failed to register Telegram webhook with Telegram API." },
      { status: 500 }
    );
  }
}
