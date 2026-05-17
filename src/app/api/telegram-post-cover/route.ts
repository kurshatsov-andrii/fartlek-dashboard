import { NextRequest, NextResponse } from "next/server";

import { isRejectedStoredTelegramImageUrl } from "@/lib/event-image";
import {
  loadImageFromUpstream,
  parseCachableImageUrl,
} from "@/lib/event-image-pipeline";
import { finalizePosterImageUrls } from "@/lib/telegram-media-urls";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { updateTelegramPostImages } from "@/lib/telegram-db";
import {
  fetchFreshPosterUrlsFromPublicPostPage,
  normalizeTelegramPublicPostHref,
  parseNumericPostIdFromPermalink,
} from "@/lib/telegram-tm-post-media";
import { TELEGRAM_CHANNEL } from "@/services/telegram/parser";

export const runtime = "nodejs";

export const maxDuration = 60;

function channelSlugFromCanonical(href: string): string | null {
  try {
    const parts = new URL(href).pathname
      .replace(/^\/+|\/+$/g, "")
      .split("/")
      .filter(Boolean);
    if (parts.length < 2) return null;
    return parts[parts.length - 2] ?? null;
  } catch {
    return null;
  }
}

/** На CDN файли Telegram протухають — ставимо спереду ті URL, які щойно віддались із CDN. */
async function prioritizeReachablePosterUrls(
  urls: string[],
  maxProbe: number,
): Promise<string[]> {
  const head = urls.slice(0, maxProbe);
  const tail = urls.slice(maxProbe);
  const ok: string[] = [];
  const bad: string[] = [];
  for (const u of head) {
    const p = parseCachableImageUrl(u);
    if (!p) {
      bad.push(u);
      continue;
    }
    const loaded = await loadImageFromUpstream(p);
    if (loaded) ok.push(u);
    else bad.push(u);
  }
  return [...ok, ...bad, ...tail];
}

export async function POST(req: NextRequest) {
  let parsed: unknown;
  try {
    parsed = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const telegramPostRaw =
    typeof (parsed as { telegramPost?: unknown }).telegramPost === "string"
      ? (parsed as { telegramPost: string }).telegramPost
      : "";

  const canonical = normalizeTelegramPublicPostHref(telegramPostRaw.trim());
  if (!canonical) {
    return NextResponse.json({ error: "Invalid telegramPost" }, { status: 400 });
  }

  const slug = channelSlugFromCanonical(canonical);
  if (!slug || slug !== TELEGRAM_CHANNEL.username) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rawUrls = await fetchFreshPosterUrlsFromPublicPostPage(canonical);
  let urls = finalizePosterImageUrls(rawUrls).filter(
    (u) => !isRejectedStoredTelegramImageUrl(u),
  );
  urls = await prioritizeReachablePosterUrls(urls, 8);

  const postId = parseNumericPostIdFromPermalink(canonical);
  if (
    postId !== null &&
    urls.length > 0 &&
    isSupabaseConfigured()
  ) {
    void updateTelegramPostImages(postId, urls.slice(0, 24)).catch(() => {});
  }

  return NextResponse.json(
    { urls },
    {
      headers: { "Cache-Control": "private, max-age=600" },
    },
  );
}
