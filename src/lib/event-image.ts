/** Unsplash fallback when Telegraph CDN fails (proxy block, expiry, etc.). */
export const EVENT_COVER_FALLBACK =
  "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=1200&h=800&fit=crop";

const PROXIED_HOSTS = new Set(["telegraph.controller.bot"]);

/** Same-origin proxy so the browser gets a real image/* Content-Type (Telegraph uses octet-stream). */
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
