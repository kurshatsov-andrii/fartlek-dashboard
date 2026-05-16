import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { FartlekSocialIconButtons } from "@/components/layout/fartlek-social-icon-buttons";
import {
  FARTLEK_FACEBOOK_GROUP_URL,
  FARTLEK_FOUNDER_TELEGRAM_URL,
  FARTLEK_INSTAGRAM_URL,
  FARTLEK_MAIN_WEBSITE_URL,
  FARTLEK_PUBLIC_TELEGRAM_URL,
  FARTLEK_REGISTRATION_APP_URL,
} from "@/lib/fartlek-social-urls";

export const metadata: Metadata = {
  title: "Контакти",
  description:
    "Контакти команди Фартлек: соціальні мережі, сайт афіші, платформа реєстрації та особистий Telegram засновника Андрія Куршацова.",
  openGraph: {
    title: "Контакти — Fartlek",
    description:
      "Telegram, Instagram, Facebook, офіційний сайт, реєстрація на події та особистий контакт засновника.",
    locale: "uk_UA",
  },
};

const CONTACT_ROWS: readonly {
  label: string;
  hint: string;
  href: string;
}[] = [
  {
    label: "Telegram (канал)",
    hint: "Основні анонси стартів: @fartlekua.",
    href: FARTLEK_PUBLIC_TELEGRAM_URL,
  },
  {
    label: "Instagram",
    hint: "@fartlekua",
    href: FARTLEK_INSTAGRAM_URL,
  },
  {
    label: "Facebook",
    hint: "Спільнота організаторів і учасників.",
    href: FARTLEK_FACEBOOK_GROUP_URL,
  },
  {
    label: "Сайт афіші",
    hint: "Інформація про формати й календар на fartlek.com.ua.",
    href: FARTLEK_MAIN_WEBSITE_URL,
  },
  {
    label: "Платформа реєстрації",
    hint: "Реєстрація на спортивні події в Україні.",
    href: FARTLEK_REGISTRATION_APP_URL,
  },
];

export default function ContactsPage() {
  return (
    <>
      <Navbar />
      <main className="relative min-h-screen pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pb-12 pt-[calc(5.5rem+env(safe-area-inset-top))] md:pt-[calc(6rem+env(safe-area-inset-top))]">
        <div className="container mx-auto px-4 max-w-2xl">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-medium text-white/55 hover:text-neon transition-colors mb-6"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            На головну
          </Link>

          <header className="mb-10">
            <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-neon">
              Звʼязок
            </div>
            <h1 className="mt-2 font-display text-3xl md:text-[2rem] font-bold tracking-tight text-white">
              Контакти
            </h1>
            <p className="mt-3 text-sm text-white/55 leading-relaxed">
              Офіційні канали Fartlek: підпишіться на канал у Telegram або
              оберіть зручну платформу в списку нижче. Для ексклюзивних питань
              можете написати засновнику особистим повідомленням.
            </p>
          </header>

          <section className="glass rounded-2xl border border-white/10 p-6 md:p-8 mb-6">
            <h2 className="font-display text-lg font-semibold text-white mb-4">
              Соціальні мережі й ресурси
            </h2>
            <p className="text-xs text-white/45 mb-4">
              Ті самі посилання та іконки, що в підвалі сайту на кожній сторінці:
            </p>
            <FartlekSocialIconButtons />

            <ul className="mt-8 space-y-4">
              {CONTACT_ROWS.map((row) => (
                <li
                  key={row.href}
                  className="border-t border-white/5 first:border-0 first:pt-0 pt-4 first:mt-0"
                >
                  <a
                    href={row.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block"
                  >
                    <span className="font-medium text-neon group-hover:text-neon-400 group-hover:underline underline-offset-4">
                      {row.label}
                    </span>
                    <span className="hidden sm:inline text-white/35 mx-2">·</span>
                    <span className="block sm:inline text-sm text-white/50 mt-0.5 sm:mt-0">
                      {row.hint}
                    </span>
                  </a>
                  <span className="block font-mono text-[11px] text-white/30 mt-1.5 truncate">
                    {row.href}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="glass rounded-2xl border border-neon/20 bg-neon/[0.06] p-6 md:p-8">
            <h2 className="font-display text-lg font-semibold text-white mb-3">
              Засновник Fartlek
            </h2>
            <p className="text-white font-medium">
              Куршацов Андрій
            </p>
            <p className="mt-3 text-sm text-white/55 leading-relaxed">
              Особистий Telegram для прямої комунікації щодо співпраці, розміщення
              події та некомерційних питань:
            </p>
            <a
              href={FARTLEK_FOUNDER_TELEGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2.5 bg-neon/15 border border-neon/35 text-sm font-semibold text-neon hover:bg-neon/25 transition-colors"
            >
              <Send className="h-4 w-4 shrink-0" aria-hidden />
              @Andres_K — написати в Telegram
            </a>
          </section>
        </div>
      </main>
      <Footer />
      <MobileBottomNav />
    </>
  );
}
