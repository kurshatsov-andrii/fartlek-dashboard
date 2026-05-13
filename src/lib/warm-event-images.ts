import {
  parseCachableImageUrl,
  warmEventImageUrl,
} from "@/lib/event-image-pipeline";
import type { SportEvent } from "@/types";

/** Унікальні URL прев’ю, які можна тягнути через проксі / кеш (Telegram CDN, Telegraph). */
export function collectCachableImageUrlsFromEvents(
  events: SportEvent[],
): string[] {
  const urls = new Set<string>();
  for (const e of events) {
    for (const raw of [e.image, ...(e.imageAlternates ?? [])]) {
      if (!raw?.trim()) continue;
      if (parseCachableImageUrl(raw)) urls.add(raw.trim());
    }
  }
  return [...urls];
}

export type WarmImageStats = {
  total: number;
  hit: number;
  cached: number;
  skip: number;
  fail: number;
};

/**
 * Паралельно завантажує та записує в дисковий кеш усі придатні зображення подій.
 */
export async function warmAllEventImageCache(
  events: SportEvent[],
  options?: { concurrency?: number },
): Promise<WarmImageStats> {
  const urls = collectCachableImageUrlsFromEvents(events);
  const concurrency = Math.max(1, Math.min(16, options?.concurrency ?? 8));
  const hit = { hit: 0, cached: 0, skip: 0, fail: 0 };

  let next = 0;
  async function worker() {
    while (true) {
      const i = next;
      next += 1;
      if (i >= urls.length) break;
      const r = await warmEventImageUrl(urls[i]);
      if (r === "hit") hit.hit += 1;
      else if (r === "cached") hit.cached += 1;
      else if (r === "skip") hit.skip += 1;
      else hit.fail += 1;
    }
  }

  const nWorkers = Math.min(concurrency, urls.length || 1);
  await Promise.all(Array.from({ length: nWorkers }, () => worker()));

  return { total: urls.length, ...hit };
}
