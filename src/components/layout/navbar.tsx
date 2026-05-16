"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Bot,
  Flame,
  Gauge,
  Heart,
  Menu,
  Search as SearchIcon,
  Shield,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFavorites } from "@/components/providers/favorites-provider";

/** Секції головної (`/#…`) або окремий маршрут публічного сайту. */
type VisitorSiteNavItem =
  | { readonly kind: "hash"; readonly hash: string; readonly label: string }
  | { readonly kind: "href"; readonly href: string; readonly label: string };

const VISITOR_SITE_NAV: readonly VisitorSiteNavItem[] = [
  { kind: "hash", hash: "#events", label: "Події" },
  { kind: "hash", hash: "#calendar", label: "Календар" },
  { kind: "hash", hash: "#map", label: "Карта" },
  { kind: "hash", hash: "#top", label: "Топ" },
  { kind: "hash", hash: "#quick-add-event", label: "Додати подію" },
  { kind: "href", href: "/contacts", label: "Контакти" },
];

function visitorSiteNavHref(item: VisitorSiteNavItem): string {
  return item.kind === "href" ? item.href : userSiteHref(item.hash);
}

function visitorSiteNavKey(item: VisitorSiteNavItem): string {
  return item.kind === "href" ? item.href : item.hash;
}
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
  const [mounted, setMounted] = useState(false);
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

  const visitorSiteNavClick = (item: VisitorSiteNavItem) => (
    e: React.MouseEvent<HTMLAnchorElement>,
  ) => {
    if (item.kind === "hash") {
      if (scrollToHomeSection(item.hash)) e.preventDefault();
    }
    setMobileOpen(false);
  };

  const adminPanelNavClick = (elementId: string) => (e: React.MouseEvent) => {
    if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
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

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileOpen]);

  const navMuted =
    "px-2.5 xl:px-3 py-1.5 rounded-full text-[13px] text-white/70 hover:text-white hover:bg-white/5 transition-colors whitespace-nowrap";
  const navEmphasis =
    "px-2.5 xl:px-3 py-1.5 rounded-full text-[13px] text-neon/95 hover:bg-neon/10 border border-transparent hover:border-neon/35 transition-colors whitespace-nowrap";

  const adminNavGroupClass =
    "text-[10px] font-mono uppercase tracking-wider text-white/35 px-1 select-none whitespace-nowrap";

  const mobileNavPanel = (
    <motion.div
      key="mobile-menu-layer"
      role="presentation"
      className="fixed inset-0 z-[60] lg:hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px] touch-none"
        style={{
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
        aria-hidden
        onPointerDown={(e) => {
          e.preventDefault();
          setMobileOpen(false);
        }}
      />
      <nav
        id="mobile-primary-nav"
        role="navigation"
        aria-label="Головне меню"
        className={cn(
          "absolute left-3 right-3 z-[1] glass-strong rounded-2xl border border-white/12 shadow-2xl shadow-black/50",
          "flex flex-col gap-3 p-3 max-h-[min(75dvh,calc(100dvh-5.25rem-env(safe-area-inset-top)-env(safe-area-inset-bottom)))] overflow-y-auto overscroll-contain touch-manipulation",
        )}
        style={{
          top: "calc(5rem + env(safe-area-inset-top, 0px))",
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {isAdminDashboard ? (
          <>
            <div className="text-[10px] font-mono uppercase tracking-widest text-white/40 px-1">
              Перегляд сайту (користувач)
            </div>
            <div className="flex flex-col gap-0.5">
              {VISITOR_SITE_NAV.map((item) => (
                <Link
                  key={`m-site-${visitorSiteNavKey(item)}`}
                  href={visitorSiteNavHref(item)}
                  onClick={visitorSiteNavClick(item)}
                  className="px-4 py-3 rounded-xl text-sm text-white/85 hover:text-white hover:bg-white/5 active:bg-white/10 min-h-[44px] flex items-center"
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/assistant"
                onClick={() => setMobileOpen(false)}
                className="px-4 py-3 rounded-xl text-sm text-white/85 hover:text-white hover:bg-neon/10 border border-white/5 hover:border-neon/25 active:bg-neon/15 min-h-[44px] flex items-center gap-2"
              >
                <Bot className="h-4 w-4 text-neon shrink-0" aria-hidden />
                Fartlek AI
              </Link>
              <Link
                href="/tools/pace"
                onClick={() => setMobileOpen(false)}
                className="px-4 py-3 rounded-xl text-sm text-white/85 hover:text-white hover:bg-neon/10 border border-white/5 hover:border-neon/25 active:bg-neon/15 min-h-[44px] flex items-center gap-2"
              >
                <Gauge className="h-4 w-4 text-neon shrink-0" aria-hidden />
                Калькулятор темпу
              </Link>
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
                  className="px-4 py-3 rounded-xl text-sm font-medium text-white/92 hover:bg-neon/10 border border-white/5 hover:border-neon/25 active:bg-neon/15 min-h-[44px] flex items-center"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </>
        ) : (
          <>
            {VISITOR_SITE_NAV.map((item) => (
              <Link
                key={visitorSiteNavKey(item)}
                href={visitorSiteNavHref(item)}
                onClick={visitorSiteNavClick(item)}
                className="px-4 py-3 rounded-xl text-sm text-white/85 hover:text-white hover:bg-white/5 active:bg-white/10 min-h-[44px] flex items-center"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/assistant"
              onClick={() => setMobileOpen(false)}
              className="px-4 py-3 rounded-xl text-sm text-white/85 hover:text-white hover:bg-neon/10 border border-white/5 hover:border-neon/25 active:bg-neon/15 min-h-[44px] flex items-center gap-2"
            >
              <Bot className="h-4 w-4 text-neon shrink-0" aria-hidden />
              Fartlek AI
            </Link>
            <Link
              href="/tools/pace"
              onClick={() => setMobileOpen(false)}
              className="px-4 py-3 rounded-xl text-sm text-white/85 hover:text-white hover:bg-neon/10 border border-white/5 hover:border-neon/25 active:bg-neon/15 min-h-[44px] flex items-center gap-2"
            >
              <Gauge className="h-4 w-4 text-neon shrink-0" aria-hidden />
              Калькулятор темпу
            </Link>
          </>
        )}
        <button
          type="button"
          onClick={() => {
            goToSearch();
          }}
          className="md:hidden px-4 py-3 rounded-xl text-sm text-left text-white/85 hover:bg-white/5 border border-white/10 flex items-center gap-2 min-h-[44px]"
        >
          <SearchIcon className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
          Пошук подій
        </button>
        <Link
          href="/#favorites"
          onClick={(e) => {
            if (scrollToHomeSection("#favorites")) e.preventDefault();
            setMobileOpen(false);
          }}
          className="sm:hidden px-4 py-3 rounded-xl text-sm text-white/85 hover:bg-white/5 border border-white/10 flex items-center gap-2 min-h-[44px]"
        >
          <Heart className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
          Обране
          {count > 0 && (
            <span className="ml-auto h-6 min-w-6 px-2 grid place-items-center rounded-full bg-neon text-ink-950 text-xs font-bold">
              {count}
            </span>
          )}
        </Link>
        {showVisitorAdminPortal ? (
          <Link
            href="/admin"
            onClick={() => setMobileOpen(false)}
            className={cn(
              "mt-0.5 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 border min-h-[44px]",
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
                <Shield className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                В адмін-панель
              </>
            )}
          </Link>
        ) : null}
      </nav>
    </motion.div>
  );

  return (
    <>
      <header
        className={cn(
          "fixed top-0 inset-x-0 z-50 pt-[env(safe-area-inset-top)] transition-all duration-300",
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
              {VISITOR_SITE_NAV.map((item) => (
                <Link
                  key={`site-${visitorSiteNavKey(item)}`}
                  href={visitorSiteNavHref(item)}
                  onClick={visitorSiteNavClick(item)}
                  className={navMuted}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/assistant"
                className={cn(navMuted, "inline-flex items-center gap-1.5")}
              >
                <Bot className="h-3.5 w-3.5 text-neon shrink-0" aria-hidden />
                AI
              </Link>
              <Link
                href="/tools/pace"
                className={cn(navMuted, "inline-flex items-center gap-1.5")}
              >
                <Gauge className="h-3.5 w-3.5 text-neon shrink-0" aria-hidden />
                Темп
              </Link>
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
              {VISITOR_SITE_NAV.map((item) => (
                <Link
                  key={visitorSiteNavKey(item)}
                  href={visitorSiteNavHref(item)}
                  onClick={visitorSiteNavClick(item)}
                  className={cn(navMuted, "px-3")}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/assistant"
                className={cn(
                  navMuted,
                  "px-3 inline-flex items-center gap-1.5",
                )}
              >
                <Bot className="h-3.5 w-3.5 text-neon shrink-0" aria-hidden />
                AI
              </Link>
              <Link
                href="/tools/pace"
                className={cn(
                  navMuted,
                  "px-3 inline-flex items-center gap-1.5",
                )}
              >
                <Gauge className="h-3.5 w-3.5 text-neon shrink-0" aria-hidden />
                Темп
              </Link>
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
              className="lg:hidden min-h-[44px] min-w-[44px] h-11 w-11 shrink-0 inline-flex items-center justify-center rounded-full bg-white/5 border border-white/10 touch-manipulation"
              aria-label={mobileOpen ? "Закрити меню" : "Відкрити меню"}
              aria-expanded={mobileOpen}
              aria-controls="mobile-primary-nav"
            >
              {mobileOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
        </div>
      </header>
      {mounted
        ? createPortal(
            <AnimatePresence>
              {mobileOpen ? mobileNavPanel : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </>
  );
}
