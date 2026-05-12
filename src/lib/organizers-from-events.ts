import type { Organizer, SportEvent } from "@/types";
import { EVENT_COVER_FALLBACK } from "@/lib/event-image";

export function organizersFromSportEvents(events: SportEvent[]): Organizer[] {
  const map = new Map<
    string,
    { organizer: Organizer; events: SportEvent[] }
  >();

  for (const ev of events) {
    let entry = map.get(ev.organizerId);
    if (!entry) {
      entry = {
        organizer: {
          id: ev.organizerId,
          name: ev.organizerName,
          avatar: EVENT_COVER_FALLBACK,
          bio: "З тексту опису дописів Telegram каналу @fartlekua.",
          rating: 0,
          eventsCount: 0,
          city: ev.city,
        },
        events: [],
      };
      map.set(ev.organizerId, entry);
    }
    entry.events.push(ev);
  }

  const list = [...map.values()].sort(
    (a, b) => b.events.length - a.events.length,
  );

  for (const row of list) {
    row.organizer.eventsCount = row.events.length;
    row.organizer.city = row.events[0]?.city ?? row.organizer.city;
    row.organizer.avatar =
      [...row.events].sort((a, b) => b.views - a.views)[0]?.image ??
      EVENT_COVER_FALLBACK;
  }

  return list.slice(0, 20).map((r) => r.organizer);
}
