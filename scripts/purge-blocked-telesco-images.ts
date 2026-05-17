/**
 * Знаходить рядки, де JSON `images` містить заблокований URL превʼю (див. `event-image.ts`),
 * і перезаписує превʼю з Telegram (HTML у БД → потім сторінка поста).
 *
 * Якщо скан не знаходить збігів (інший формат JSON у вашій БД), можна примусово вказати post_id:
 *
 * PURGE_BLOCKED_FORCE_POST_IDS=1971,1980,1981 npm run purge:blocked-telesco-images
 *
 * npm run purge:blocked-telesco-images
 */

import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local") });

const TABLE = "telegram_posts";

const FETCH_GAP_MS = Math.max(
  0,
  Number.parseInt(process.env.PURGE_BLOCKED_GAP_MS ?? "340", 10) || 340,
);

async function pause(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

function normalizeImagesColumn(raw: unknown): string[] {
  if (Array.isArray(raw))
    return raw.filter((x): x is string => typeof x === "string");
  if (typeof raw === "string") {
    try {
      const p = JSON.parse(raw) as unknown;
      return Array.isArray(p)
        ? p.filter((x): x is string => typeof x === "string")
        : [];
    } catch {
      return [];
    }
  }
  return [];
}

function rowTouchesBlockedPreview(
  imagesRaw: unknown,
  slugSnippetLower: string,
  isRejected: (u: string) => boolean,
): boolean {
  const imgs = normalizeImagesColumn(imagesRaw);
  if (
    imgs.some(
      (u) =>
        typeof u === "string" &&
        u.trim().length > 0 &&
        isRejected(u),
    )
  ) {
    return true;
  }
  const blob =
    typeof imagesRaw === "string"
      ? imagesRaw
      : JSON.stringify(imagesRaw ?? []);
  return blob.toLowerCase().includes(slugSnippetLower);
}

async function main() {
  const { isSupabaseConfigured, getSupabaseAdmin } = await import(
    "@/lib/supabase/server"
  );
  if (!isSupabaseConfigured()) {
    console.error("Потрібні NEXT_PUBLIC_SUPABASE_URL та SUPABASE_SERVICE_ROLE_KEY у .env.local");
    process.exit(1);
  }

  const {
    BLOCKED_TELESCO_POSTER_SLUG_SNIPPET_LOWER,
    isRejectedStoredTelegramImageUrl,
  } = await import("@/lib/event-image");

  const slugSnippetLower = BLOCKED_TELESCO_POSTER_SLUG_SNIPPET_LOWER.toLowerCase();

  const {
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
  const { TELEGRAM_CHANNEL } = await import("@/services/telegram/parser");

  const supabase = getSupabaseAdmin();
  const affectedIds = new Set<number>();

  const forcedRaw = process.env.PURGE_BLOCKED_FORCE_POST_IDS?.trim();
  if (forcedRaw) {
    for (const part of forcedRaw.split(/[,;\s]+/)) {
      const n = Number(part.trim());
      if (Number.isFinite(n)) affectedIds.add(n);
    }
    if (affectedIds.size > 0) {
      console.log(
        "Примусово до перезапису превʼю (PURGE_BLOCKED_FORCE_POST_IDS):",
        [...affectedIds].sort((a, b) => a - b).join(", "),
      );
    }
  }

  const chunk = 400;
  let from = 0;
  for (;;) {
    const { data, error } = await supabase
      .from(TABLE)
      .select("post_id,images")
      .order("post_id", { ascending: true })
      .range(from, from + chunk - 1);
    if (error) throw error;
    const rows = data ?? [];
    if (rows.length === 0) break;

    for (const r of rows as { post_id: number; images: unknown }[]) {
      if (
        rowTouchesBlockedPreview(
          r.images,
          slugSnippetLower,
          isRejectedStoredTelegramImageUrl,
        )
      ) {
        affectedIds.add(Number(r.post_id));
      }
    }

    if (rows.length < chunk) break;
    from += chunk;
  }

  console.log("Усього дописів до перезапису превʼю:", affectedIds.size);
  if (affectedIds.size === 0) {
    console.log("Нічого оновлювати.");
    return;
  }
  const posts = (await listTelegramPostsFromDb()).filter((p) =>
    affectedIds.has(p.postId),
  );

  const brandKeys = await fetchTelegramChannelBrandImageUrlKeys(
    TELEGRAM_CHANNEL.username,
  );

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

  function filterRejectedAndBrand(urls: readonly string[]): string[] {
    return finalizePosterImageUrls(
      urls.filter(
        (u) =>
          typeof u === "string" &&
          !isRejectedStoredTelegramImageUrl(u) &&
          !brandKeys.has(canonicalTelegramAssetUrlKey(u)),
      ),
    );
  }

  let ok = 0;
  let empty = 0;

  for (const post of posts) {
    const permalink = `https://t.me/${post.channelId}/${post.postId}`;
    const expanded = expandTelegramPostImages(post);
    const fresh = await fetchFreshPosterUrlsFromPublicPostPage(permalink);

    const expF = sortImageCandidates(
      post.rawHtml,
      expanded,
      filterRejectedAndBrand(expanded),
    );

    const mergedF = sortImageCandidates(
      post.rawHtml,
      expanded,
      filterRejectedAndBrand([...expanded, ...fresh]),
    );

    const primary =
      narrowTelegramPostImagesToSingleCover(expF).length > 0 ? expF : mergedF;

    const stored = narrowTelegramPostImagesToSingleCover(primary);
    if (stored.length > 0) ok += 1;
    else empty += 1;

    await updateTelegramPostImages(post.postId, primary);
    console.log(
      `post_id ${post.postId}: нове превʼю ${stored.length} URL (кандидатів ${primary.length})`,
    );

    await pause(FETCH_GAP_MS);
  }

  console.log("");
  console.log("Готово. З превʼю:", ok, "| порожньо:", empty);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
