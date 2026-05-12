import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local") });

async function main() {
  const { listTelegramPostsFromDb, getLatestTelegramSyncTimeFromDb } =
    await import("@/lib/telegram-db");
  const { telegramPostsToSportEvents } = await import(
    "@/lib/sport-events-from-telegram",
  );

  const posts = await listTelegramPostsFromDb();
  const events = telegramPostsToSportEvents(posts);
  const lastSync = await getLatestTelegramSyncTimeFromDb();

  console.log("— Supabase telegram_posts —");
  console.log("Всього дописів у БД:", posts.length);
  console.log("Остання синхронізація (synced_at):", lastSync ?? "—");
  console.log("");
  console.log("— Як на головній (події 2026 + дистанція км/K) —");
  console.log("Подій на дашборді:", events.length);
  console.log("");
  const upcoming = events.filter((e) => e.state === "upcoming").slice(0, 8);
  console.log("Найближчі майбутні (до 8 шт.):");
  for (const e of upcoming) {
    console.log(
      `  • ${e.date.slice(0, 10)} · ${e.city} — ${e.title.slice(0, 72)}`,
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
