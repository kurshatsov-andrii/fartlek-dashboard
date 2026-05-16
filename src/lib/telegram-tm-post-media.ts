import {
  extractTelegramCdnUrlsFromHtml,
  extractTelegraphFileUrlsFromHtml,
  finalizePosterImageUrls,
} from "@/lib/telegram-media-urls";
import { TELEGRAM_CHANNEL } from "@/services/telegram/parser";

const SINGLE_POST_HEADERS = {
  "User-Agent": `Mozilla/5.0 (compatible; FartlekEventsDashboard/1.3; +${TELEGRAM_CHANNEL.url})`,
  Accept: "text/html,application/xhtml+xml",
} as const;

/**
 * Посилання типу https://t.me/channel/NNN або https://telegram.me/channel/NNN — без закритого превʼю /s/.
 */
export function normalizeTelegramPublicPostHref(raw: string): string | null {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  const host = u.hostname.toLowerCase();
  if (host !== "t.me" && host !== "telegram.me") return null;
  const segs = u.pathname.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean);
  if (segs.length < 2) return null;
  const postIdRaw = segs[segs.length - 1] ?? "";
  if (!/^\d+$/.test(postIdRaw)) return null;
  const slug = segs[segs.length - 2] ?? "";
  if (!slug || slug === "s" || slug === "c") return null;
  return `https://t.me/${slug}/${postIdRaw}`;
}

export function parseNumericPostIdFromPermalink(normalizedHref: string): number | null {
  const u = /\bt\.me\/[^/]+\/(\d+)/.exec(normalizedHref.replace(/^https?:\/\//, ""));
  const n = u?.[1] ? Number(u[1]) : NaN;
  return Number.isFinite(n) ? n : null;
}

/** Свіжі URL превʼю з публічної сторінки одного поста (Telegram CDN / Telegraph замінюються періодично). */
export async function fetchFreshPosterUrlsFromPublicPostPage(
  telegramPostPermalink: string,
): Promise<string[]> {
  const canonical = normalizeTelegramPublicPostHref(telegramPostPermalink);
  if (!canonical) return [];

  try {
    const res = await fetch(canonical, {
      headers: SINGLE_POST_HEADERS,
      cache: "no-store",
      redirect: "follow",
    });
    if (!res.ok) return [];
    const html = await res.text();
    const discovered = [
      ...extractTelegraphFileUrlsFromHtml(html),
      ...extractTelegramCdnUrlsFromHtml(html),
    ];
    return finalizePosterImageUrls(discovered);
  } catch {
    return [];
  }
}
