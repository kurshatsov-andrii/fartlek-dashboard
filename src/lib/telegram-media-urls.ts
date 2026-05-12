/**
 * Нормалізація та добір посилань на зображення з дописів Telegram
 * (включно з telegraph.controller.bot/file/… у тексті, не лише з HTML-бульбашки).
 */

import type { TelegramPost } from "@/types";
import { TG_TEXT_URL_REGEX } from "@/services/telegram/parser";
import { EVENT_COVER_FALLBACK } from "@/lib/event-image";

export function normalizeTelegramAssetUrl(raw: string): string | null {
  const t = raw.trim().replace(/^\/\//, "https://");
  if (!t.startsWith("http")) return null;
  try {
    const url = new URL(t);
    if (
      url.hostname === "telegraph.controller.bot" &&
      url.protocol === "http:"
    ) {
      url.protocol = "https:";
      return url.toString();
    }
    return url.toString();
  } catch {
    return null;
  }
}

/** Пряме посилання на картинку / CDN-прев’ю допису (не сторінка telegra.ph). */
export function isDirectTelegramImageUrl(httpsUrl: string): boolean {
  try {
    const u = new URL(httpsUrl);
    const h = u.hostname.toLowerCase();
    if (h === "telegraph.controller.bot") return /\/file\//i.test(u.pathname);
    if (/\.telesco\.pe$/i.test(h) || /\.cdn-telegram\.org$/i.test(h))
      return true;
    return /\.(jpe?g|png|gif|webp|avif)(\?|#|$)/i.test(u.pathname);
  } catch {
    return false;
  }
}

/**
 * CDN та файли із превʼю t.me для конкретного повідомлення (не telegra.ph статті без /file/).
 */
export function acceptsParserExtractedMediaUrl(httpsUrl: string): boolean {
  try {
    const u = new URL(httpsUrl);
    const h = u.hostname.toLowerCase();
    if (/\.telesco\.pe$/i.test(h) || /\.cdn-telegram\.org$/i.test(h)) return true;
    if (h === "telegraph.controller.bot")
      return /\/file\//i.test(u.pathname);
    return /\.(jpe?g|png|gif|webp|avif)(\?|#|$)/i.test(u.pathname);
  } catch {
    return false;
  }
}

function shouldExcludeDecorEmojiUrl(urlNorm: string): boolean {
  try {
    const x = new URL(urlNorm);
    const p = x.pathname.toLowerCase();
    const h = x.hostname.toLowerCase();
    if (
      /emoji|emojiset|stickerset|\/stickers?\/|sticker-|effects|premium|gift|reactions\/|video_note|webp_sticker|tgs\b/i.test(
        p + x.search,
      )
    )
      return true;

    /** Прапорець / смайловий asset часто має набагато коротший slug після `/file/` ніж постер-медіа афіш */
    const fileMatch = /\/file\/([^/?#]+)/i.exec(urlNorm);
    const slugRaw = fileMatch?.[1] ?? "";
    const slugCore = slugRaw.replace(/\.(jpe?g|webp|png|gif|avif)$/i, "");

    const cdnMess =
      /\.telesco\.pe$/i.test(h) || /\.cdn-telegram\.org$/i.test(h);
    if (cdnMess && slugCore.length <= 72 && urlNorm.length < 260) return true;

    /** Дуже короткі webp/png на CDN — рідко афішне фото поста */
    if (cdnMess && urlNorm.length < 170 && /\.(webp|png)$/i.test(p))
      return true;
  } catch {
    return true;
  }
  return false;
}

const CDN4_TELESCO_HOST = "cdn4.telesco.pe";

function isCdn4TelescopeImageUrl(httpsUrl: string): boolean {
  try {
    return new URL(httpsUrl).hostname.toLowerCase() === CDN4_TELESCO_HOST;
  } catch {
    return false;
  }
}

/** Для обкладинки: серед `cdn4.telesco.pe` — другий за порядком, інакше перший повноцінний URL з того ж списку. */
function pickCoverUrlFromPosterList(list: readonly string[]): string | undefined {
  const cdn4 = list.filter(isCdn4TelescopeImageUrl);
  if (cdn4.length >= 2) return cdn4[1];
  if (cdn4.length === 1) return cdn4[0];
  return list[1] ?? list[0];
}

/**
 * Dedup, перевірки, прибирання службового/emoji-asset; зберігає порядок вхідних URL
 * (друге посилання в рядку `images` лишається другим після фільтрації).
 */
export function finalizePosterImageUrls(urls: readonly string[]): string[] {
  const seen = new Set<string>();
  const normOk: string[] = [];
  for (const raw of urls) {
    const n =
      normalizeTelegramAssetUrl(raw.trim()) ??
      (raw.trim().startsWith("http") ? raw.trim() : null);
    if (!n || seen.has(n)) continue;
    if (!acceptsParserExtractedMediaUrl(n)) continue;
    seen.add(n);
    normOk.push(n);
  }

  const filtered = normOk.filter((u) => !shouldExcludeDecorEmojiUrl(u));
  const pool = filtered.length > 0 ? filtered : normOk;

  return pool.slice(0, 24);
}

/** Усі прямі image-URL із плоского тексту допису. */
export function extractImageUrlsFromPlainText(text: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  TG_TEXT_URL_REGEX.lastIndex = 0;
  for (const m of text.matchAll(TG_TEXT_URL_REGEX)) {
    const n = normalizeTelegramAssetUrl(m[0]);
    if (!n || seen.has(n)) continue;
    if (!isDirectTelegramImageUrl(n)) continue;
    seen.add(n);
    out.push(n);
  }
  return out;
}

/**
 * Telegraph file-посилання в будь-якій частині HTML фрагмента допису
 * (прев’ю-посилання, lazy attr).
 */
export function extractTelegraphFileUrlsFromHtml(html: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const mm of html.matchAll(
    /https?:\/\/telegraph\.controller\.bot\/file\/[^\s"'>)]+/gi,
  )) {
    const n = normalizeTelegramAssetUrl(mm[0]);
    if (!n || seen.has(n)) continue;
    seen.add(n);
    out.push(n);
  }
  for (const mm of html.matchAll(
    /(?:data-src|data-original|src)\s*=\s*["']([^"']*telegraph\.controller\.bot[^"']*)["']/gi,
  )) {
    const n = normalizeTelegramAssetUrl(mm[1].trim());
    if (!n || seen.has(n)) continue;
    if (!/\/file\//i.test(n)) continue;
    seen.add(n);
    out.push(n);
  }
  return out;
}

/**
 * Об'єднує впорядкований список із бульбашки + telegraph із HTML + текст допису.
 */
export function mergeTelegramPostImageSources(
  bubbleOrdered: string[],
  fullMessageHtml: string,
  plainText: string,
): string[] {
  const sweep = extractTelegraphFileUrlsFromHtml(fullMessageHtml);
  const fromText = extractImageUrlsFromPlainText(plainText);
  const seen = new Set<string>();
  const merged: string[] = [];
  for (const bucket of [bubbleOrdered, sweep, fromText]) {
    for (const raw of bucket) {
      const n =
        normalizeTelegramAssetUrl(raw) ??
        (raw.startsWith("http") ? raw.trim() : null);
      if (!n || seen.has(n)) continue;
      if (!acceptsParserExtractedMediaUrl(n)) continue;
      seen.add(n);
      merged.push(n);
    }
  }
  return finalizePosterImageUrls(merged);
}

/** Повний список кандидатів для запису чи відображення. */
export function expandTelegramPostImages(post: TelegramPost): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const add = (raw: string) => {
    const n = normalizeTelegramAssetUrl(raw.trim());
    if (!n || seen.has(n)) return;
    if (!acceptsParserExtractedMediaUrl(n)) return;
    seen.add(n);
    out.push(n);
  };
  for (const u of post.images) add(u);
  for (const l of post.links ?? []) add(l);
  TG_TEXT_URL_REGEX.lastIndex = 0;
  for (const u of extractImageUrlsFromPlainText(post.text)) {
    if (!seen.has(u)) {
      seen.add(u);
      out.push(u);
    }
  }
  return finalizePosterImageUrls(out);
}

export function pickTelegramPostCoverUrl(post: TelegramPost): string {
  const rowUrls = finalizePosterImageUrls(post.images);
  const fromRow = pickCoverUrlFromPosterList(rowUrls);
  if (fromRow !== undefined) return fromRow;

  const list = expandTelegramPostImages(post);
  return (
    pickCoverUrlFromPosterList(list) ??
    EVENT_COVER_FALLBACK
  );
}
