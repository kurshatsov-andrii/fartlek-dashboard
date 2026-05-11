/**
 * Локальний плейсхолдер, якщо в поста немає прев'ю (не стокові фото).
 */
export const EVENT_COVER_FALLBACK = "/telegram-channel-cover.svg";

const PROXIED_HOSTS = new Set(["telegraph.controller.bot"]);

/**
 * Telegraph віддає application/octet-stream — через проксі ставимо image/*.
 * Файли *.telesco.pe з прев'ю t.me вже мають image/jpeg; їх не проксуємо.
 */
export function eventCoverImageUrl(original: string): string {
  try {
    const u = new URL(original);
    if (PROXIED_HOSTS.has(u.hostname)) {
      return `/api/event-image?url=${encodeURIComponent(original)}`;
    }
  } catch {
    /* ignore */
  }
  return original;
}
