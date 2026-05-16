"use client";

import dynamic from "next/dynamic";

/** Рендер чату лише на клієнті — уникає проблем SSR/чанків з react-markdown у деяких середовищах. */
const FartlekAssistantChatClient = dynamic(
  () =>
    import("./fartlek-assistant-chat").then((m) => ({
      default: m.FartlekAssistantChat,
    })),
  {
    ssr: false,
    loading: () => (
      <div
        className="glass rounded-2xl border border-white/10 p-8 min-h-[min(70dvh,640px)] flex flex-col items-center justify-center gap-3 text-white/55 text-sm"
        aria-busy="true"
        aria-label="Завантаження чату"
      >
        <span className="inline-block h-8 w-8 rounded-full border-2 border-neon/30 border-t-neon animate-spin" />
        Завантажуємо Fartlek AI…
      </div>
    ),
  },
);

export function AssistantChatClientShell() {
  return <FartlekAssistantChatClient />;
}
