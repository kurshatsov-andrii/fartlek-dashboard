"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame,
  Heart,
  Menu,
  Plus,
  Search as SearchIcon,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/components/providers/favorites-provider";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "#events", label: "Події" },
  { href: "#stats", label: "Статистика" },
  { href: "#calendar", label: "Календар" },
  { href: "#map", label: "Карта" },
  { href: "#top", label: "Топ" },
  { href: "#admin", label: "Адмін" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { count } = useFavorites();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToSearch = () => {
    const el = document.getElementById("search");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    setMobileOpen(false);
  };

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled ? "py-2" : "py-4",
      )}
    >
      <div className="container mx-auto px-4">
        <div
          className={cn(
            "flex items-center justify-between gap-4 rounded-full px-4 md:px-6 py-2.5 transition-all duration-300",
            scrolled
              ? "glass-strong shadow-xl shadow-black/20"
              : "bg-transparent",
          )}
        >
          <a href="#" className="flex items-center gap-2.5 group">
            <span className="relative grid place-items-center h-9 w-9 rounded-full bg-neon text-ink-950 shadow-neon-sm transition-transform group-hover:scale-110">
              <Flame className="h-5 w-5" strokeWidth={2.5} />
              <span className="absolute -inset-0.5 rounded-full bg-neon opacity-40 blur-md -z-10" />
            </span>
            <div className="leading-tight">
              <div className="font-display text-base font-bold">Fartlek</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-white/50 light:text-black/50">
                Події 2026
              </div>
            </div>
          </a>

          <nav className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="px-3 py-1.5 rounded-full text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors light:text-black/70 light:hover:text-black light:hover:bg-black/5"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={scrollToSearch}
              className="hidden md:inline-flex items-center gap-2 h-9 px-3.5 rounded-full bg-white/5 border border-white/10 text-sm text-white/60 hover:text-white hover:bg-white/10 transition-colors light:bg-black/5 light:border-black/10 light:text-black/60 light:hover:text-black"
              aria-label="Пошук подій"
            >
              <SearchIcon className="h-4 w-4" />
              <span>Пошук...</span>
              <kbd className="ml-2 hidden xl:inline-flex h-5 px-1.5 rounded items-center text-[10px] bg-white/5 border border-white/10">
                ⌘K
              </kbd>
            </button>

            <a
              href="#favorites"
              className="relative hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/5 border border-white/10 hover:border-neon/40 hover:bg-neon/10 transition-colors light:bg-black/5 light:border-black/10"
              aria-label="Обране"
            >
              <Heart className="h-4 w-4" />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 grid place-items-center rounded-full bg-neon text-ink-950 text-[10px] font-bold">
                  {count}
                </span>
              )}
            </a>

            <Button
              size="sm"
              className="hidden md:inline-flex"
              onClick={() => {
                document
                  .getElementById("admin")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <Plus className="h-4 w-4" />
              Додати подію
            </Button>

            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="lg:hidden h-9 w-9 inline-flex items-center justify-center rounded-full bg-white/5 border border-white/10 light:bg-black/5 light:border-black/10"
              aria-label="Меню"
            >
              {mobileOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.nav
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden mt-2 glass-strong rounded-2xl p-3 flex flex-col gap-1"
            >
              {NAV_LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm text-white/80 hover:text-white hover:bg-white/5 light:text-black/80 light:hover:text-black light:hover:bg-black/5"
                >
                  {l.label}
                </a>
              ))}
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
}
