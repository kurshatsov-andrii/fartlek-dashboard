import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { TELEGRAM_DASHBOARD_CACHE_TAG } from "@/lib/telegram-dashboard-cache";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { syncTelegramToDatabase } from "@/lib/telegram-sync";
import { dashboardTargetYearPrefixes } from "@/lib/sport-events-from-telegram";

export const maxDuration = 300;

function syncSecretMismatch(req: NextRequest): boolean {
  const secret = process.env.TELEGRAM_SYNC_SECRET?.trim();
  if (!secret) return false;
  const auth = req.headers.get("authorization");
  return auth !== `Bearer ${secret}`;
}

/**
 * POST: зтягує дописи з Telegram у Supabase (інкрементально, якщо БД уже заповнена).
 */
export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Немає змінних NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.",
      },
      { status: 503 },
    );
  }
  if (syncSecretMismatch(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncTelegramToDatabase();
    revalidateTag(TELEGRAM_DASHBOARD_CACHE_TAG);
    const years = dashboardTargetYearPrefixes().join(", ");
    const skipHint =
      result.skippedSamples?.length ?
        ` Відсіювання: ${result.skippedSamples.map((s) => `#${s.postId}: ${s.reason}`).join("; ")}.`
        : "";

    return NextResponse.json({
      ok: true,
      ...result,
      message:
        result.mode === "incremental"
          ? `Отримано ${result.fetchedBeforeFilter} дописів з каналу; після фільтру (${years}, мітки дати, км): ${result.remoteCount}; збережено: ${result.upsertedCount}.${skipHint}`
          : result.mode === "bootstrap"
            ? `Bootstrap: із каналу ${result.fetchedBeforeFilter}; у БД після фільтру: ${result.upsertedCount}.${skipHint}`
            : `Нові id не з’явились; перевірено останню сторінку превʼю (оновлення метрик / фільтр): збережено ${result.upsertedCount} рядків.${skipHint}`,
    });
  } catch (e) {
    console.error("[sync-telegram]", e);
    const msg =
      e instanceof Error ? e.message : "Невідома помилка синхронізації";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
