import { NextResponse, type NextRequest } from "next/server";
import { loadTelegramDashboardDirect } from "@/lib/telegram-dashboard-cache";
import { warmAllEventImageCache } from "@/lib/warm-event-images";

export const maxDuration = 300;

/**
 * Прогрів дискового кешу прев’ю. Cron: GET + Authorization: Bearer $CRON_SECRET
 */
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (cronSecret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
  }

  try {
    const { events } = await loadTelegramDashboardDirect();
    const stats = await warmAllEventImageCache(events, { concurrency: 8 });
    return NextResponse.json({ ok: true, ...stats });
  } catch (e) {
    console.error("[cron/warm-event-images]", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
