import type { Metadata } from "next";
import Link from "next/link";
import { AdminMagicLinkForm } from "@/components/admin/admin-magic-link-form";
import { isAdminGateConfigured } from "@/lib/auth/admin-allowlist";
import { sanitizeReturnPath } from "@/lib/auth/safe-return-path";
import { isSupabaseAnonConfigured } from "@/lib/supabase/server-user";

export const metadata: Metadata = {
  title: "Вхід адміністратора",
  robots: { index: false, follow: false },
};

const ERROR_TEXT: Record<string, string> = {
  config:
    "Сервер не налаштовано: потрібні NEXT_PUBLIC_SUPABASE_ANON_KEY та ADMIN_EMAIL_ALLOWLIST у .env.local.",
  forbidden: "Цей email не в списку адміністраторів.",
  no_code: "Не вдалося підтвердити вхід (немає коду). Спробуйте надіслати посилання знову.",
  auth: "Помилка авторизації Supabase.",
};

export default async function AdminLoginPage(props: {
  searchParams: Promise<{
    error?: string;
    detail?: string;
    next?: string;
  }>;
}) {
  const sp = await props.searchParams;
  const redirectPath = sanitizeReturnPath(sp.next ?? null);
  const gateOk = isAdminGateConfigured();
  const anonOk = isSupabaseAnonConfigured();
  const errKey = sp.error?.trim() ?? "";
  const errLine =
    errKey && ERROR_TEXT[errKey] ? ERROR_TEXT[errKey] : errKey ?
      "Сталася помилка входу."
    : null;
  const detail =
    typeof sp.detail === "string" && sp.detail.trim() ? sp.detail.trim() : null;

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center px-4 py-24">
      <div className="w-full max-w-md glass rounded-2xl border border-white/10 p-8 shadow-2xl shadow-black/50">
        <div className="mb-6 text-center">
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/40">
            Fartlek · Адмін
          </p>
          <h1 className="mt-2 font-display text-2xl font-bold">Вхід</h1>
          <p className="mt-1 text-sm text-white/55">
            Magic link надійде на вашу пошту (Supabase Auth).
          </p>
        </div>

        {(!gateOk || !anonOk) && (
          <div className="mb-5 rounded-xl border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-xs text-amber-100/95">
            Налаштуйте середовище:{" "}
            <code className="font-mono text-[11px]">NEXT_PUBLIC_SUPABASE_URL</code>
            {" · "}
            <code className="font-mono text-[11px]">
              NEXT_PUBLIC_SUPABASE_ANON_KEY
            </code>
            {" · "}
            <code className="font-mono text-[11px]">ADMIN_EMAIL_ALLOWLIST</code>
          </div>
        )}

        {errLine ? (
          <div className="mb-5 rounded-xl border border-rose-500/35 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
            {errLine}
            {detail && errKey === "auth" ? (
              <span className="mt-2 block font-mono text-[11px] text-white/65">
                {detail}
              </span>
            ) : null}
          </div>
        ) : null}

        <AdminMagicLinkForm
          redirectPath={redirectPath}
          gateConfigured={gateOk}
        />

        <p className="mt-6 text-center text-xs text-white/45">
          <Link href="/" className="text-neon hover:underline underline-offset-2">
            На головну дашборду
          </Link>
        </p>
      </div>
    </main>
  );
}
