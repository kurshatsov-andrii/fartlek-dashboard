"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  Backpack,
  Bot,
  CalendarDays,
  Gauge,
  Loader2,
  Send,
  Utensils,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ChatRole = "user" | "assistant";

export type ChatTurn = { role: ChatRole; content: string };

const QUICK_PROMPTS: {
  id: string;
  label: string;
  icon: typeof CalendarDays;
  text: string;
}[] = [
  {
    id: "runs",
    label: "Список забігів",
    icon: CalendarDays,
    text: "Порадь старти з календаря Fartlek, які могли б підійти.",
  },
  {
    id: "pace",
    label: "Темп і час",
    icon: Gauge,
    text: "Допоможи розрахувати темп і орієнтовний час на дистанції.",
  },
  {
    id: "nutrition",
    label: "Харчування",
    icon: Utensils,
    text: "Харчування для забігів (перед стартом і на дистанції).",
  },
  {
    id: "gear",
    label: "Спорядження",
    icon: Backpack,
    text: "Спорядження для забігу або трейлу.",
  },
];

function AssistantMarkdown({ source }: { source: string }) {
  return (
    <ReactMarkdown
      components={{
        a: ({ href, children, ...props }) => (
          <a
            {...props}
            href={href}
            className="font-medium text-neon hover:text-neon-300 underline underline-offset-2 break-words"
            target="_blank"
            rel="noopener noreferrer"
          >
            {children}
          </a>
        ),
        p: ({ children }) => (
          <p className="mb-2 last:mb-0 whitespace-normal">{children}</p>
        ),
        ul: ({ children }) => (
          <ul className="mb-2 last:mb-0 list-disc pl-4 space-y-1 whitespace-normal">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-2 last:mb-0 list-decimal pl-4 space-y-1 whitespace-normal">
            {children}
          </ol>
        ),
        li: ({ children }) => <li className="whitespace-normal">{children}</li>,
        strong: ({ children }) => (
          <strong className="font-semibold text-white">{children}</strong>
        ),
      }}
    >
      {source}
    </ReactMarkdown>
  );
}

export function FartlekAssistantChat() {
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, error]);

  const send = useCallback(
    async (preset?: string) => {
      const text = (preset ?? input).trim();
      if (!text || loading) return;

      setInput("");
      setError(null);
      const next: ChatTurn[] = [...messages, { role: "user", content: text }];
      setMessages(next);
      setLoading(true);

      try {
        const res = await fetch("/api/assistant/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: next,
            clientOrigin:
              typeof window !== "undefined" ? window.location.origin : undefined,
          }),
        });
        const data = (await res.json()) as { message?: string; error?: string };

        if (!res.ok) {
          setError(data.error ?? "Помилка сервера.");
          return;
        }

        const reply = (data.message ?? "").trim();
        setMessages([...next, { role: "assistant", content: reply || "…" }]);
      } catch {
        setError("Не вдалося надіслати повідомлення. Перевірте з’єднання.");
      } finally {
        setLoading(false);
      }
    },
    [input, loading, messages],
  );

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  };

  return (
    <div className="glass rounded-2xl border border-white/10 p-4 md:p-6 flex flex-col min-h-[min(70dvh,640px)] max-h-[min(75dvh,720px)]">
      <div className="flex items-center gap-3 pb-4 border-b border-white/10 shrink-0">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-neon/15 text-neon border border-neon/30">
          <Bot className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <h1 className="font-display text-lg font-semibold text-white">
            Fartlek AI
          </h1>
          <p className="text-xs text-white/50 mt-0.5">
            Спортивний асистент · лише українською · сесійна пам’ять
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 min-h-[200px]">
        {messages.length === 0 && !loading && (
          <p className="text-sm text-white/55 leading-relaxed">
            Нижче — швидкі питання, або впишіть свій текст. Спочатку консультують із
            коротких уточнень про дистанцію/місто/умови, потім підкажуть по календарю,
            темпу, харчуванню чи спорядженню (без медичних діагнозів і тем поза спортом).
          </p>
        )}

        {messages.map((m, i) => (
          <div
            key={`${m.role}-${i}-${m.content.slice(0, 24)}`}
            className={cn(
              "flex",
              m.role === "user" ? "justify-end" : "justify-start",
            )}
          >
            <div
              className={cn(
                "max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                m.role === "user"
                  ? "bg-neon/20 text-white border border-neon/35 whitespace-pre-wrap"
                  : "bg-white/[0.06] text-white/90 border border-white/10",
              )}
            >
              {m.role === "assistant" ? (
                <AssistantMarkdown source={m.content} />
              ) : (
                m.content
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm text-white/55 bg-white/[0.04] border border-white/10">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Готую відповідь…
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {error && (
        <div
          className="mb-3 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-100/95"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="flex flex-col shrink-0 pt-3 space-y-3 border-t border-white/10">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-white/40 mb-2">
            Швидкі питання
          </p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Швидкі питання">
            {QUICK_PROMPTS.map((q) => {
              const Icon = q.icon;
              return (
                <button
                  key={q.id}
                  type="button"
                  disabled={loading}
                  onClick={() => void send(q.text)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium",
                    "bg-white/[0.06] border border-white/12 text-white/90",
                    "hover:bg-neon/[0.12] hover:border-neon/35 transition-colors",
                    "touch-manipulation min-h-[40px]",
                    loading && "opacity-45 cursor-not-allowed pointer-events-none",
                  )}
                  aria-label={q.label}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0 text-neon" aria-hidden />
                  {q.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
          <label className="sr-only" htmlFor="fartlek-assistant-input">
            Повідомлення асистенту
          </label>
          <textarea
            id="fartlek-assistant-input"
            rows={3}
            value={input}
            disabled={loading}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Напишіть запит… (Enter — надіслати, Shift+Enter — новий рядок)"
            className={cn(
              "flex-1 w-full min-h-[88px] rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white",
              "placeholder:text-white/35 resize-y focus:outline-none focus:ring-2 focus:ring-neon/40 focus:border-neon/55",
              loading && "opacity-60 cursor-not-allowed",
            )}
          />
          <Button
            type="button"
            size="lg"
            className="sm:self-stretch sm:min-w-[120px]"
            onClick={() => void send()}
            disabled={loading || !input.trim()}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
            Надіслати
          </Button>
        </div>
      </div>
    </div>
  );
}
