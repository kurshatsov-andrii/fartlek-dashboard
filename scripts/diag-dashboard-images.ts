/**
 * Діагностика превʼю на локалі (читає `.env.local`).
 * npm exec tsx --tsconfig tsconfig.json scripts/diag-dashboard-images.ts
 */

import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local") });

async function main() {
  const { isSupabaseConfigured } = await import("@/lib/supabase/server");
  const { loadTelegramDashboardDirect } = await import(
    "@/lib/telegram-dashboard-cache"
  );
  const { listTelegramPostsFromDb } = await import("@/lib/telegram-db");
  const {
    telegramPostCoverCandidates,
    dominantPosterAssetKeysAcrossPosts,
  } = await import("@/lib/telegram-media-urls");

  console.log("Supabase (service role):", isSupabaseConfigured() ? "yes" : "no");

  if (isSupabaseConfigured()) {
    const posts = await listTelegramPostsFromDb();
    console.log("Rows telegram_posts:", posts.length);
    const sample = posts.slice(0, 8);
    const dominantKeys = dominantPosterAssetKeysAcrossPosts(posts);
    console.log("dominant poster keys:", dominantKeys.size);
    for (const p of sample) {
      const cov = telegramPostCoverCandidates(p, dominantKeys);
      console.log({
        post_id: p.postId,
        db_images_len: p.images?.length ?? 0,
        raw_html_len: p.rawHtml?.length ?? 0,
        cover_primary: cov[0]?.slice(0, 96) ?? "",
      });
    }
  } else {
    console.log("(Без Supabase дашборд тягне напряму Telegram preview HTML)");
  }

  const { events } = await loadTelegramDashboardDirect();
  console.log("Sport events на дашборді:", events.length);
  for (const e of events.slice(0, 6)) {
    console.log({
      title: e.title.slice(0, 56),
      image: e.image?.slice(0, 96) ?? "",
      registrationLink: e.registrationLink?.slice(0, 64) ?? "",
    });
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
