import type { TelegramPost } from "@/types";
import {
  normalizeTelegramAssetUrl,
  mergeTelegramPostImageSources,
} from "@/lib/telegram-media-urls";

import { TELEGRAM_CHANNEL, TG_TEXT_URL_REGEX } from "./parser";

const CHANNEL_SLUG = TELEGRAM_CHANNEL.username;

function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, code) =>
      String.fromCodePoint(Number.parseInt(code, 10)),
    )
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
      String.fromCodePoint(Number.parseInt(hex, 16)),
    )
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ");
}

function htmlToTelegramPlainText(innerHtml: string): string {
  let s = innerHtml
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div)>/gi, "\n")
    .replace(/\s*&nbsp;\s*/gi, " ");
  s = s.replace(/<a[^>]*href=["']([^"']+)["'][^>]*>[\s\S]*?<\/a>/gi, " $1 ");
  s = s.replace(/<[^>]+>/g, "");
  s = decodeEntities(s).replace(/\n{3,}/g, "\n\n").trim();
  return s;
}

/** t.me previews use 9.81K-style counts */
function parseMetricCount(raw: string): number {
  const t = raw.replace(/\u00a0|\s+/g, "").trim();
  const m = /^([\d.,]+)([KMkm]?)$/.exec(t);
  if (!m) {
    const n = Number.parseInt(t.replace(/\D/g, ""), 10);
    return Number.isFinite(n) ? n : 0;
  }
  const base = Number.parseFloat(m[1].replace(",", "."));
  const suf = m[2].toUpperCase();
  if (!Number.isFinite(base)) return 0;
  if (suf === "K") return Math.round(base * 1000);
  if (suf === "M") return Math.round(base * 1_000_000);
  return Math.round(base);
}

function extractMessagePlainText(htmlBlock: string): string {
  const ti = htmlBlock.indexOf("tgme_widget_message_text");
  if (ti === -1) return "";
  const di = htmlBlock.indexOf('dir="auto">', ti);
  if (di === -1) return "";
  const start = di + 'dir="auto">'.length;
  const markers = [
    '<div class="tgme_widget_message_photo_wrap"',
    '<div class="tgme_widget_message_video"',
    'tgme_widget_message_footer compact',
    'tgme_widget_message_reactions js-message_reactions"',
  ];
  let end = htmlBlock.length;
  for (const k of markers) {
    const j = htmlBlock.indexOf(k, start);
    if (j !== -1 && j < end) end = j;
  }
  return htmlToTelegramPlainText(htmlBlock.slice(start, end));
}

function extractReactionsHtml(htmlBlock: string): string {
  const m = htmlBlock.match(
    /<div class="[^"]*\btgme_widget_message_reactions\b[^"]*"[^>]*>([\s\S]*?)<\/div>/,
  );
  return m?.[1] ?? "";
}

/**
 * Сума чисел у всіх видимих реакціях допису в превʼю t.me/s/…
 * (іконка + лічильник для кожної реакції — не лише ❤).
 */
function parseTotalReactionsCount(reactionsInner: string): number {
  if (!reactionsInner) return 0;
  const spans = [
    ...reactionsInner.matchAll(
      /<span class="[^"]*\btgme_reaction\b[^"]*">([\s\S]*?)<\/span>/g,
    ),
  ];
  let total = 0;
  for (const [, inner] of spans) {
    const n = parseReactionSpanCount(inner);
    if (n > 0) total += n;
  }
  return total;
}

/** Один рядок реакції в HTML превʼю Telegram. */
function parseReactionSpanCount(inner: string): number {
  const mCounter =
    /class=["'][^"']*\btgme_reaction_count(?:er)?\b[^"']*["'][^>]*>([^<]+)<\//i.exec(
      inner,
    );
  if (mCounter) return parseMetricCount(mCounter[1]);

  const mAfterI = /<\/i>\s*([\d.,]+\s*[KMkm]?)/i.exec(inner);
  if (mAfterI) return parseMetricCount(mAfterI[1]);

  const mParen = /\(\s*([\d.,]+\s*[KMkm]?)\s*\)/i.exec(inner);
  if (mParen) return parseMetricCount(mParen[1]);

  const tailNum = /(\d[\d.,]*\s*[KMkm]?)\s*<\/span>\s*$/i.exec(
    inner.trim(),
  );
  if (tailNum) return parseMetricCount(tailNum[1]);

  const plain = inner.replace(/<[^>]+>/g, " ");
  const chunks = plain.match(/\d[\d.,]*\s*[KMkm]?/gi);
  if (chunks?.length) return parseMetricCount(chunks[chunks.length - 1]!);

  return 0;
}

function extractViews(htmlBlock: string): number {
  const m = /<span class="tgme_widget_message_views">([^<]*)<\/span>/.exec(
    htmlBlock,
  );
  if (!m) return 0;
  return parseMetricCount(m[1]);
}

/** Малі аватари ліворуч (не основне превʼю альбомного допису). */
function scrubMiniUserAvatars(html: string): string {
  let s = html;
  /** Класові варіації профільного кола поруч із іменем каналу / автора */
  s = s.replace(
    /<i[^>]+\b(?:tgme_widget_message_user_photo|tgme_widget_message_sender_photo)[^>]*>[\s\S]*?<\/i>/gi,
    "",
  );
  s = s.replace(
    /<a[^>]+\btgme_widget_message_from_photo\b[^>]*>[\s\S]*?<\/a>/gi,
    "",
  );
  return s;
}

/**
 * Превʼю зображень у дописі: скануємо ВЕСЬ фрагмент повідомлення.
 * Частину з `tgme_widget_message_photo_wrap` Telegram ставить ДО текстової «бульбашки»
 * — вирізання лише тексту після `tgme_widget_message_bubble` ховало основне фото.
 */
function extractOrderedMessageMedia(htmlBlock: string): string[] {
  const scope = scrubMiniUserAvatars(htmlBlock);
  const urls: string[] = [];
  const seen = new Set<string>();
  const push = (raw: string) => {
    const n = normalizeTelegramAssetUrl(raw.trim());
    if (!n || seen.has(n)) return;
    seen.add(n);
    urls.push(n);
  };
  for (const mm of scope.matchAll(
    /background-image:\s*url\(\s*['"]?([^'")]+?)['"]?\s*\)/gi,
  )) {
    push(mm[1]);
  }
  for (const mm of scope.matchAll(
    /(?:href|src)=["']([^"']+)["']/g,
  )) {
    const v = mm[1];
    if (/cdn\d*\.telesco\.pe/i.test(v))
      push(v.replace(/^\/\//, "https:"));
    if (/cdn\d*\.cdn-telegram\.org/i.test(v))
      push(v.replace(/^\/\//, "https:"));
    if (v.includes("telegraph.controller.bot"))
      push(v.startsWith("//") ? `https:${v}` : v);
  }
  for (const mm of scope.matchAll(
    /https?:\/\/cdn\d*\.cdn-telegram\.org\/[^\s"'>)]+/gi,
  )) {
    push(mm[0]);
  }
  for (const mm of scope.matchAll(
    /https?:\/\/cdn\d+\.telesco\.pe\/[^\s"'>)]+/gi,
  )) {
    push(mm[0]);
  }
  for (const mm of scope.matchAll(
    /https?:\/\/telegraph\.controller\.bot[^\s"'>)]+/gi,
  )) {
    push(mm[0]);
  }
  /** Частина превʼю — зображення в `srcset`. */
  for (const mm of scope.matchAll(
    /\bsrc[Ss]et\s*=\s*["']([^"']+)["']/gi,
  )) {
    for (const part of mm[1].split(",")) {
      const u = part.trim().replace(/\s+\d+[.]\d+x$/i, "").trim();
      if (u.startsWith("http")) push(u);
    }
  }
  return urls;
}
/**
 * Parses Telegram public channel wall HTML (`/s/{slug}` → full page document).
 */
export function parseTelegramChannelWall(html: string): TelegramPost[] {
  const fragments = html.split("tgme_widget_message_wrap js-widget_message_wrap").slice(
    1,
  );
  const out: TelegramPost[] = [];

  for (const block of fragments) {
    const postMatch =
      /<div class="tgme_widget_message\b[^"]*"[^>]*data-post=["']([^"']+)["']/.exec(
        block,
      ) ?? /data-post=["']([^"']+)["']/.exec(block);
    if (!postMatch) continue;

    const dataPost = postMatch[1];
    const [, postIdRaw] = dataPost.includes("/") ? dataPost.split("/") : [, dataPost];
    const postId = Number.parseInt(postIdRaw.trim(), 10);
    if (!Number.isFinite(postId)) continue;

    const timeMatch =
      /<time datetime=["']([^"']+)["']/.exec(block) ??
      /<a[^>]+class=["']tgme_widget_message_date[^"']*["'][^>]*><time[^>]+datetime=["']([^"']+)["']/.exec(
        block,
      );

    const publishedAt = timeMatch?.[1] ?? new Date().toISOString();
    const messageTextPlain = extractMessagePlainText(block);
    const messageMedia = extractOrderedMessageMedia(block);
    const mergedImages = mergeTelegramPostImageSources(
      messageMedia,
      block,
      messageTextPlain,
    );
    const views = extractViews(block);
    const reactionsHtml = extractReactionsHtml(block);
    const likes = parseTotalReactionsCount(reactionsHtml);

    const text = messageTextPlain;
    const links = [...text.matchAll(TG_TEXT_URL_REGEX)].map((m) => m[0]);

    out.push({
      id: `${CHANNEL_SLUG}-${postId}`,
      channelId: CHANNEL_SLUG,
      channelName: TELEGRAM_CHANNEL.displayName,
      postId,
      text,
      date: publishedAt,
      images: mergedImages.length > 0 ? mergedImages : [],
      links: Array.from(new Set(links)),
      views,
      likes,
    });
  }

  return out.reverse();
}
