import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  isAdminGateConfigured,
  isAllowedAdminEmail,
} from "@/lib/auth/admin-allowlist";
import { sanitizeReturnPath } from "@/lib/auth/safe-return-path";

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");

  const base = `${url.origin}`;

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  ) {
    return NextResponse.redirect(`${base}/admin/login?error=config`);
  }

  if (!isAdminGateConfigured()) {
    return NextResponse.redirect(`${base}/admin/login?error=config`);
  }

  const nextPath = sanitizeReturnPath(url.searchParams.get("next"));

  if (!code) {
    const authErr =
      url.searchParams.get("error_description") ??
      url.searchParams.get("error");
    if (authErr) {
      return NextResponse.redirect(
        `${base}/admin/login?error=auth&detail=${encodeURIComponent(authErr)}`,
      );
    }
    return NextResponse.redirect(`${base}/admin/login?error=no_code`);
  }

  const cookieStore = await cookies();

  const response = NextResponse.redirect(new URL(nextPath, url.origin));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!.trim();
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim();

  const supabase = createServerClient(supabaseUrl, supabaseAnon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          /* ignore — не завжди дозволено писати cookies */
        }
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { error: exchangeErr } =
    await supabase.auth.exchangeCodeForSession(code);
  if (exchangeErr) {
    return NextResponse.redirect(
      `${base}/admin/login?error=auth&detail=${encodeURIComponent(exchangeErr.message)}`,
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isAllowedAdminEmail(user?.email)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${base}/admin/login?error=forbidden`);
  }

  return response;
}
