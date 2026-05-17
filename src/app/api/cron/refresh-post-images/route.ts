import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { TELEGRAM_DASHBOARD_CACHE_TAG } from "@/lib/telegram-dashboard-cache";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { runRefreshTelegramPostImagesJob } from "@/lib/refresh-telegram-post-images-job";

export const maxDuration = 300;

/**
 * Щоденне оновлення `telegram_posts.images` з публічних сторінок t.me.
 * Cron (Vercel): GET з Authorization: Bearer $CRON_SECRET
 *
 * Вимкнути без видалення маршруту: CRON_REFRESH_POST_IMAGES_DISABLED=1
 */
export async function GET(req: NextRequest) {
  const disabled =
    process.env.CRON_REFRESH_POST_IMAGES_DISABLED === "1" ||
    /\btrue\b/i.test(process.env.CRON_REFRESH_POST_IMAGES_DISABLED ?? "");
  if (disabled) {
    return NextResponse.json({ ok: true, skipped: "disabled" });
  }

  const cronSecret = process.env.CRON_SECRET?.trim();
  if (cronSecret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { ok: false, skipped: "no_supabase" },
      { status: 503 },
    );
  }

  try {
    const stats = await runRefreshTelegramPostImagesJob();
    revalidateTag(TELEGRAM_DASHBOARD_CACHE_TAG);
    return NextResponse.json({ ok: true, ...stats });
  } catch (e) {
    console.error("[cron/refresh-post-images]", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
