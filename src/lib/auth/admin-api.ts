import type { NextRequest } from "next/server";
import { createSupabaseAuthServerClient } from "@/lib/supabase/server-user";
import { isAllowedAdminEmail } from "@/lib/auth/admin-allowlist";

export async function getAdminActorFromCookies(): Promise<{
  email: string;
} | null> {
  try {
    const supabase = await createSupabaseAuthServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const email = user?.email ?? undefined;
    if (!email || !isAllowedAdminEmail(email)) return null;
    return { email };
  } catch {
    return null;
  }
}

/** Для Cron/CLI: авторизація за TELEGRAM_SYNC_SECRET. */
export function isTelegramSyncBearerAuthorized(req: NextRequest): boolean {
  const secret = process.env.TELEGRAM_SYNC_SECRET?.trim();
  if (!secret) return false;
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function canPostTelegramSync(req: NextRequest): Promise<boolean> {
  if (isTelegramSyncBearerAuthorized(req)) return true;
  const actor = await getAdminActorFromCookies();
  return actor !== null;
}
