import { unstable_cache } from "next/cache";
import type { ImportLogEntry, Organizer, SportEvent } from "@/types";
import { organizersFromSportEvents } from "@/lib/organizers-from-events";
import { telegramPostsToSportEvents } from "@/lib/sport-events-from-telegram";
import { fetchChannelPosts } from "@/services/telegram";

async function assembleDashboard(): Promise<{
  events: SportEvent[];
  organizers: Organizer[];
  logs: ImportLogEntry[];
  syncedAt: string;
}> {
  const fetched = await fetchChannelPosts();
  const events = telegramPostsToSportEvents(fetched.posts);
  const organizers = organizersFromSportEvents(events);
  const logs: ImportLogEntry[] = [
    {
      id: "tg-sync-live",
      source: "telegram",
      status: "success",
      message: `Превью Telegram: ${fetched.posts.length} дописів завантажено; на дашборді подій 2026 р. з дистанцією (км/K): ${events.length}.`,
      eventsImported: events.length,
      timestamp: fetched.fetchedAt,
    },
  ];
  return { events, organizers, logs, syncedAt: fetched.fetchedAt };
}

const cachedDashboard = unstable_cache(
  assembleDashboard,
  ["fartlek-telegram-dashboard-v2"],
  { revalidate: 600 },
);

export async function fetchTelegramDashboard() {
  return cachedDashboard();
}
