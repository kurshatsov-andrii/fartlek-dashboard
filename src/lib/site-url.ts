import { FARTLEK_SITE_ORIGIN } from "@/lib/event-detail";

/** Канонічний origin сайту (без слеша в кінці) для SEO, sitemap і абсолютних посилань. */
export function getCanonicalSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) {
    try {
      const href =
        raw.startsWith("http://") || raw.startsWith("https://") ?
          raw
        : `https://${raw}`;
      return new URL(href).origin;
    } catch {
      /* fall through */
    }
  }
  return FARTLEK_SITE_ORIGIN.replace(/\/$/, "");
}

/** Абсолютний URL для шляху на цьому сайті. */
export function absoluteSiteUrl(path: string): string {
  const base = getCanonicalSiteUrl();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}
