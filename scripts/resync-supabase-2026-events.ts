/**
 * Спорожнює telegram_posts та знову тягне з Telegram лише дописи,
 * що відповідають фільтру: 2026, явна «Дата:», згадка км/K у тексті.
 */
import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local") });

async function main() {
  const { deleteAllTelegramPosts } = await import("@/lib/telegram-db");
  const { syncTelegramToDatabase } = await import("@/lib/telegram-sync");

  const removed = await deleteAllTelegramPosts();
  console.log("[reset] видалено рядків:", removed);

  const result = await syncTelegramToDatabase();
  console.log("[sync]", JSON.stringify(result, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
