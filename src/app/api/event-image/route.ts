import { NextRequest, NextResponse } from "next/server";

import { TELEGRAM_CHANNEL } from "@/services/telegram/parser";

const CHROME_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

export const runtime = "nodejs";

function isAllowedImageHost(hostname: string): boolean {
  if (hostname === "telegraph.controller.bot") return true;
  return (
    /\.telesco\.pe$/i.test(hostname) || /\.cdn-telegram\.org$/i.test(hostname)
  );
}

function bodyLooksLikeHtml(bytes: Uint8Array): boolean {
  const head = new TextDecoder("utf-8", { fatal: false }).decode(
    bytes.slice(0, Math.min(bytes.length, 256)),
  );
  const t = head.trimStart().toLowerCase();
  return t.startsWith("<!doctype") || t.startsWith("<html") || t.startsWith("<!");
}

function sniffContentType(bytes: Uint8Array): string {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "image/png";
  }
  if (
    bytes.length >= 6 &&
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46
  ) {
    return "image/gif";
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46
  ) {
    const sig = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
    if (sig === "WEBP") return "image/webp";
  }
  if (
    bytes.length >= 12 &&
    bytes[4] === 0x66 &&
    bytes[5] === 0x74 &&
    bytes[6] === 0x79 &&
    bytes[7] === 0x70
  ) {
    return "image/avif";
  }
  return "image/jpeg";
}

function pickContentType(upstream: Response, buf: Uint8Array): string {
  const raw = upstream.headers.get("content-type");
  const base = raw?.split(";")[0].trim().toLowerCase();

  if (bodyLooksLikeHtml(buf)) {
    return "";
  }

  if (base && base.startsWith("image/")) {
    if (base === "image/jpeg") {
      if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xd8) return base;
    } else return base.split(";")[0].trim();
  }
  return sniffContentType(buf);
}

function validateTarget(raw: string | null): URL | NextResponse | null {
  if (!raw || !raw.trim()) {
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

async function fetchFromTelegramCdn(remote: string): Promise<Response> {
  const previewReferer = `${TELEGRAM_CHANNEL.previewUrl}/`;
  const headerSets: Record<string, string>[] = [
    {
      Referer: previewReferer,
      Accept:
        "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      "Accept-Language": "uk-UA,uk;q=0.9,en;q=0.8",
    },
    {
      Referer: "https://t.me/",
      Accept: "image/avif,image/webp,image/*,*/*;q=0.8",
    },
    { Referer: "https://telegram.org/", Accept: "*/*" },
    { Accept: "*/*" },
  ];

  let last: Response | null = null;
  for (const extra of headerSets) {
    const upstream = await fetch(remote, {
      headers: {
        "User-Agent": CHROME_UA,
        ...extra,
      },
      cache: "no-store",
    });
    last = upstream;
    if (upstream.ok) return upstream;
  }
  return last ?? new Response("Upstream failed", { status: 502 });
}

async function pipeImage(remoteUrl: URL): Promise<NextResponse> {
  let upstream: Response;
  try {
    upstream = await fetchFromTelegramCdn(remoteUrl.toString());
  } catch (err) {
    console.error("[api/event-image] fetch error", err);
    return NextResponse.json(
      { error: "Upstream fetch failed" },
      { status: 502 },
    );
  }

  if (!upstream.ok) {
    console.warn(
      "[api/event-image] upstream HTTP",
      upstream.status,
      remoteUrl.hostname,
    );
    return NextResponse.json({ error: "Upstream error" }, { status: 502 });
  }

  const buf = new Uint8Array(await upstream.arrayBuffer());
  if (buf.byteLength === 0) {
    return NextResponse.json({ error: "Empty body" }, { status: 502 });
  }

  const contentType = pickContentType(upstream, buf);
  if (!contentType) {
    console.warn("[api/event-image] not image body", remoteUrl.hostname);
    return NextResponse.json({ error: "Not an image" }, { status: 502 });
  }

  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control":
        "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("url");
  const vt = validateTarget(raw);
  if (vt instanceof NextResponse) return vt;
  return pipeImage(vt as URL);
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
  return pipeImage(vt as URL);
}
