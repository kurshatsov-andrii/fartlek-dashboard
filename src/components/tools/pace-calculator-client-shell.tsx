"use client";

import dynamic from "next/dynamic";

/** Клієнтське підвантаження — як і чат асистента, уникає зламаних webpack-чанків у девелі. */
const PaceCalculatorEmbeddedClient = dynamic(
  () =>
    import("./pace-calculator").then((m) => ({
      default: function PaceEmbedded() {
        return <m.PaceCalculatorWidget variant="embedded" />;
      },
    })),
  {
    ssr: false,
    loading: () => (
      <div
        className="glass rounded-2xl border border-white/10 p-8 min-h-[280px] flex flex-col items-center justify-center gap-3 text-white/55 text-sm"
        aria-busy="true"
        aria-label="Завантаження калькулятора темпу"
      >
        <span className="inline-block h-8 w-8 rounded-full border-2 border-neon/30 border-t-neon animate-spin" />
        Завантажуємо калькулятор…
      </div>
    ),
  },
);

export function PaceCalculatorEmbeddedClientShell() {
  return <PaceCalculatorEmbeddedClient />;
}
