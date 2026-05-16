"use client";

import Link from "next/link";
import { useEffect } from "react";

/** Помилка сегменту `/assistant`: показуємо текст замість «білого екрану». */
export default function AssistantErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[assistant]", error);
  }, [error]);

  return (
    <div className="glass rounded-2xl border border-rose-500/25 bg-rose-500/[0.07] p-6 text-white/90">
      <p className="font-display font-semibold text-white mb-2">
        Не вдалося відкрити чат асистента
      </p>
      <p className="text-sm text-white/60 mb-4">
        Спробуйте ще раз. Якщо після збірки з’явився неконсистентний кеш, виконайте{" "}
        <code className="text-xs bg-white/10 px-1.5 py-0.5 rounded">npm run clean</code>, потім{" "}
        <code className="text-xs bg-white/10 px-1.5 py-0.5 rounded">npm run dev</code>.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-full px-4 py-2 text-sm font-medium bg-neon text-ink-950 hover:bg-neon-400 transition-colors"
        >
          Повторити
        </button>
        <Link
          href="/"
          className="rounded-full px-4 py-2 text-sm font-medium border border-white/15 hover:bg-white/10 transition-colors"
        >
          На головну
        </Link>
      </div>
    </div>
  );
}
