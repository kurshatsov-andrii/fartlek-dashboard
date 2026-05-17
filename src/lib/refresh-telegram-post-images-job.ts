import { listTelegramPostsFromDb, updateTelegramPostImages } from "@/lib/telegram-db";
import {
  canonicalTelegramAssetUrlKey,
  expandTelegramPostImages,
  finalizePosterImageUrls,
} from "@/lib/telegram-media-urls";
import { fetchFreshPosterUrlsFromPublicPostPage } from "@/lib/telegram-tm-post-media";
import { fetchTelegramChannelBrandImageUrlKeys } from "@/lib/telegram-channel-brand-media";
import { isRejectedStoredTelegramImageUrl } from "@/lib/event-image";
import { TELEGRAM_CHANNEL } from "@/services/telegram/parser";

export type RefreshTelegramPostImagesStats = {
  postsCount: number;
  emptyFinal: number;
  dominantKeysCount: number;
  brandKeysCount: number;
  thresholdAll: number;
  thresholdAmongNonEmpty: number | typeof Infinity;
  nonEmptyPostCount: number;
  skipPublic: boolean;
  mergeLegacy: boolean;
};

function pause(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

function envGapMs(): number {
  return Math.max(
    0,
    Number.parseInt(process.env.REFRESH_POST_IMAGES_GAP_MS ?? "320", 10) || 320,
  );
}

function envSkipPublic(): boolean {
  return (
    process.env.REFRESH_POST_IMAGES_SKIP_PUBLIC === "1" ||
    /\btrue\b/i.test(process.env.REFRESH_POST_IMAGES_SKIP_PUBLIC ?? "")
  );
}

function envMergeLegacy(): boolean {
  return (
    process.env.REFRESH_POST_IMAGES_MERGE_LEGACY === "1" ||
    /\btrue\b/i.test(process.env.REFRESH_POST_IMAGES_MERGE_LEGACY ?? "")
  );
}

function envDominantRatio(): number {
  const dominantParsed = Number.parseFloat(
    process.env.REFRESH_DOMINANT_IMAGE_RATIO ?? "0.42",
  );
  return Math.min(
    0.95,
    Math.max(0.05, Number.isFinite(dominantParsed) ? dominantParsed : 0.42),
  );
}

/**
 * Перезаписує `telegram_posts.images` свіжими URL з публічних сторінок постів (або лише з HTML у БД — див. env).
 * Використовується cron та скрипт `refresh:post-images`.
 */
export async function runRefreshTelegramPostImagesJob(): Promise<RefreshTelegramPostImagesStats> {
  const FETCH_GAP_MS = envGapMs();
  const skipPublic = envSkipPublic();
  const mergeLegacy = envMergeLegacy();
  const dominantRatio = envDominantRatio();

  const posts = await listTelegramPostsFromDb();

  const brandKeys = skipPublic
    ? new Set<string>()
    : await fetchTelegramChannelBrandImageUrlKeys(TELEGRAM_CHANNEL.username);

  const byPostId = new Map<number, string[]>();

  for (let i = 0; i < posts.length; i++) {
    const p = posts[i]!;
    let next: string[];

    if (skipPublic) {
      next = expandTelegramPostImages({ ...p, images: [] });
    } else {
      const permalink = `https://t.me/${TELEGRAM_CHANNEL.username}/${p.postId}`;
      next = await fetchFreshPosterUrlsFromPublicPostPage(permalink);
      if (mergeLegacy) {
        const fromDbHtml = expandTelegramPostImages({ ...p, images: [] });
        next = finalizePosterImageUrls([...next, ...fromDbHtml]);
      }
      await pause(FETCH_GAP_MS);
    }

    next = finalizePosterImageUrls(
      next.filter(
        (u) =>
          typeof u === "string" &&
          !isRejectedStoredTelegramImageUrl(u) &&
          !brandKeys.has(canonicalTelegramAssetUrlKey(u)),
      ),
    );

    byPostId.set(p.postId, next);

    if (i < 8) {
      console.log(
        `[refresh-post-images] post_id ${p.postId}: зібрано ${next.length} зображ. (у БД було ${p.images?.length ?? 0})`,
      );
    }
  }

  const freq = new Map<string, number>();
  if (posts.length > 0) {
    for (const urls of byPostId.values()) {
      const uniqKeys = new Set(
        urls.map((u) => canonicalTelegramAssetUrlKey(u)),
      );
      for (const k of uniqKeys) {
        freq.set(k, (freq.get(k) ?? 0) + 1);
      }
    }
  }

  const urlsEntries = [...byPostId.entries()].filter(([, urls]) => urls.length > 0);
  const nonEmptyPostCount = urlsEntries.length;

  const freqAmongNonEmpty = new Map<string, number>();
  for (const [, urls] of urlsEntries) {
    const uniqKeys = new Set(urls.map((u) => canonicalTelegramAssetUrlKey(u)));
    for (const k of uniqKeys) {
      freqAmongNonEmpty.set(k, (freqAmongNonEmpty.get(k) ?? 0) + 1);
    }
  }

  const dominantKeys = new Set<string>();
  const thresholdAll = Math.max(2, Math.ceil(posts.length * dominantRatio));
  const thresholdAmongNonEmpty =
    nonEmptyPostCount >= 4
      ? Math.max(3, Math.ceil(nonEmptyPostCount * dominantRatio))
      : Infinity;

  if (posts.length >= 5) {
    for (const [k, c] of freq) {
      if (c >= thresholdAll) dominantKeys.add(k);
    }
  }

  if (Number.isFinite(thresholdAmongNonEmpty)) {
    for (const [k, c] of freqAmongNonEmpty) {
      if (c >= thresholdAmongNonEmpty) dominantKeys.add(k);
    }
  }

  let emptyFinal = 0;
  for (const p of posts) {
    let next = byPostId.get(p.postId) ?? [];
    next = finalizePosterImageUrls(
      next.filter((u) => !dominantKeys.has(canonicalTelegramAssetUrlKey(u))),
    );
    if (next.length === 0) emptyFinal += 1;
    await updateTelegramPostImages(p.postId, next);
  }

  console.log("");
  console.log("[refresh-post-images] Рядків у БД:", posts.length);
  console.log(
    "[refresh-post-images] Джерело:",
    skipPublic
      ? "лише HTML у БД"
      : mergeLegacy
        ? "Telegram + мердж HTML БД"
        : "лише Telegram-сторінка поста",
  );
  console.log("[refresh-post-images] Брендових URL каналу виключено:", brandKeys.size);
  console.log(
    "[refresh-post-images] Глобально виключених CDN-ключів:",
    dominantKeys.size,
  );
  console.log("[refresh-post-images] Без URL після фільтрів:", emptyFinal);

  return {
    postsCount: posts.length,
    emptyFinal,
    dominantKeysCount: dominantKeys.size,
    brandKeysCount: brandKeys.size,
    thresholdAll,
    thresholdAmongNonEmpty,
    nonEmptyPostCount,
    skipPublic,
    mergeLegacy,
  };
}
