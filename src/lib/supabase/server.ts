import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _admin: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
  );
}

/**
 * Серверний клієнт з service role для upsert/sync. Ніколи не імпортувати у клієнтські компоненти.
 */
export function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url?.trim() || !key?.trim()) {
    throw new Error(
      "Supabase не налаштовано: задайте NEXT_PUBLIC_SUPABASE_URL та SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
  if (!_admin) {
    _admin = createClient(url.trim(), key.trim(), {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return _admin;
}
