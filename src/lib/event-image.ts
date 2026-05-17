import { isTelegramCdnHostname } from "@/lib/telegram-cdn-hostname";

/**
 * Локальний плейсхолдер, якщо в поста немає прев'ю (не стокові фото).
 */
export const EVENT_COVER_FALLBACK = "/telegram-channel-cover.svg";

/**
 * Фрагмент slug (нижній регістр) на `*.telesco.pe/file/…` — для варіантів цього ж файлу на інших CDN-хостах.
 */
export const BLOCKED_TELESCO_POSTER_SLUG_SNIPPET_LOWER =
  "w_sxjs2fpnsnddtkn2dqkvvmdavko2oz_jdmqbrveh3uoekfvkz88qck4_ew2pqkh9vypsqc8u29u8xm0vzvqi2cy";

function telegramStoredImageCanonicalHref(raw: string): string | null {
  try {
    const u = new URL(raw.trim());
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    u.protocol = "https:";
    u.hash = "";
    return u.href;
  } catch {
    return null;
  }
}

/** Точний канонічний URL проблемного службового превʼю (як у таблиці Supabase). */
const BLOCKED_TELESCO_PE_CANONICAL_KEYS = new Set<string>(
  [
    "https://cdn4.telesco.pe/file/W_sXjs2fPNSNdDtkn2dqKvvmdavko2oz_jDmqBRvEh3UoeUfVKZI88qCk4_Ew2PQKh9vYpSQc8u29U8XM0VzVqi2cyY90PDlKprVp9oiXxlOfEw-mK1gc45dnxqqKjio4aQqD_utwmYgbwbp2BoY2g4oo49ILw7L78A9V57SDaVPMfuTv1U1J8bbq-Vh5D9Q59DrejLK0WdPTrOym7Xm-r6hTliUVAHz99LJatP3xT3svpZQBzW8OPO4BZ_xI0ml2AGVCwrfNddg6EtTrsC8LcWxsd2Rq3ZWB0Hft-gJNPza1Ok-cbPtfZsMG8NTkQrM4mjHaF_bV-UgjkfTvPhrSg.jpg",
  ]
    .map((s) => telegramStoredImageCanonicalHref(s))
    .filter((x): x is string => Boolean(x)),
);

/** У колонку БД потрапляти не має — лише превʼю з Telegram CDN / Telegraph. */
export function isRejectedStoredTelegramImageUrl(url: string): boolean {
  const t = url.trim();
  if (!t) return true;
  if (!/^https?:\/\//i.test(t)) return true;
  const canon = telegramStoredImageCanonicalHref(t);
  if (canon && BLOCKED_TELESCO_PE_CANONICAL_KEYS.has(canon)) return true;
  const lower = t.toLowerCase();
  if (lower.includes("telegram-channel-cover.svg")) return true;
  if (
    lower.includes("telesco.pe/file/") &&
    lower.includes(BLOCKED_TELESCO_POSTER_SLUG_SNIPPET_LOWER)
  )
    return true;
  return false;
}

const PROXIED_HOSTS = new Set(["telegraph.controller.bot"]);

function shouldProxyTelegramMedia(hostname: string): boolean {
  return isTelegramCdnHostname(hostname);
}

/**
 * Довгі рядки `/api/event-image?url=…&telegramPost=…` часто не підходять для GET у `<img>`
 * (обривають або відхиляють проксі); для них одразу використовуємо POST + blob у клієнті.
 */
export const EVENT_IMAGE_PROXY_PREFER_POST_BODY_CHARS = 2600;

export function eventImagePreferPostBody(
  original: string,
  telegramPostUrl?: string | null,
): boolean {
  const proxied = eventCoverImageUrl(original, telegramPostUrl);
  if (proxied === original) return false;
  return proxied.length >= EVENT_IMAGE_PROXY_PREFER_POST_BODY_CHARS;
}

/**
 * `telegramPostUrl` — посилання на допис `https://t.me/channel/NNN`; якщо CDN-URL застарілий,
 * сервер знімає превʼю з цієї сторінки й підставляє свіжий файлний URL.
 */
export function eventCoverImageUrl(
  original: string,
  telegramPostUrl?: string | null,
): string {
  try {
    const u = new URL(original);
    if (PROXIED_HOSTS.has(u.hostname) || shouldProxyTelegramMedia(u.hostname)) {
      const tg = telegramPostUrl?.trim();
      const telegramParam = tg ? `&telegramPost=${encodeURIComponent(tg)}` : "";
      return `/api/event-image?url=${encodeURIComponent(original)}${telegramParam}`;
    }
  } catch {
    /* ignore */
  }
  return original;
}
