"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Heart,
  Home,
  Map as MapIcon,
  Trophy,
} from "lucide-react";
import { useFavorites } from "@/components/providers/favorites-provider";

const ITEMS = [
  { href: "/", label: "Головна", icon: Home, hash: null as string | null },
  {
    href: "/#events",
    label: "Події",
    icon: CalendarDays,
    hash: "#events",
  },
  { href: "/#map", label: "Карта", icon: MapIcon, hash: "#map" },
  { href: "/#top", label: "Топ", icon: Trophy, hash: "#top" },
  {
    href: "/#favorites",
    label: "Обране",
    icon: Heart,
    hash: "#favorites",
  },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { count } = useFavorites();

  const onItemClick =
    (hash: string | null) => (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (pathname !== "/") return;
      if (hash === null) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      const id = hash.replace(/^#/, "");
      const el = document.getElementById(id);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };
  return (
    <motion.nav
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="lg:hidden fixed bottom-3 inset-x-3 z-40 glass-strong rounded-2xl px-2 py-2 flex items-center justify-around shadow-2xl shadow-black/40"
    >
      {ITEMS.map((item) => {
        const Icon = item.icon;
        const isFav = item.label === "Обране";
        return (
          <Link
            key={item.label}
            href={item.href}
            onClick={onItemClick(item.hash)}
            className="relative flex flex-col items-center gap-0.5 px-3 py-1.5 text-[10px] text-white/60 hover:text-neon transition-colors"
          >
            <Icon className="h-5 w-5" />
            <span className="font-medium">{item.label}</span>
            {isFav && count > 0 && (
              <span className="absolute top-0.5 right-1.5 h-4 min-w-4 px-1 grid place-items-center rounded-full bg-neon text-ink-950 text-[9px] font-bold">
                {count}
              </span>
            )}
          </Link>
        );
      })}
    </motion.nav>
  );
}
