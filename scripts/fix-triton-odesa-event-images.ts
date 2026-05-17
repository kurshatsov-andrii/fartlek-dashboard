/**
 * Tri Run, Open Water Fest 2026, Open Swim — одне превʼю в БД; пріоритет медіа з HTML
 * допису в БД (`raw_html`), щоб не підставляти спільне канальне превʼю з віджета t.me.
 *
 * npm exec tsx -- --tsconfig tsconfig.json scripts/fix-triton-odesa-event-images.ts
 */

import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local") });

const FETCH_GAP_MS = Math.max(
  0,
  Number.parseInt(process.env.FIX_EVENT_IMAGES_GAP_MS ?? "420", 10) || 420,
);

async function pause(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

const TARGETS = [
  { needle: "open water fest", fallbackPostId: 1971 },
  { needle: "open swim", fallbackPostId: 1981 },
  { needle: "tri run", fallbackPostId: 1980 },
] as const;

async function main() {
  const { isSupabaseConfigured } = await import("@/lib/supabase/server");
  if (!isSupabaseConfigured()) {
    console.error("Потрібні NEXT_PUBLIC_SUPABASE_URL та SUPABASE_SERVICE_ROLE_KEY у .env.local");
    process.exit(1);
  }

  const {
    canonicalTelegramAssetUrlKey,
    extractOpenGraphImageUrlsFromHtml,
    expandTelegramPostImages,
    finalizePosterImageUrls,
    narrowTelegramPostImagesToSingleCover,
  } = await import("@/lib/telegram-media-urls");

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
    isRejected: (u: string) => boolean,
  ): string[] {
    return finalizePosterImageUrls(
      urls.filter(
        (u) =>
          typeof u === "string" &&
          !isRejected(u) &&
          !brandKeys.has(canonicalTelegramAssetUrlKey(u)),
      ),
    );
  }

  const { listTelegramPostsFromDb, updateTelegramPostImages } = await import(
    "@/lib/telegram-db"
  );
  const { telegramPostsToSportEvents } = await import(
    "@/lib/sport-events-from-telegram"
  );
  const { fetchFreshPosterUrlsFromPublicPostPage } = await import(
    "@/lib/telegram-tm-post-media"
  );
  const { fetchTelegramChannelBrandImageUrlKeys } = await import(
    "@/lib/telegram-channel-brand-media"
  );
  const { TELEGRAM_CHANNEL } = await import("@/services/telegram/parser");
  const { isRejectedStoredTelegramImageUrl } = await import("@/lib/event-image");

  const posts = await listTelegramPostsFromDb();
  const events = telegramPostsToSportEvents(posts);
  const usedPostIds = new Set<number>();

  const brandKeys = await fetchTelegramChannelBrandImageUrlKeys(
    TELEGRAM_CHANNEL.username,
  );

  for (const { needle, fallbackPostId } of TARGETS) {
    const ev = events.find((e) => {
      const m = /^evt-tg-(\d+)$/.exec(e.id);
      const pid = m?.[1] ? Number(m[1]) : NaN;
      if (!Number.isFinite(pid) || usedPostIds.has(pid)) return false;
      return e.title.trim().toLowerCase().includes(needle);
    });

    let postId: number;
    let titleForLog: string;

    if (ev) {
      const m = /^evt-tg-(\d+)$/.exec(ev.id);
      postId = m?.[1] ? Number(m[1]) : fallbackPostId;
      titleForLog = ev.title.trim();
      usedPostIds.add(postId);
    } else {
      postId = fallbackPostId;
      titleForLog = `«${needle}» (fallback post_id)`;
      console.warn(
        `Подію за підрядком «${needle}» не знайдено серед ${events.length} івентів — використовуємо post_id=${fallbackPostId}.`,
      );
    }

    const post = posts.find((p) => p.postId === postId);
    if (!post) {
      console.warn(`Немає рядка telegram_posts для post_id=${postId}`);
      continue;
    }

    const permalink = `https://t.me/${TELEGRAM_CHANNEL.username}/${postId}`;
    const expanded = expandTelegramPostImages(post);
    const fresh = await fetchFreshPosterUrlsFromPublicPostPage(permalink);

    const expF = sortImageCandidates(
      post.rawHtml,
      expanded,
      filterRejectedAndBrand(expanded, brandKeys, isRejectedStoredTelegramImageUrl),
    );

    const mergedF = sortImageCandidates(
      post.rawHtml,
      expanded,
      filterRejectedAndBrand(
        [...expanded, ...fresh],
        brandKeys,
        isRejectedStoredTelegramImageUrl,
      ),
    );

    const useHtmlOnly =
      narrowTelegramPostImagesToSingleCover(expF).length > 0;
    const primary = useHtmlOnly ? expF : mergedF;

    const stored = narrowTelegramPostImagesToSingleCover(primary);
    console.log(
      `post_id ${postId} «${titleForLog.slice(0, 72)}»: у БД ${stored.length} URL (джерело: ${useHtmlOnly ? "HTML БД" : "HTML+t.me"}, кандидатів ${primary.length})`,
    );

    await updateTelegramPostImages(postId, primary);
    await pause(FETCH_GAP_MS);
  }

  console.log("Готово.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
