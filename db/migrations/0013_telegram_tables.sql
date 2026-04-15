-- Telegram settings: key-value store (board chat ID, etc.)
CREATE TABLE IF NOT EXISTS "telegram_settings" (
  "key" varchar(100) PRIMARY KEY,
  "value" text NOT NULL,
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

-- Telegram message inbox: free-text messages from board members
CREATE TABLE IF NOT EXISTS "telegram_messages" (
  "id" serial PRIMARY KEY,
  "chat_id" varchar(50) NOT NULL,
  "from_name" varchar(200),
  "from_username" varchar(200),
  "text" text NOT NULL,
  "read_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
