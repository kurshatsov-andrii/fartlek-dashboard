/**
 * Нормалізація та добір посилань на зображення з дописів Telegram
 * (включно з telegraph.controller.bot/file/… у тексті, не лише з HTML-бульбашки).
 */

import type { TelegramPost } from "@/types";
import { TG_TEXT_URL_REGEX } from "@/services/telegram/parser";
import {
  EVENT_COVER_FALLBACK,
  isRejectedStoredTelegramImageUrl,
} from "@/lib/event-image";
import { isTelegramCdnHostname } from "@/lib/telegram-cdn-hostname";

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

/** Однаковий файл на CDN при порівнянні (dedupe / анти-«одне фото на всі пости»). */
export function canonicalTelegramAssetUrlKey(raw: string): string {
  try {
    const u = new URL(raw.trim());
    u.hash = "";
    return u.href;
  } catch {
    return raw.trim();
  }
}

/** Пряме посилання на картинку / CDN-прев’ю допису (не сторінка telegra.ph). */
export function isDirectTelegramImageUrl(httpsUrl: string): boolean {
  try {
    const u = new URL(httpsUrl);
    const h = u.hostname.toLowerCase();
    if (h === "telegraph.controller.bot") return /\/file\//i.test(u.pathname);
    if (isTelegramCdnHostname(h)) return true;
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
    if (isTelegramCdnHostname(h)) return true;
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

    const cdnMess = isTelegramCdnHostname(h);
    if (cdnMess && slugCore.length <= 72 && urlNorm.length < 260) return true;

    /** Дуже короткі webp/png на CDN — рідко афішне фото поста */
    if (cdnMess && urlNorm.length < 170 && /\.(webp|png)$/i.test(p))
      return true;
  } catch {
    return true;
  }
  return false;
}

function isTelegramCdnPosterHost(hostname: string): boolean {
  return isTelegramCdnHostname(hostname);
}

/**
 * Обкладинка серед CDN-превʼю Telegram.
 * Списки зазвичай упорядковані так, що основне фото допису йде першим (`photo_wrap`).
 * Раніше брали лише «найдовший» URL — службові й дрібні асети могли бути довшими за справжню афішу.
 */
function pickCoverUrlFromPosterList(list: readonly string[]): string | undefined {
  if (list.length === 0) return undefined;

  try {
    const telegramCdns = list.filter((u) => {
      try {
        return isTelegramCdnPosterHost(new URL(u).hostname);
      } catch {
        return false;
      }
    });
    const pool = telegramCdns.length > 0 ? telegramCdns : [...list];

    for (const u of pool) {
      if (!shouldExcludeDecorEmojiUrl(u)) return u;
    }
    return [...pool].sort((a, b) => b.length - a.length)[0];
  } catch {
    return list[0];
  }
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
    if (isRejectedStoredTelegramImageUrl(n)) continue;
    seen.add(n);
    normOk.push(n);
  }

  const filtered = normOk.filter((u) => !shouldExcludeDecorEmojiUrl(u));
  const pool = filtered.length > 0 ? filtered : normOk;

  return pool.slice(0, 24);
}

/**
 * Колонка БД `telegram_posts.images` — рівно один URL обкладинки допису
 * (найкращий кадр за тією ж логікою, що й картка події).
 */
export function narrowTelegramPostImagesToSingleCover(
  urls: readonly string[],
): string[] {
  const finalized = finalizePosterImageUrls(urls);
  const cover = pickCoverUrlFromPosterList(finalized);
  return cover ? [cover] : [];
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
 * CDN Telegram / Telegraph із збереженого HTML допису (t.me превʼю), коли в `images`
 * у БД лишились старі або порожні URL — те саме покриття, що в html-preview-parser.
 */
export function extractTelegramCdnUrlsFromHtml(html: string): string[] {
  if (!html?.trim()) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (raw: string) => {
    const t = raw.trim();
    if (!t) return;
    const patched = t.replace(/^\/\//, "https:");
    const n =
      normalizeTelegramAssetUrl(patched) ??
      (patched.startsWith("http") ? patched : null);
    if (!n || seen.has(n)) return;
    if (!acceptsParserExtractedMediaUrl(n)) return;
    seen.add(n);
    out.push(n);
  };

  for (const mm of html.matchAll(
    /background-image:\s*url\(\s*['"]?([^'")]+?)['"]?\s*\)/gi,
  )) {
    push(mm[1]);
  }
  for (const mm of html.matchAll(
    /(?:data-src|data-original|src)\s*=\s*["']([^"']+)["']/gi,
  )) {
    const v = mm[1].trim();
    if (/cdn\d*\.telesco\.pe/i.test(v)) push(v.replace(/^\/\//, "https:"));
    if (/cdn\d*\.cdn-telegram\.org/i.test(v))
      push(v.replace(/^\/\//, "https:"));
    if (/cdn\d*\.telegram-cdn\.org/i.test(v))
      push(v.replace(/^\/\//, "https:"));
    if (/cdn\.telegram\.org\b/i.test(v))
      push(v.replace(/^\/\//, "https:"));
    if (v.includes("telegraph.controller.bot") && /\/file\//i.test(v))
      push(v.startsWith("//") ? `https:${v}` : v);
  }
  for (const mm of html.matchAll(/(?:href|src)=["']([^"']+)["']/g)) {
    const v = mm[1];
    if (/cdn\d*\.telesco\.pe/i.test(v)) push(v.replace(/^\/\//, "https:"));
    if (/cdn\d*\.cdn-telegram\.org/i.test(v))
      push(v.replace(/^\/\//, "https:"));
    if (/cdn\d*\.telegram-cdn\.org/i.test(v))
      push(v.replace(/^\/\//, "https:"));
    if (/cdn\.telegram\.org\b/i.test(v))
      push(v.replace(/^\/\//, "https:"));
    if (v.includes("telegraph.controller.bot"))
      push(v.startsWith("//") ? `https:${v}` : v);
  }
  for (const mm of html.matchAll(
    /https?:\/\/cdn\d*\.cdn-telegram\.org\/[^\s"'>)]+/gi,
  )) {
    push(mm[0]);
  }
  for (const mm of html.matchAll(
    /https?:\/\/cdn\d*\.telegram-cdn\.org\/[^\s"'>)]+/gi,
  )) {
    push(mm[0]);
  }
  for (const mm of html.matchAll(
    /https?:\/\/cdn\d+\.telesco\.pe\/[^\s"'>)]+/gi,
  )) {
    push(mm[0]);
  }
  for (const mm of html.matchAll(
    /https?:\/\/cdn\.telegram\.org\/[^\s"'>)]+/gi,
  )) {
    push(mm[0]);
  }
  for (const mm of html.matchAll(
    /https?:\/\/telegraph\.controller\.bot[^\s"'>)]+/gi,
  )) {
    push(mm[0]);
  }
  for (const mm of html.matchAll(/\bsrc[Ss]et\s*=\s*["']([^"']+)["']/gi)) {
    for (const part of mm[1].split(",")) {
      const u = part.trim().replace(/\s+\d+[.]\d+x$/i, "").trim();
      if (u.startsWith("http")) push(u);
    }
  }
  return out;
}

/**
 * Telegram-картки та окремі сторінки постів часто мають повний URL превʼю лише в метаданих,
 * тоді як фрагмент у стрічці `/s/…` його не містить.
 */
export function extractOpenGraphImageUrlsFromHtml(html: string): string[] {
  if (!html?.trim()) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (raw: string) => {
    const t = raw.trim();
    if (!t) return;
    const patched = t.startsWith("//") ? `https:${t}` : t;
    const n =
      normalizeTelegramAssetUrl(patched) ??
      (patched.startsWith("http") ? patched.trim() : null);
    if (!n || seen.has(n)) return;
    if (!acceptsParserExtractedMediaUrl(n)) return;
    seen.add(n);
    out.push(n);
  };

  for (const mm of html.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = mm[0];
    const isOg =
      /\bproperty\s*=\s*["'](?:og:image|og:image:url|og:image:secure_url)["']/i.test(
        tag,
      );
    const isTw = /\bname\s*=\s*["']twitter:image(?::src)?["']/i.test(tag);
    if (!isOg && !isTw) continue;
    const q =
      /\bcontent\s*=\s*["']([^"']*)["']/i.exec(tag)?.[1] ??
      /\bcontent\s*=\s*([^\s>]+)/i.exec(tag)?.[1];
    if (q?.trim()) push(q);
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
  const sweep = [
    ...extractTelegraphFileUrlsFromHtml(fullMessageHtml),
    ...extractTelegramCdnUrlsFromHtml(fullMessageHtml),
    /** Останнім: часто це аватарка/обкладинка каналу, а не афіша конкретного допису */
    ...extractOpenGraphImageUrlsFromHtml(fullMessageHtml),
  ];
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
  const merged = mergeTelegramPostImageSources(
    post.images,
    post.rawHtml ?? "",
    post.text,
  );
  const seen = new Set(merged);
  const withLinks = [...merged];
  for (const l of post.links ?? []) {
    const n =
      normalizeTelegramAssetUrl(l.trim()) ??
      (l.trim().startsWith("http") ? l.trim() : null);
    if (!n || seen.has(n)) continue;
    if (!acceptsParserExtractedMediaUrl(n)) continue;
    seen.add(n);
    withLinks.push(n);
  }
  return finalizePosterImageUrls(withLinks);
}

/** Упорядковані кандидати обкладинки (основний + запасні для картки при помилці завантаження). */
export function telegramPostCoverCandidates(post: TelegramPost): string[] {
  const row = finalizePosterImageUrls(post.images);
  const expanded = expandTelegramPostImages(post);
  const seen = new Set<string>();
  const ordered: string[] = [];
  /** Спочатку розширений список (HTML + текст), потім лише колонка БД — щоб актуальні URL з превʼю не програвали застарілім `images`. */
  for (const u of [...expanded, ...row]) {
    if (seen.has(u)) continue;
    seen.add(u);
    ordered.push(u);
  }
  if (ordered.length === 0) return [EVENT_COVER_FALLBACK];

  /** Завжди з повного merged-списку; інакше при непустому `images` ігнорувались би додаткові кадри з `raw_html`. */
  const primary = pickCoverUrlFromPosterList(ordered);
  if (!primary) return [EVENT_COVER_FALLBACK];

  const rest = ordered.filter((u) => u !== primary);
  return [primary, ...rest].slice(0, 12);
}

export function pickTelegramPostCoverUrl(post: TelegramPost): string {
  const c = telegramPostCoverCandidates(post);
  return c[0] ?? EVENT_COVER_FALLBACK;
}
