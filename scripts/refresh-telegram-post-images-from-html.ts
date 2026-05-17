/**
 * Повністю перезаписує `telegram_posts.images`:
 * - лише HTTPS-посилання з публічної сторінки поста `https://t.me/{канал}/{post_id}`;
 * - без локального `/telegram-channel-cover.svg` та інших не-Telegram URL;
 * - без аватарки/og каналу (`t.me/{slug}`);
 * - без CDN-посилання, що повторюється у занадто багатьох дописах (типовий «один логотип на всіх»).
 *
 * Додати мердж із raw_html + текстом: REFRESH_POST_IMAGES_MERGE_LEGACY=1
 * Лише БД без запитів до t.me: REFRESH_POST_IMAGES_SKIP_PUBLIC=1
 *
 * Частка дописів для глобального виключення однакового CDN (за замовчуванням 0.42): REFRESH_DOMINANT_IMAGE_RATIO=0.42
 *
 * npm run refresh:post-images
 *
 * Щоденний автозапуск на проді: Vercel Cron → GET /api/cron/refresh-post-images (див. vercel.json).
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

  const { runRefreshTelegramPostImagesJob } = await import(
    "@/lib/refresh-telegram-post-images-job"
  );
  await runRefreshTelegramPostImagesJob();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
