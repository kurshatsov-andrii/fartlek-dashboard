/**
 * 1) Очищає колонку `telegram_posts.images` для всіх рядків.
 * 2) Для кожного допису знімає превʼю з Telegram (HTML у БД + публічна сторінка поста),
 *    записує рівно один URL через `sanitizeDbTelegramImages`.
 *
 * Опціонально без кроку 1: REFILL_POST_IMAGES_SKIP_CLEAR=1
 * Пауза між запитами до t.me: REFILL_POST_IMAGES_GAP_MS (за замовчуванням 340)
 *
 * npm run refill:post-images
 */

import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local") });

const FETCH_GAP_MS = Math.max(
  0,
  Number.parseInt(process.env.REFILL_POST_IMAGES_GAP_MS ?? "340", 10) || 340,
);

const SKIP_CLEAR =
  process.env.REFILL_POST_IMAGES_SKIP_CLEAR === "1" ||
  /\btrue\b/i.test(process.env.REFILL_POST_IMAGES_SKIP_CLEAR ?? "");

async function pause(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const { isSupabaseConfigured } = await import("@/lib/supabase/server");
  if (!isSupabaseConfigured()) {
    console.error("Потрібні NEXT_PUBLIC_SUPABASE_URL та SUPABASE_SERVICE_ROLE_KEY у .env.local");
    process.exit(1);
  }

  const {
    clearAllTelegramPostImages,
    listTelegramPostsFromDb,
    updateTelegramPostImages,
  } = await import("@/lib/telegram-db");
  const { fetchFreshPosterUrlsFromPublicPostPage } = await import(
    "@/lib/telegram-tm-post-media"
  );
  const { fetchTelegramChannelBrandImageUrlKeys } = await import(
    "@/lib/telegram-channel-brand-media"
  );
  const {
    canonicalTelegramAssetUrlKey,
    extractOpenGraphImageUrlsFromHtml,
    expandTelegramPostImages,
    finalizePosterImageUrls,
    narrowTelegramPostImagesToSingleCover,
  } = await import("@/lib/telegram-media-urls");
  const { isRejectedStoredTelegramImageUrl } = await import("@/lib/event-image");

  function sortImageCandidates(
    htmlFragment: string | undefined,
    expandedBeforeFilter: readonly string[],
    finalizedUrls: string[],
  ): string[] {
    const ogKeys = new Set(
      extractOpenGraphImageUrlsFromHtml(htmlFragment ?? "").map((u) =>
        canonicalTelegramAssetUrlKey(u),
      ),
    );
    const expKeys = new Set(
      expandedBeforeFilter.map((u) => canonicalTelegramAssetUrlKey(u)),
    );
    return [...finalizedUrls].sort((a, b) => {
      const ak = canonicalTelegramAssetUrlKey(a);
      const bk = canonicalTelegramAssetUrlKey(b);
      const inExA = expKeys.has(ak) ? 0 : 1;
      const inExB = expKeys.has(bk) ? 0 : 1;
      if (inExA !== inExB) return inExA - inExB;
      const ogA = ogKeys.has(ak) ? 1 : 0;
      const ogB = ogKeys.has(bk) ? 1 : 0;
      return ogA - ogB;
    });
  }

  function filterRejectedAndBrand(
    urls: readonly string[],
    brandKeys: Set<string>,
  ): string[] {
    return finalizePosterImageUrls(
      urls.filter(
        (u) =>
          typeof u === "string" &&
          !isRejectedStoredTelegramImageUrl(u) &&
          !brandKeys.has(canonicalTelegramAssetUrlKey(u)),
      ),
    );
  }

  const { TELEGRAM_CHANNEL } = await import("@/services/telegram/parser");

  if (!SKIP_CLEAR) {
    const cleared = await clearAllTelegramPostImages();
    console.log("Очищено images у рядках:", cleared);
  } else {
    console.log("Пропуск очищення (REFILL_POST_IMAGES_SKIP_CLEAR=1)");
  }

  const posts = await listTelegramPostsFromDb();
  console.log("Дописів до заповнення:", posts.length);

  const brandKeys = await fetchTelegramChannelBrandImageUrlKeys(
    TELEGRAM_CHANNEL.username,
  );

  let withUrl = 0;
  let empty = 0;

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i]!;
    const permalink = `https://t.me/${post.channelId}/${post.postId}`;
    const expanded = expandTelegramPostImages(post);
    const fresh = await fetchFreshPosterUrlsFromPublicPostPage(permalink);

    const expF = sortImageCandidates(
      post.rawHtml,
      expanded,
      filterRejectedAndBrand(expanded, brandKeys),
    );

    const mergedF = sortImageCandidates(
      post.rawHtml,
      expanded,
      filterRejectedAndBrand([...expanded, ...fresh], brandKeys),
    );

    const primary =
      narrowTelegramPostImagesToSingleCover(expF).length > 0 ? expF : mergedF;

    const stored = narrowTelegramPostImagesToSingleCover(primary);
    if (stored.length > 0) withUrl += 1;
    else empty += 1;

    await updateTelegramPostImages(post.postId, primary);

    if (i < 6 || i === posts.length - 1) {
      console.log(
        `post_id ${post.postId}: у БД ${stored.length} URL (кандидатів ${primary.length})`,
      );
    }

    await pause(FETCH_GAP_MS);
  }

  console.log("");
  console.log("Готово. З превʼю:", withUrl, "| порожньо:", empty);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
