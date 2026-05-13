import { NextRequest, NextResponse } from "next/server";

import {
  eventImageCacheKey,
  readEventImageCache,
  writeEventImageCache,
} from "@/lib/event-image-cache";
import {
  isAllowedImageHost,
  loadImageFromUpstream,
} from "@/lib/event-image-pipeline";

export const runtime = "nodejs";

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

async function pipeImage(remoteUrl: URL): Promise<NextResponse> {
  const cacheKey = eventImageCacheKey(remoteUrl.toString());
  const cached = await readEventImageCache(cacheKey);
  if (cached) {
    return new NextResponse(Buffer.from(cached.body), {
      status: 200,
      headers: {
        "Content-Type": cached.contentType,
        "Cache-Control":
          "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  }

  const loaded = await loadImageFromUpstream(remoteUrl);
  if (!loaded) {
    console.warn("[api/event-image] upstream failed", remoteUrl.hostname);
    return NextResponse.json({ error: "Upstream error" }, { status: 502 });
  }

  await writeEventImageCache(cacheKey, loaded.buf, loaded.contentType);

  return new NextResponse(Buffer.from(loaded.buf), {
    status: 200,
    headers: {
      "Content-Type": loaded.contentType,
      "Cache-Control":
        "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("url");
  const vt = validateTarget(raw);
  if (vt instanceof NextResponse) return vt;
  return pipeImage(vt);
}

export async function POST(req: NextRequest) {
  let parsed: unknown;
  try {
    parsed = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const raw =
    typeof parsed === "object" &&
    parsed !== null &&
    "url" in parsed &&
    typeof (parsed as { url: unknown }).url === "string"
      ? (parsed as { url: string }).url
      : null;

  const vt = validateTarget(raw);
  if (vt instanceof NextResponse) return vt;
  return pipeImage(vt);
}
