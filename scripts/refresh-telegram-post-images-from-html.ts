/**
 * Оновлює масив `images` у `telegram_posts`, витягуючи CDN/Telegraph URL з `raw_html`
 * і тексту так само, як на дашборді. Запускати після змін у парсері медіа або якщо
 * превʼю зникли через застарілі URL у колонці `images`.
 *
 * npm run refresh:post-images
 */

import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local") });

async function main() {
  const { isSupabaseConfigured } = await import("@/lib/supabase/server");
  if (!isSupabaseConfigured()) {
    console.error("Потрібні змінні Supabase у .env.local");
    process.exit(1);
  }

  const { listTelegramPostsFromDb, updateTelegramPostImages } = await import(
    "@/lib/telegram-db"
  );
  const { expandTelegramPostImages } = await import("@/lib/telegram-media-urls");

  const posts = await listTelegramPostsFromDb();
  let updated = 0;
  let unchanged = 0;

  for (const p of posts) {
    const next = expandTelegramPostImages(p);
    const prevJson = JSON.stringify(p.images);
    const nextJson = JSON.stringify(next);
    if (prevJson === nextJson) {
      unchanged += 1;
      continue;
    }
    await updateTelegramPostImages(p.postId, next);
    updated += 1;
    if (updated <= 5 || updated % 50 === 0) {
      console.log(
        `post_id ${p.postId}: images ${(p.images?.length ?? 0)} → ${next.length}`,
      );
    }
  }

  console.log("");
  console.log("Рядків у БД:", posts.length);
  console.log("Оновлено записів images:", updated);
  console.log("Без змін:", unchanged);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
