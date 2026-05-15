import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function isSupabaseAnonConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(),
  );
}

/**
 * Клієнт із anon key та cookies — сесія користувача (magic link тощо).
 * Не використовувати разом із service role.
 */
export async function createSupabaseAuthServerClient() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) {
    throw new Error(
      "Сесія Supabase: потрібні NEXT_PUBLIC_SUPABASE_URL та NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  return createServerClient(url, key, {
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
          /* set з Server Component або після генерації відповіді — ігноруємо */
        }
      },
    },
  });
}
