import { NextRequest, NextResponse } from "next/server";

import {
  eventImageCacheKey,
  readEventImageCache,
  writeEventImageCache,
} from "@/lib/event-image-cache";
import {
  isAllowedImageHost,
  loadImageFromUpstream,
  parseCachableImageUrl,
} from "@/lib/event-image-pipeline";
import { updateTelegramPostImages } from "@/lib/telegram-db";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import {
  fetchFreshPosterUrlsFromPublicPostPage,
  normalizeTelegramPublicPostHref,
  parseNumericPostIdFromPermalink,
} from "@/lib/telegram-tm-post-media";

export const runtime = "nodejs";

export const maxDuration = 60;

function validateTarget(raw: string | null): URL | NextResponse {
  if (!raw?.trim()) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }
  let target: URL;
  try {
    target = new URL(raw.trim());
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }
  if (target.protocol !== "https:" && target.protocol !== "http:") {
    return NextResponse.json({ error: "Invalid protocol" }, { status: 400 });
  }
  if (!isAllowedImageHost(target.hostname)) {
    return NextResponse.json({ error: "Host not allowed" }, { status: 403 });
  }
  return target;
}

function sanitizeTelegramPost(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  return normalizeTelegramPublicPostHref(raw.trim());
}

function responseFromCached(cached: { body: Uint8Array; contentType: string }) {
  return new NextResponse(Buffer.from(cached.body), {
    status: 200,
    headers: {
      "Content-Type": cached.contentType,
      "Cache-Control":
        "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}

function responseFromLoaded(buf: Uint8Array, contentType: string) {
  return new NextResponse(Buffer.from(buf), {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control":
        "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}

async function tryLoad(remoteUrl: URL): Promise<NextResponse | null> {
  const cacheKey = eventImageCacheKey(remoteUrl.toString());
  const cached = await readEventImageCache(cacheKey);
  if (cached) return responseFromCached(cached);

  const loaded = await loadImageFromUpstream(remoteUrl);
  if (!loaded) return null;

  await writeEventImageCache(cacheKey, loaded.buf, loaded.contentType);
  return responseFromLoaded(loaded.buf, loaded.contentType);
}

async function pipeImage(
  remoteUrl: URL,
  opts: { telegramPostHref: string | null },
): Promise<NextResponse> {
  let res = await tryLoad(remoteUrl);

  /** Застарілі file-URL з Telegram CDN (404/HTML) → знімаємо актуальні посилання з t.me/channel/NNN */
  if (!res && opts.telegramPostHref) {
    const canonical = sanitizeTelegramPost(opts.telegramPostHref);
    const postId =
      canonical != null ? parseNumericPostIdFromPermalink(canonical) : null;
    const freshList = canonical
      ? await fetchFreshPosterUrlsFromPublicPostPage(canonical)
      : [];

    for (const cand of freshList) {
      const u = parseCachableImageUrl(cand);
      if (!u) continue;
      res = await tryLoad(u);
      if (
        res &&
        postId !== null &&
        freshList.length > 0 &&
        isSupabaseConfigured()
      ) {
        void updateTelegramPostImages(postId, freshList.slice(0, 24)).catch(
          () => {},
        );
      }
      if (res) break;
    }
  }

  if (!res) {
    console.warn("[api/event-image] upstream failed", remoteUrl.hostname);
    return NextResponse.json({ error: "Upstream error" }, { status: 502 });
  }
  return res;
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("url");
  const vt = validateTarget(raw);
  if (vt instanceof NextResponse) return vt;

  const tgRaw =
    req.nextUrl.searchParams.get("telegramPost") ??
    req.nextUrl.searchParams.get("telegram_post");
  return pipeImage(vt, { telegramPostHref: sanitizeTelegramPost(tgRaw) });
}

export async function POST(req: NextRequest) {
  let parsed: unknown;
  try {
    parsed = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  type Body = {
    url?: unknown;
    telegramPost?: unknown;
  };
  const body = parsed as Body;
  const raw = typeof body.url === "string" ? body.url : null;
  const tgRaw =
    typeof body.telegramPost === "string" ? body.telegramPost : null;

  const vt = validateTarget(raw);
  if (vt instanceof NextResponse) return vt;

  const tgHref = tgRaw ? sanitizeTelegramPost(tgRaw) : null;
  return pipeImage(vt, { telegramPostHref: tgHref ?? null });
}
