import { NextResponse } from "next/server";
import { getAdminActorFromCookies } from "@/lib/auth/admin-api";

export async function GET() {
  const actor = await getAdminActorFromCookies();
  return NextResponse.json({ admin: actor !== null });
}
