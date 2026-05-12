/**
 * Одноразово / Cron: наповнює public.telegram_posts з Telegram (див. lib/telegram-sync).
 * Перед запуском: виконайте SQL міграцію в Supabase та заповніть .env.local
 */
import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local") });

async function main() {
  const { syncTelegramToDatabase } = await import("@/lib/telegram-sync");
  const result = await syncTelegramToDatabase();
  console.log("[populate-supabase]", JSON.stringify(result, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
