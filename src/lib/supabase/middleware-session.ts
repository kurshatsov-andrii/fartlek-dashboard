import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  isAdminGateConfigured,
  isAllowedAdminEmail,
} from "@/lib/auth/admin-allowlist";
import { sanitizeReturnPath } from "@/lib/auth/safe-return-path";

function redirectPreservingCookies(
  request: NextRequest,
  pathnameWithSearch: string,
  refreshed: NextResponse,
): NextResponse {
  const target = new URL(pathnameWithSearch, request.url);
  const redirectResponse = NextResponse.redirect(target);
  refreshed.cookies.getAll().forEach((c) => {
    redirectResponse.cookies.set(c.name, c.value);
  });
  return redirectResponse;
}

export async function middlewareSession(
  request: NextRequest,
): Promise<NextResponse> {
  let refreshed = NextResponse.next({ request });

  const pathname = request.nextUrl.pathname;
  const isAdminLogin =
    pathname === "/admin/login" || pathname.startsWith("/admin/login/");
  const isAdminAreaExclusive =
    (pathname === "/admin" || pathname.startsWith("/admin/")) && !isAdminLogin;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!(url && anon)) {
    if (isAdminAreaExclusive || isAdminLogin) {
      return NextResponse.redirect(
        new URL("/admin/login?error=config", request.url),
      );
    }
    return refreshed;
  }

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        refreshed = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          refreshed.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  /** Callback обмінює код у route.ts — без allowlist тут не блокуємо. */
  if (isAdminAreaExclusive || isAdminLogin) {
    if (!isAdminGateConfigured()) {
      return redirectPreservingCookies(
        request,
        "/admin/login?error=config",
        refreshed,
      );
    }
  }

  if (isAdminAreaExclusive) {
    if (!user) {
      const loginUrl = `/admin/login?next=${encodeURIComponent(
        sanitizeReturnPath(`${pathname}${request.nextUrl.search}`),
      )}`;
      return redirectPreservingCookies(request, loginUrl, refreshed);
    }
    if (!isAllowedAdminEmail(user.email)) {
      return redirectPreservingCookies(
        request,
        "/admin/login?error=forbidden",
        refreshed,
      );
    }
  }

  if (isAdminLogin && user && isAllowedAdminEmail(user.email)) {
    const next = sanitizeReturnPath(request.nextUrl.searchParams.get("next"));
    return redirectPreservingCookies(request, next, refreshed);
  }

  return refreshed;
}
