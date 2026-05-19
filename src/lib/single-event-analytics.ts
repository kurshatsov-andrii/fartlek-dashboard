import { resolveEventCategory } from "@/lib/event-category";
import type { SportEvent } from "@/types";

export function meanViews(events: SportEvent[]): number {
  if (events.length === 0) return 0;
  return events.reduce((s, e) => s + e.views, 0) / events.length;
}

export function meanLikes(events: SportEvent[]): number {
  if (events.length === 0) return 0;
  return events.reduce((s, e) => s + e.likes, 0) / events.length;
}

export function medianViews(events: SportEvent[]): number {
  if (events.length === 0) return 0;
  const sorted = [...events].map((e) => e.views).sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[mid]!
    : Math.round((sorted[mid - 1]! + sorted[mid]!) / 2);
}

/** Місце серед усіх подій за переглядами (1 = найбільше переглядів). */
export function rankByViews(event: SportEvent, all: SportEvent[]): number {
  if (all.length === 0) return 1;
  const v = event.views;
  return all.filter((e) => e.views > v).length + 1;
}

/** Середні перегляди в тій самій категорії. */
export function meanViewsInCategory(
  event: SportEvent,
  all: SportEvent[],
): number {
  const cat = resolveEventCategory(event);
  const peers = all.filter((e) => resolveEventCategory(e) === cat);
  return meanViews(peers.length ? peers : all);
}

export function engagementPercent(event: SportEvent): number {
  if (event.views <= 0) return 0;
  return Math.min(100, (event.likes / event.views) * 100);
}
