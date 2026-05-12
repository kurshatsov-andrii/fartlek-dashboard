import type { TelegramPost } from "@/types";
import {
  fetchAllTelegramPreviewPosts,
  fetchTelegramLatestPreviewPage,
  fetchTelegramPostsNewerThan,
} from "@/services/telegram/fetch-paginated-posts";
import {
  getMaxTelegramPostIdFromDb,
  upsertTelegramPosts,
} from "@/lib/telegram-db";
import { telegramPostShouldSyncToDb } from "@/lib/sport-events-from-telegram";

export interface TelegramSyncResult {
  fetchedAt: string;
  /** Рядків з Telegram після дедупу (до фільтру) */
  fetchedBeforeFilter: number;
  /** Потрапляють у БД (івенти 2026 + дата в тексті + км) */
  remoteCount: number;
  /** Upsert у Supabase */
  upsertedCount: number;
  mode: "bootstrap" | "incremental" | "heartbeat";
}

async function dedupePosts(posts: TelegramPost[]): Promise<TelegramPost[]> {
  const byId = new Map<number, TelegramPost>();
  for (const p of posts) {
    if (!byId.has(p.postId)) byId.set(p.postId, p);
  }
  return [...byId.values()];
}

/**
 * Завантажує з Telegram лише недоступні ще записи (+ легкий refresh останньої сторінки для метрик).
 * У таблицю зберігаються лише дописи, що відповідають фільтру дашборду (див. telegramPostShouldSyncToDb).
 */
export async function syncTelegramToDatabase(): Promise<TelegramSyncResult> {
  const fetchedAt = new Date().toISOString();

  const maxKnown = await getMaxTelegramPostIdFromDb();

  let fromNetwork: TelegramPost[];
  let mode: TelegramSyncResult["mode"];

  if (maxKnown == null) {
    mode = "bootstrap";
    fromNetwork = await fetchAllTelegramPreviewPosts();
  } else {
    const fresh = await fetchTelegramPostsNewerThan(maxKnown);
    if (fresh.length > 0) {
      mode = "incremental";
      fromNetwork = fresh;
    } else {
      mode = "heartbeat";
      /** Немає нових id — оновлюємо перегляди/лайки для верхніх дописів */
      fromNetwork = await fetchTelegramLatestPreviewPage();
    }
  }

  const deduped = await dedupePosts(fromNetwork);
  const merged = deduped.filter((p) => telegramPostShouldSyncToDb(p));

  const upsertedCount =
    merged.length > 0 ? await upsertTelegramPosts(merged) : 0;

  return {
    fetchedAt,
    fetchedBeforeFilter: deduped.length,
    remoteCount: merged.length,
    upsertedCount,
    mode,
  };
}
