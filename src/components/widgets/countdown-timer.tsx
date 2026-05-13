"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, MapPin, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatEventDateLong } from "@/lib/date";
import { categoryLabel } from "@/lib/analytics";
import { sportEventPagePath } from "@/lib/event-detail";
import type { SportEvent } from "@/types";

interface CountdownTimerProps {
  event: SportEvent;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function diff(target: Date): TimeLeft {
  const ms = Math.max(0, target.getTime() - Date.now());
  const sec = Math.floor(ms / 1000);
  return {
    days: Math.floor(sec / 86400),
    hours: Math.floor((sec % 86400) / 3600),
    minutes: Math.floor((sec % 3600) / 60),
    seconds: sec % 60,
  };
}

const ZERO: TimeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };

export function CountdownTimer({ event }: CountdownTimerProps) {
  // SSR і перший render клієнта віддають однакові нулі, щоб уникнути
  // hydration mismatch — реальні значення з'являються після mount.
  const [time, setTime] = useState<TimeLeft>(ZERO);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const target = new Date(event.date);
    setTime(diff(target));
    const id = setInterval(() => setTime(diff(target)), 1000);
    return () => clearInterval(id);
  }, [event.date]);

  const items: { label: string; value: number }[] = [
    { label: "Днів", value: time.days },
    { label: "Год", value: time.hours },
    { label: "Хв", value: time.minutes },
    { label: "Сек", value: time.seconds },
  ];

  return (
    <div className="relative glass-strong rounded-3xl p-6 overflow-hidden">
      <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-neon/30 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-12 h-40 w-40 rounded-full bg-cyber-blue/20 blur-3xl pointer-events-none" />

      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="neon">
            <Trophy className="h-3 w-3" />
            Найближча подія
          </Badge>
          <Badge variant="muted">{categoryLabel(event.category)}</Badge>
        </div>

        <h3 className="font-display text-2xl font-bold leading-tight">
          {event.title}
        </h3>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-white/70">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 text-neon" />
            {formatEventDateLong(event.date)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-neon" />
            {event.city}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-4 gap-2">
          {items.map((it, idx) => (
            <motion.div
              key={it.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 * idx }}
              className="relative rounded-2xl bg-white/5 border border-white/10 p-3 text-center"
            >
              <div
                className="font-mono text-2xl md:text-3xl font-bold tabular-nums text-neon"
                suppressHydrationWarning
              >
                {mounted ? it.value.toString().padStart(2, "0") : "--"}
              </div>
              <div className="mt-1 text-[10px] uppercase tracking-widest text-white/50">
                {it.label}
              </div>
            </motion.div>
          ))}
        </div>

        <Link
          href={sportEventPagePath(event)}
          className="mt-5 btn-neon w-full justify-center"
        >
          Детальніше
        </Link>
      </div>
    </div>
  );
}
