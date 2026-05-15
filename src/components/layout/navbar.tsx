"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Flame,
  Heart,
  Menu,
  Search as SearchIcon,
  Shield,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFavorites } from "@/components/providers/favorites-provider";

/** Секції публічного сайту (`/#…`). */
const USER_SITE_NAV = [
  { hash: "#events", label: "Події" },
  { hash: "#calendar", label: "Календар" },
  { hash: "#map", label: "Карта" },
  { hash: "#top", label: "Топ" },
] as const;

/** Якорі всередині `/admin`. */
const ADMIN_PANEL_NAV = [
  { id: "admin-dashboard", label: "Дашборд" },
  { id: "charts", label: "Інсайти" },
  { id: "stats", label: "Статистика" },
  { id: "quick-add-event", label: "Додати подію" },
] as const;

/** `/#events`, `/#calendar`, … */
function userSiteHref(hash: string): string {
  if (!hash.startsWith("#")) return hash;
  return `/${hash}`;
}

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const { count } = useFavorites();

  const isAdminLogin = pathname.startsWith("/admin/login");
  const isAdminDashboard = pathname.startsWith("/admin") && !isAdminLogin;
  const showVisitorAdminPortal = !isAdminDashboard;

  useEffect(() => {
    if (!showVisitorAdminPortal) {
      setIsAdminLoggedIn(false);
      return;
    }
    let cancelled = false;
    fetch("/api/auth/admin-session", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((d: { admin?: boolean }) => {
        if (!cancelled) setIsAdminLoggedIn(Boolean(d.admin));
      })
      .catch(() => {
        if (!cancelled) setIsAdminLoggedIn(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pathname, showVisitorAdminPortal]);

  const scrollToHomeSection = (hashWithHash: string) => {
    if (pathname !== "/") return false;
    const id = hashWithHash.replace(/^#/, "");
    const el = document.getElementById(id);
    if (!el) return false;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    return true;
  };

  const scrollAdminPanelSection = (elementId: string) => {
    document.getElementById(elementId)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const userSiteNavClick = (hash: string) => (e: React.MouseEvent) => {
    if (scrollToHomeSection(hash)) e.preventDefault();
    setMobileOpen(false);
  };

  const adminPanelNavClick = (elementId: string) => (e: React.MouseEvent) => {
    if (pathname === "/admin") {
      e.preventDefault();
      scrollAdminPanelSection(elementId);
    }
    setMobileOpen(false);
  };

  const goToSearch = () => {
    if (scrollToHomeSection("#search")) {
      setMobileOpen(false);
      return;
    }
    setMobileOpen(false);
    window.location.assign("/#search");
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navMuted =
    "px-2.5 xl:px-3 py-1.5 rounded-full text-[13px] text-white/70 hover:text-white hover:bg-white/5 transition-colors whitespace-nowrap";
  const navEmphasis =
    "px-2.5 xl:px-3 py-1.5 rounded-full text-[13px] text-neon/95 hover:bg-neon/10 border border-transparent hover:border-neon/35 transition-colors whitespace-nowrap";

  const adminNavGroupClass =
    "text-[10px] font-mono uppercase tracking-wider text-white/35 px-1 select-none whitespace-nowrap";

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
          <Link href="/" className="flex shrink-0 items-center gap-2.5 group">
            <span className="relative grid place-items-center h-9 w-9 rounded-full bg-neon text-ink-950 shadow-neon-sm transition-transform group-hover:scale-110">
              <Flame className="h-5 w-5" strokeWidth={2.5} />
              <span className="absolute -inset-0.5 rounded-full bg-neon opacity-40 blur-md -z-10" />
            </span>
            <div className="leading-tight">
              <div className="font-display text-base font-bold">Fartlek</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-white/50">
                Події 2026
              </div>
            </div>
          </Link>

          {isAdminDashboard ? (
            <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5 min-w-0 flex-1 justify-center overflow-x-auto no-scrollbar [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <span className={adminNavGroupClass}>Сайт</span>
              {USER_SITE_NAV.map((item) => (
                <Link
                  key={`site-${item.hash}`}
                  href={userSiteHref(item.hash)}
                  onClick={userSiteNavClick(item.hash)}
                  className={navMuted}
                >
                  {item.label}
                </Link>
              ))}
              <span className="w-px h-4 bg-white/15 shrink-0 mx-0.5" aria-hidden />
              <span className={adminNavGroupClass}>Адмін</span>
              {ADMIN_PANEL_NAV.map((item) => (
                <Link
                  key={`ad-${item.id}`}
                  href={`/admin#${item.id}`}
                  onClick={adminPanelNavClick(item.id)}
                  className={navEmphasis}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          ) : (
            <nav className="hidden lg:flex items-center gap-1">
              {USER_SITE_NAV.map((item) => (
                <Link
                  key={item.hash}
                  href={userSiteHref(item.hash)}
                  onClick={userSiteNavClick(item.hash)}
                  className={cn(navMuted, "px-3")}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          )}

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={goToSearch}
              className="hidden md:inline-flex items-center gap-2 h-9 px-3.5 rounded-full bg-white/5 border border-white/10 text-sm text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Пошук подій"
            >
              <SearchIcon className="h-4 w-4" />
              <span>Пошук...</span>
              <kbd className="ml-2 hidden xl:inline-flex h-5 px-1.5 rounded items-center text-[10px] bg-white/5 border border-white/10">
                ⌘K
              </kbd>
            </button>

            <Link
              href="/#favorites"
              onClick={(e) => {
                if (scrollToHomeSection("#favorites")) e.preventDefault();
                setMobileOpen(false);
              }}
              className="relative hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/5 border border-white/10 hover:border-neon/40 hover:bg-neon/10 transition-colors"
              aria-label="Обране"
            >
              <Heart className="h-4 w-4" />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 grid place-items-center rounded-full bg-neon text-ink-950 text-[10px] font-bold">
                  {count}
                </span>
              )}
            </Link>

            {showVisitorAdminPortal ? (
              <Link
                href="/admin"
                className={cn(
                  "hidden sm:inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors shrink-0 no-underline",
                  isAdminLoggedIn ?
                    "border-neon/45 bg-neon/15 text-neon hover:bg-neon/[0.22]"
                  : "border-white/10 bg-white/5 text-white/70 hover:text-white hover:bg-white/10",
                )}
                aria-label={
                  isAdminLoggedIn ?
                    "Повернутися у адмін-панель"
                  : "В адмін-панель"
                }
              >
                {isAdminLoggedIn ? (
                  <>
                    <ArrowLeft className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    <span className="hidden md:inline lg:hidden">У адмін</span>
                    <span className="hidden lg:inline">У адмін-панель</span>
                  </>
                ) : (
                  <>
                    <Shield
                      className="h-3.5 w-3.5 shrink-0 opacity-85"
                      aria-hidden
                    />
                    <span className="hidden md:inline lg:hidden">Адмін</span>
                    <span className="hidden lg:inline">В адмін-панель</span>
                  </>
                )}
              </Link>
            ) : null}

            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="lg:hidden h-9 w-9 inline-flex items-center justify-center rounded-full bg-white/5 border border-white/10"
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
              className="lg:hidden mt-2 glass-strong rounded-2xl p-3 flex flex-col gap-3 max-h-[min(72vh,var(--radix-viewport,height))] overflow-y-auto"
            >
              {isAdminDashboard ? (
                <>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-white/40 px-1">
                    Перегляд сайту (користувач)
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {USER_SITE_NAV.map((item) => (
                      <Link
                        key={`m-site-${item.hash}`}
                        href={userSiteHref(item.hash)}
                        onClick={userSiteNavClick(item.hash)}
                        className="px-4 py-2.5 rounded-xl text-sm text-white/80 hover:text-white hover:bg-white/5"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                  <div className="h-px bg-white/10" />
                  <div className="text-[10px] font-mono uppercase tracking-widest text-neon/80 px-1">
                    Адмін-панель
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {ADMIN_PANEL_NAV.map((item) => (
                      <Link
                        key={`m-ad-${item.id}`}
                        href={`/admin#${item.id}`}
                        onClick={adminPanelNavClick(item.id)}
                        className="px-4 py-2.5 rounded-xl text-sm font-medium text-white/92 hover:bg-neon/10 border border-white/5 hover:border-neon/25"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </>
              ) : (
                USER_SITE_NAV.map((item) => (
                  <Link
                    key={item.hash}
                    href={userSiteHref(item.hash)}
                    onClick={userSiteNavClick(item.hash)}
                    className="px-4 py-2.5 rounded-xl text-sm text-white/80 hover:text-white hover:bg-white/5"
                  >
                    {item.label}
                  </Link>
                ))
              )}
              {showVisitorAdminPortal ? (
                <Link
                  href="/admin"
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "mt-0.5 px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 border",
                    isAdminLoggedIn ?
                      "border-neon/35 bg-neon/10 text-neon"
                    : "border-white/10 text-white/85 hover:bg-white/5",
                  )}
                >
                  {isAdminLoggedIn ? (
                    <>
                      <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
                      У адмін-панель
                    </>
                  ) : (
                    <>
                      <Shield
                        className="h-4 w-4 shrink-0 opacity-90"
                        aria-hidden
                      />
                      В адмін-панель
                    </>
                  )}
                </Link>
              ) : null}
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
}
