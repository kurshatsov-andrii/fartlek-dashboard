/**
 * Локальний плейсхолдер, якщо в поста немає прев'ю (не стокові фото).
 */
export const EVENT_COVER_FALLBACK = "/telegram-channel-cover.svg";

const PROXIED_HOSTS = new Set(["telegraph.controller.bot"]);

function shouldProxyTelegramMedia(hostname: string): boolean {
  return (
    /\.telesco\.pe$/i.test(hostname) ||
    /\.cdn-telegram\.org$/i.test(hostname)
  );
}

/**
 * Якщо GET `/api/event-image?url=…` стає завеликим або ненадійним через query-string —
 * тягнемо через POST із JSON-тілом.
 */
export const EVENT_IMAGE_PROXY_MAX_GET_CHARS = 2000;

export function eventImagePreferPostBody(original: string): boolean {
  const proxied = eventCoverImageUrl(original);
  if (proxied === original) return false;
  return proxied.length >= EVENT_IMAGE_PROXY_MAX_GET_CHARS;
}

export function eventCoverImageUrl(original: string): string {
  try {
    const u = new URL(original);
    if (PROXIED_HOSTS.has(u.hostname) || shouldProxyTelegramMedia(u.hostname)) {
      return `/api/event-image?url=${encodeURIComponent(original)}`;
    }
  } catch {
    /* ignore */
  }
  return original;
}
