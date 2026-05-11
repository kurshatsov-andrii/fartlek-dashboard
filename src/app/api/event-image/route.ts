import { NextRequest, NextResponse } from "next/server";

const ALLOWED_HOSTS = new Set(["telegraph.controller.bot"]);

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
  if (bytes.length >= 6 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
    return "image/gif";
  }
  if (bytes.length >= 12 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
    const sig = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
    if (sig === "WEBP") return "image/webp";
  }
  return "image/jpeg";
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("url");
  if (!raw) {
    return new NextResponse("Missing url", { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return new NextResponse("Invalid url", { status: 400 });
  }

  if (target.protocol !== "https:" && target.protocol !== "http:") {
    return new NextResponse("Invalid protocol", { status: 400 });
  }
  if (!ALLOWED_HOSTS.has(target.hostname)) {
    return new NextResponse("Host not allowed", { status: 403 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(target.toString(), {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; FartlekEvents/1.0)",
        Accept: "image/avif,image/webp,image/*,*/*;q=0.8",
      },
      next: { revalidate: 86_400 },
    });
  } catch (err) {
    console.error("[api/event-image] fetch error", err);
    return new NextResponse("Upstream fetch failed", { status: 502 });
  }

  if (!upstream.ok) {
    return new NextResponse("Upstream error", { status: 502 });
  }

  const buf = new Uint8Array(await upstream.arrayBuffer());
  if (buf.byteLength === 0) {
    return new NextResponse("Empty body", { status: 502 });
  }

  const contentType = sniffContentType(buf.subarray(0, 16));

  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
