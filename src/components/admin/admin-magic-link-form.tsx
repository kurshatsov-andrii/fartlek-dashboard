"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";

function clientAuthReady(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(),
  );
}

/** Canonical site origin for magic-link redirects (Vercel / prod). Falls back to browser origin. */
function authRedirectOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const fromEnv = raw ? raw.replace(/\/$/, "") : "";
  if (fromEnv) return fromEnv;
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

type LoginFormProps = {
  redirectPath: string;
  gateConfigured: boolean;
};

export function AdminMagicLinkForm({
  redirectPath,
  gateConfigured,
}: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<{
    tone: "idle" | "ok" | "err";
    text: string;
  }>({ tone: "idle", text: "" });
  const [busy, setBusy] = useState(false);
  const authReady = clientAuthReady();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      setStatus({ tone: "err", text: "Введіть email." });
      return;
    }

    setBusy(true);
    setStatus({ tone: "idle", text: "" });

    try {
      if (!authReady) {
        setStatus({
          tone: "err",
          text: "Не налаштовано Supabase anon key на клієнті.",
        });
        return;
      }
      if (!gateConfigured) {
        setStatus({
          tone: "err",
          text: "На сервері не задано ADMIN_EMAIL_ALLOWLIST.",
        });
        return;
      }

      const supabase = createSupabaseBrowserClient();
      const nextEnc = encodeURIComponent(redirectPath);
      const origin = authRedirectOrigin();
      if (!origin) {
        setStatus({
          tone: "err",
          text: "Не вдалося визначити адресу сайту для посилання входу.",
        });
        return;
      }
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: {
          emailRedirectTo: `${origin}/auth/callback?next=${nextEnc}`,
        },
      });
      if (error) {
        setStatus({ tone: "err", text: error.message });
        return;
      }
      setStatus({
        tone: "ok",
        text: "Посилання надіслано на пошту. Перевірте вхідні та спам.",
      });
    } catch {
      setStatus({ tone: "err", text: "Помилка відправки. Спробуйте ще раз." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label
          htmlFor="admin-email"
          className="block text-xs font-mono uppercase tracking-widest text-white/45 mb-2"
        >
          Email адміністратора
        </label>
        <input
          id="admin-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(ev) => setEmail(ev.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm outline-none placeholder:text-white/35 focus:border-neon/55 focus:ring-1 focus:ring-neon/35"
          disabled={busy}
        />
      </div>

      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? "Надсилаємо…" : "Надіслати magic link"}
      </Button>

      {status.tone !== "idle" ? (
        <p
          className={
            status.tone === "ok"
              ? "text-xs text-neon"
              : "text-xs text-rose-300"
          }
        >
          {status.text}
        </p>
      ) : null}
    </form>
  );
}
