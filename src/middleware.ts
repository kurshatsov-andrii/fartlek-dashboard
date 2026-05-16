import { type NextRequest } from "next/server";
import { middlewareSession } from "@/lib/supabase/middleware-session";

export async function middleware(request: NextRequest) {
  return middlewareSession(request);
}

export const config = {
  matcher: [
    /**
     * Публічний проксі обкладинок: без Supabase session на кожен thumbnail,
     * інакше на Vercel легко отримувати обриви/повільні відповіді.
     */
    "/((?!_next/static|_next/image|favicon.ico|api/event-image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
