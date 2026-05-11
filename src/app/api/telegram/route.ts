import { NextResponse } from "next/server";
import { importChannelEvents } from "@/services/telegram";

export const dynamic = "force-static";
export const revalidate = 600;

export async function GET() {
  const result = await importChannelEvents();
  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1800",
    },
  });
}
