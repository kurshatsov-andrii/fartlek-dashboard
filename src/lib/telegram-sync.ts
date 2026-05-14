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
import { telegramPostDashboardRejectReason } from "@/lib/sport-events-from-telegram";

export interface TelegramSyncResult {
  fetchedAt: string;
  /** Рядків з Telegram після дедупу (до фільтру) */
  fetchedBeforeFilter: number;
  /** Потрапляють у БД (роки з `DASHBOARD_TELEGRAM_TARGET_YEAR_PREFIXES`, дата в тексті + км) */
  remoteCount: number;
  /** Upsert у Supabase */
  upsertedCount: number;
  mode: "bootstrap" | "incremental" | "heartbeat";
  /** Чому відсіяли дописи (до 5) — для діагностики в адмінці. */
  skippedSamples?: Array<{
    postId: number;
    reason: string;
    textPreview: string;
  }>;
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
  const merged: TelegramPost[] = [];
  const rejected: { post: TelegramPost; reason: string }[] = [];

  for (const p of deduped) {
    const skipReason = telegramPostDashboardRejectReason(p);
    if (skipReason === null) merged.push(p);
    else rejected.push({ post: p, reason: skipReason });
  }

  const skippedSamples =
    rejected.length > 0
      ? rejected.slice(0, 5).map(({ post: p, reason }) => ({
          postId: p.postId,
          reason,
          textPreview: p.text.slice(0, 220).replace(/\s+/g, " ").trim(),
        }))
      : undefined;

  const upsertedCount =
    merged.length > 0 ? await upsertTelegramPosts(merged) : 0;

  return {
    fetchedAt,
    fetchedBeforeFilter: deduped.length,
    remoteCount: merged.length,
    upsertedCount,
    mode,
    ...(skippedSamples ? { skippedSamples } : {}),
  };
}
