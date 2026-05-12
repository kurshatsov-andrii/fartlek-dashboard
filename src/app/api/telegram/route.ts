import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import {
  importChannelEvents,
  parseTelegramPosts,
  TELEGRAM_CHANNEL,
} from "@/services/telegram";
import {
  TELEGRAM_DASHBOARD_CACHE_TAG,
} from "@/lib/telegram-dashboard-cache";
import {
  getLatestTelegramSyncTimeFromDb,
  listTelegramPostsFromDb,
} from "@/lib/telegram-db";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { syncTelegramToDatabase } from "@/lib/telegram-sync";

export const dynamic = "force-dynamic";

/**
 * Читає лише БД коли налаштовано Supabase; інакше — прямий імпорт з Telegram (dev).
 */
export async function GET() {
  if (!isSupabaseConfigured()) {
    const result = await importChannelEvents();
    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "private, no-store",
      },
    });
  }

  const posts = await listTelegramPostsFromDb();
  const fetchedAt =
    (await getLatestTelegramSyncTimeFromDb()) ?? new Date().toISOString();
  const parsed = parseTelegramPosts(posts);

  return NextResponse.json(
    {
      channel: TELEGRAM_CHANNEL,
      fetchedAt,
      count: posts.length,
      parsed,
    },
    {
      headers: {
        "Cache-Control": "private, max-age=60",
      },
    },
  );
}

/**
 * Альтернатива POST /api/sync-telegram: сумісність з клиєнтом, який досі робить лише запит до /api/telegram.
 */
export async function POST() {
  if (!isSupabaseConfigured()) {
    const result = await importChannelEvents();
    return NextResponse.json({
      migrated: false,
      ...result,
    });
  }

  try {
    const sync = await syncTelegramToDatabase();
    revalidateTag(TELEGRAM_DASHBOARD_CACHE_TAG);
    return NextResponse.json({ ok: true, migrated: true, ...sync });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "sync_failed";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
