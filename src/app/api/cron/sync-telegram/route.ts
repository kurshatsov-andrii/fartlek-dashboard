import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { TELEGRAM_DASHBOARD_CACHE_TAG } from "@/lib/telegram-dashboard-cache";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { syncTelegramToDatabase } from "@/lib/telegram-sync";

export const maxDuration = 300;

/**
 * Cron (наприклад Vercel): GET з Authorization: Bearer $CRON_SECRET
 */
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (cronSecret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, skipped: "no_supabase" }, { status: 503 });
  }

  try {
    const result = await syncTelegramToDatabase();
    revalidateTag(TELEGRAM_DASHBOARD_CACHE_TAG);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("[cron/sync-telegram]", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
