import type { SportEvent } from "@/types";
import { absoluteSiteUrl } from "@/lib/site-url";

export const FARTLEK_SITE_ORIGIN = "https://fartlek-dashboard.vercel.app";

/** Шлях до сторінки аналітики події на цьому сайті. */
export function sportEventPagePath(event: Pick<SportEvent, "slug">): string {
  return `/event/${event.slug}`;
}

export function sportEventAbsoluteUrl(
  event: Pick<SportEvent, "slug">,
): string {
  return absoluteSiteUrl(sportEventPagePath(event));
}
