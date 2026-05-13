/**
 * Завантажує й кешує локально всі прев’ю з Telegram/Telegraph для подій на дашборді.
 *
 * Використання: npm run warm:event-images
 * Змінні: .env.local як у додатку (Supabase тощо). Кеш: .cache/event-images або EVENT_IMAGE_CACHE_DIR.
 */

import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local") });

async function main() {
  const { loadTelegramDashboardDirect } = await import(
    "@/lib/telegram-dashboard-cache"
  );
  const { warmAllEventImageCache } = await import("@/lib/warm-event-images");

  const { events } = await loadTelegramDashboardDirect();

  console.log("Подій на дашборді:", events.length);
  console.log("");

  const t0 = Date.now();
  const stats = await warmAllEventImageCache(events, { concurrency: 8 });
  const ms = Date.now() - t0;

  console.log("Готово за", (ms / 1000).toFixed(1), "с");
  console.log(stats);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
