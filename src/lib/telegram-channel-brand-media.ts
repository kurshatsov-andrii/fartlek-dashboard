import {
  canonicalTelegramAssetUrlKey,
  extractOpenGraphImageUrlsFromHtml,
  finalizePosterImageUrls,
} from "@/lib/telegram-media-urls";

const CHANNEL_PAGE_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (compatible; FartlekEventsDashboard/1.4; +https://t.me/)",
  Accept: "text/html,application/xhtml+xml",
} as const;

function pushNormalizedKey(keys: Set<string>, raw: string | undefined | null) {
  const t = raw?.trim();
  if (!t) return;
  const fin = finalizePosterImageUrls([t]);
  const u = fin[0];
  if (!u) return;
  keys.add(canonicalTelegramAssetUrlKey(u));
}

/**
 * Зображення бренду каналу на `t.me/{slug}` (аватар у шапці, og:image).
 * Не зберігаємо їх у `telegram_posts.images`, щоб не «підміняти» афішу події логотипом каналу.
 */
export async function fetchTelegramChannelBrandImageUrlKeys(
  channelSlug: string,
): Promise<Set<string>> {
  const keys = new Set<string>();

  try {
    const res = await fetch(`https://t.me/${channelSlug}`, {
      headers: CHANNEL_PAGE_HEADERS,
      cache: "no-store",
      redirect: "follow",
    });
    if (!res.ok) return keys;
    const html = await res.text();

    for (const mm of html.matchAll(
      /class=["'][^"']*tgme_page_photo_image[^"']*["'][^>]*\bsrc=["']([^"']+)/gi,
    )) {
      pushNormalizedKey(keys, mm[1]);
    }

    for (const mm of html.matchAll(
      /<img\b[^>]*class=["'][^"']*tgme_page_photo_image[^"']*["'][^>]*>/gi,
    )) {
      const src = /\bsrc=["']([^"']+)/i.exec(mm[0]);
      pushNormalizedKey(keys, src?.[1]);
    }

    for (const mm of html.matchAll(
      /tgme_page_photo\b[\s\S]{0,1800}?background-image:\s*url\(\s*['"]?([^'")]+)/gi,
    )) {
      pushNormalizedKey(keys, mm[1]);
    }

    for (const u of extractOpenGraphImageUrlsFromHtml(html)) {
      pushNormalizedKey(keys, u);
    }
  } catch {
    /* ignore */
  }

  return keys;
}
