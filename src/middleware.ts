import { type NextRequest } from "next/server";
import { middlewareSession } from "@/lib/supabase/middleware-session";

export async function middleware(request: NextRequest) {
  return middlewareSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
