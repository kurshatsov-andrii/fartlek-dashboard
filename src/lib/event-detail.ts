import type { SportEvent } from "@/types";

export const FARTLEK_SITE_ORIGIN = "https://fartlek.events";

/** Шлях до сторінки аналітики події на цьому сайті. */
export function sportEventPagePath(event: Pick<SportEvent, "slug">): string {
  return `/event/${event.slug}`;
}

export function sportEventAbsoluteUrl(
  event: Pick<SportEvent, "slug">,
): string {
  return `${FARTLEK_SITE_ORIGIN}${sportEventPagePath(event)}`;
}
