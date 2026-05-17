import {
  extractOpenGraphImageUrlsFromHtml,
  extractTelegramCdnUrlsFromHtml,
  extractTelegraphFileUrlsFromHtml,
  finalizePosterImageUrls,
} from "@/lib/telegram-media-urls";
import {
  extractOrderedWidgetMediaUrlsFromHtml,
  extractPrimaryChatMediaUrlsFromHtml,
} from "@/services/telegram/html-preview-parser";
import { TELEGRAM_CHANNEL } from "@/services/telegram/parser";

const SINGLE_POST_HEADERS = {
  "User-Agent": `Mozilla/5.0 (compatible; FartlekEventsDashboard/1.3; +${TELEGRAM_CHANNEL.url})`,
  Accept: "text/html,application/xhtml+xml",
} as const;

const WIDGET_WRAP_MARKER = "tgme_widget_message_wrap js-widget_message_wrap";

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseSlugAndPostIdFromCanonical(
  canonical: string,
): { slug: string; postId: number } | null {
  try {
    const u = new URL(canonical);
    const parts = u.pathname.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean);
    if (parts.length < 2) return null;
    const postId = Number(parts[parts.length - 1]);
    const slug = parts[parts.length - 2] ?? "";
    if (!slug || slug === "s" || slug === "c" || !Number.isFinite(postId))
      return null;
    return { slug, postId };
  } catch {
    return null;
  }
}

function sliceWidgetAroundAnchor(fullDocument: string, anchor: number): string {
  const blockStart = fullDocument.lastIndexOf(WIDGET_WRAP_MARKER, anchor);
  if (blockStart === -1) {
    return fullDocument.slice(
      Math.max(0, anchor - 6000),
      Math.min(fullDocument.length, anchor + 14000),
    );
  }
  const nextWrap = fullDocument.indexOf(
    WIDGET_WRAP_MARKER,
    blockStart + WIDGET_WRAP_MARKER.length,
  );
  const blockEnd = nextWrap === -1 ? fullDocument.length : nextWrap;
  return fullDocument.slice(blockStart, blockEnd);
}

/**
 * Точний HTML-блок допису з атрибутом `data-post="slug/id"`.
 * Перший `tgme_widget_message_wrap` на сторінці часто буває навігацією/іншим каналом — без цього злітають превʼю.
 */
function widgetHtmlForDataPost(
  fullDocument: string,
  slug: string,
  postId: number,
): string | null {
  const exactRe = new RegExp(
    `data-post=["']${escapeRegex(slug)}/${postId}["']`,
    "i",
  );
  const exactHit = exactRe.exec(fullDocument);
  if (exactHit) return sliceWidgetAroundAnchor(fullDocument, exactHit.index);

  for (const m of fullDocument.matchAll(/data-post=["']([^"']+)["']/gi)) {
    const val = m[1]?.trim();
    if (!val) continue;
    const idTail = val.split("/").pop();
    if (idTail !== String(postId)) continue;
    const idx = m.index ?? -1;
    if (idx < 0) continue;
    return sliceWidgetAroundAnchor(fullDocument, idx);
  }

  return null;
}

/** Запасний варіант: перший віджет на сторінці (може бути неточним). */
function primaryPostWidgetHtml(fullDocument: string): string {
  if (!fullDocument.includes(WIDGET_WRAP_MARKER)) return fullDocument;
  const chunks = fullDocument.split(WIDGET_WRAP_MARKER).slice(1);
  const first = chunks[0];
  if (!first) return fullDocument;
  const onlyFirst = first.split(WIDGET_WRAP_MARKER)[0] ?? first;
  return `${WIDGET_WRAP_MARKER}${onlyFirst}`;
}

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

/**
 * Актуальні URL превʼю з публічної сторінки одного поста.
 * Порядок: медіа з віджета повідомлення, потім CDN/Telegraph з усього HTML документа
 * (у віджеті іноді лише спільне превʼю каналу). Якщо все ще порожньо — og:image.
 */
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

    const ids = parseSlugAndPostIdFromCanonical(canonical);
    const widgetHtml =
      ids != null
        ? widgetHtmlForDataPost(html, ids.slug, ids.postId)
        : null;
    const scope =
      widgetHtml?.trim() ? widgetHtml : primaryPostWidgetHtml(html);

    const primaryMedia = extractPrimaryChatMediaUrlsFromHtml(scope);
    const widgetRest = extractOrderedWidgetMediaUrlsFromHtml(scope);
    const mergedOrdered: string[] = [...primaryMedia];
    for (const u of widgetRest) {
      if (mergedOrdered.includes(u)) continue;
      mergedOrdered.push(u);
    }

    const fromWidget = finalizePosterImageUrls([
      ...mergedOrdered,
      ...extractTelegraphFileUrlsFromHtml(scope),
      ...extractTelegramCdnUrlsFromHtml(scope),
    ]);

    /** Не виходимо рано: у віджеті іноді лише одне спільне превʼю каналу, а унікальні афіші лишаються в інших CDN-фрагментах повного документа. */
    const fromFullDoc = finalizePosterImageUrls([
      ...extractTelegraphFileUrlsFromHtml(html),
      ...extractTelegramCdnUrlsFromHtml(html),
    ]);

    /** Спочатку CDN з повного HTML — там частіше унікальна афіша; віджет нерідко дає одне спільне превʼю каналу. */
    let merged = finalizePosterImageUrls([...fromFullDoc, ...fromWidget]);
    if (merged.length === 0) {
      merged = finalizePosterImageUrls([
        ...extractOpenGraphImageUrlsFromHtml(html),
      ]);
    }
    return merged;
  } catch {
    return [];
  }
}
