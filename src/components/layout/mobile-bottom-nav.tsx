"use client";

import { motion } from "framer-motion";
import {
  CalendarDays,
  Heart,
  Home,
  Map as MapIcon,
  Trophy,
} from "lucide-react";
import { useFavorites } from "@/components/providers/favorites-provider";

const ITEMS = [
  { href: "#", label: "Головна", icon: Home },
  { href: "#events", label: "Події", icon: CalendarDays },
  { href: "#map", label: "Карта", icon: MapIcon },
  { href: "#top", label: "Топ", icon: Trophy },
  { href: "#favorites", label: "Обране", icon: Heart },
];

export function MobileBottomNav() {
  const { count } = useFavorites();
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
          <a
            key={item.label}
            href={item.href}
            className="relative flex flex-col items-center gap-0.5 px-3 py-1.5 text-[10px] text-white/60 hover:text-neon transition-colors"
          >
            <Icon className="h-5 w-5" />
            <span className="font-medium">{item.label}</span>
            {isFav && count > 0 && (
              <span className="absolute top-0.5 right-1.5 h-4 min-w-4 px-1 grid place-items-center rounded-full bg-neon text-ink-950 text-[9px] font-bold">
                {count}
              </span>
            )}
          </a>
        );
      })}
    </motion.nav>
  );
}
