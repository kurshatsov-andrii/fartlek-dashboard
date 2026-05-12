import { unstable_cache } from "next/cache";
import type { ImportLogEntry, Organizer, SportEvent } from "@/types";
import { organizersFromSportEvents } from "@/lib/organizers-from-events";
import { telegramPostsToSportEvents } from "@/lib/sport-events-from-telegram";
import { fetchChannelPosts } from "@/services/telegram";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import {
  getLatestTelegramSyncTimeFromDb,
  listTelegramPostsFromDb,
} from "@/lib/telegram-db";

export const TELEGRAM_DASHBOARD_CACHE_TAG = "telegram-dashboard";

async function assembleDashboard(): Promise<{
  events: SportEvent[];
  organizers: Organizer[];
  logs: ImportLogEntry[];
  syncedAt: string;
  source: "supabase" | "telegram_fallback";
}> {
  if (!isSupabaseConfigured()) {
    const fetched = await fetchChannelPosts();
    const posts = fetched.posts;
    const events = telegramPostsToSportEvents(posts);
    const organizers = organizersFromSportEvents(events);
    const logs: ImportLogEntry[] = [
      {
        id: "tg-direct-fallback",
        source: "telegram",
        status: "partial",
        message: `Без Supabase: дані напряму з Telegram (${posts.length} дописів). Додайте NEXT_PUBLIC_SUPABASE_URL та SUPABASE_SERVICE_ROLE_KEY, щоб кешувати в БД.`,
        eventsImported: events.length,
        timestamp: fetched.fetchedAt,
      },
    ];
    return {
      events,
      organizers,
      logs,
      syncedAt: fetched.fetchedAt,
      source: "telegram_fallback",
    };
  }

  const posts = await listTelegramPostsFromDb();
  const events = telegramPostsToSportEvents(posts);
  const organizers = organizersFromSportEvents(events);
  const syncedAt =
    (await getLatestTelegramSyncTimeFromDb()) ?? new Date().toISOString();
  const modeMsg =
    posts.length === 0
      ? "Таблиця порожня — викличте POST /api/sync-telegram або npm run sync:supabase:reset2026."
      : `Зчитано ${posts.length} дописів з Supabase; на дашборді подій 2026 з дистанцією: ${events.length}.`;

  const logs: ImportLogEntry[] = [
    {
      id: "supabase-read",
      source: "api",
      status: posts.length === 0 ? "partial" : "success",
      message: modeMsg,
      eventsImported: events.length,
      timestamp: syncedAt,
    },
  ];

  return {
    events,
    organizers,
    logs,
    syncedAt,
    source: "supabase",
  };
}

const cachedDashboard = unstable_cache(
  assembleDashboard,
  ["fartlek-telegram-dashboard-v3"],
  { revalidate: 600, tags: [TELEGRAM_DASHBOARD_CACHE_TAG] },
);

export async function fetchTelegramDashboard() {
  return cachedDashboard();
}
