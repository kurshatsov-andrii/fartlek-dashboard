"use client";

import { Flame, Github, Send, Twitter } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative mt-16 border-t border-white/5 pt-14 pb-24 lg:pb-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2">
            <a href="#" className="flex items-center gap-2.5 mb-3">
              <span className="grid place-items-center h-9 w-9 rounded-full bg-neon text-ink-950 shadow-neon-sm">
                <Flame className="h-5 w-5" strokeWidth={2.5} />
              </span>
              <div className="leading-tight">
                <div className="font-display text-base font-bold">Fartlek</div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-white/50">
                  Події 2026
                </div>
              </div>
            </a>
            <p className="text-sm text-white/55 max-w-sm">
              Дім українських спортивних подій. Відкривайте, змагайтеся та
              розвивайте спільноту бігунів, велосипедистів, плавців і
              триатлоністів.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <a
                href="https://t.me/fartlekua"
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 w-9 grid place-items-center rounded-full bg-white/5 border border-white/10 hover:border-neon/40 hover:bg-neon/10 transition-colors"
                aria-label="Telegram"
              >
                <Send className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="h-9 w-9 grid place-items-center rounded-full bg-white/5 border border-white/10 hover:border-neon/40 hover:bg-neon/10 transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="h-9 w-9 grid place-items-center rounded-full bg-white/5 border border-white/10 hover:border-neon/40 hover:bg-neon/10 transition-colors"
                aria-label="GitHub"
              >
                <Github className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-white/40 mb-3">
              Платформа
            </div>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#events" className="hover:text-neon transition-colors">
                  Події
                </a>
              </li>
              <li>
                <a href="#calendar" className="hover:text-neon transition-colors">
                  Календар
                </a>
              </li>
              <li>
                <a href="#map" className="hover:text-neon transition-colors">
                  Карта
                </a>
              </li>
              <li>
                <a href="#top" className="hover:text-neon transition-colors">
                  Топ та рейтинги
                </a>
              </li>
            </ul>
          </div>

          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-white/40 mb-3">
              Розробникам
            </div>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="/api/telegram"
                  className="hover:text-neon transition-colors"
                >
                  Публічне API
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white/40">
          <div>© 2026 Fartlek Events · Створено для українських атлетів</div>
          <div>Збудовано на Next.js 15 · Tailwind · Framer Motion · Recharts</div>
        </div>
      </div>
    </footer>
  );
}
