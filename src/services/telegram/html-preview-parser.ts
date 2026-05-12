import type { TelegramPost } from "@/types";

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

function normalizeUrl(u: string): string | null {
  const t = u.trim().replace(/^\/\//, "https://");
  if (!t.startsWith("http")) return null;
  try {
    const url = new URL(t);
    if (url.hostname === "telegraph.controller.bot" && url.protocol === "http:") {
      url.protocol = "https:";
      return url.toString();
    }
    return url.toString();
  } catch {
    return null;
  }
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
    /<div class="tgme_widget_message_reactions[^"]*">([\s\S]*?)<\/div>/,
  );
  return m?.[1] ?? "";
}

function parseHeartReactionCount(reactionsInner: string): number {
  if (!reactionsInner) return 0;
  const spans = [...reactionsInner.matchAll(/<span class="tgme_reaction">([\s\S]*?)<\/span>/g)];
  let hearts = 0;
  for (const [, inner] of spans) {
    const isHeart =
      /<b>\s*(?:❤|❤️)\s*<\/b>/i.test(inner) ||
      /E29DA4\.png/i.test(inner) ||
      /heart/u.test(inner);
    const n = /<\/i>(\d+)/.exec(inner)?.[1] ?? /(\d+)<\/span>\s*$/.exec(inner)?.[1];
    if (isHeart && n) hearts += Number.parseInt(n, 10) || 0;
  }
  return hearts;
}

function extractViews(htmlBlock: string): number {
  const m = /<span class="tgme_widget_message_views">([^<]*)<\/span>/.exec(
    htmlBlock,
  );
  if (!m) return 0;
  return parseMetricCount(m[1]);
}

/** Media inside message bubble only (excludes channel avatar thumb). */
function extractOrderedBubbleMedia(htmlBlock: string): string[] {
  const bubble = htmlBlock.includes("tgme_widget_message_bubble")
    ? (htmlBlock.split("tgme_widget_message_bubble")[1] ?? htmlBlock)
    : htmlBlock;
  const urls: string[] = [];
  const seen = new Set<string>();
  const push = (raw: string) => {
    const n = normalizeUrl(raw.trim());
    if (!n || seen.has(n)) return;
    seen.add(n);
    urls.push(n);
  };
  /** t.me часто задає превью так: style="width:…; background-image:url('https://cdn4…')" */
  for (const mm of bubble.matchAll(
    /background-image:\s*url\(\s*['"]?([^'")]+?)['"]?\s*\)/gi,
  )) {
    push(mm[1]);
  }
  for (const mm of bubble.matchAll(
    /(?:href|src)=["']([^"']+)["']/g,
  )) {
    const v = mm[1];
    if (/cdn\d*\.telesco\.pe/i.test(v))
      push(v.replace(/^\/\//, "https:"));
    if (v.includes("telegraph.controller.bot"))
      push(v.startsWith("//") ? `https:${v}` : v);
  }
  for (const mm of bubble.matchAll(/https?:\/\/cdn4\.telesco\.pe\/file\/[^\s"'>)]+/gi)) {
    push(mm[0]);
  }
  for (const mm of bubble.matchAll(
    /https?:\/\/telegraph\.controller\.bot[^\s"'>)]+/gi,
  )) {
    push(mm[0]);
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
    const bubbleMedia = extractOrderedBubbleMedia(block);
    const views = extractViews(block);
    const hearts = parseHeartReactionCount(extractReactionsHtml(block));

    const text = messageTextPlain;
    const links = [...text.matchAll(TG_TEXT_URL_REGEX)].map((m) => m[0]);

    out.push({
      id: `${CHANNEL_SLUG}-${postId}`,
      channelId: CHANNEL_SLUG,
      channelName: TELEGRAM_CHANNEL.displayName,
      postId,
      text,
      date: publishedAt,
      images: bubbleMedia.length > 0 ? bubbleMedia.slice(0, 24) : [],
      links: Array.from(new Set(links)),
      views,
      likes: hearts,
    });
  }

  return out.reverse();
}
