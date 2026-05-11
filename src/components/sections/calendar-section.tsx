"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  MapPin,
} from "lucide-react";
import { SectionHeader } from "./stats-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { categoryColor, categoryLabel } from "@/lib/analytics";
import { formatEventDateLong } from "@/lib/date";
import { monthLabelLong } from "@/lib/utils";
import type { SportEvent } from "@/types";

interface CalendarSectionProps {
  events: SportEvent[];
}

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];

function buildMonth(year: number, month: number) {
  const first = new Date(Date.UTC(year, month, 1));
  const startWeekday = (first.getUTCDay() + 6) % 7; // Mon=0
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: Array<{ day: number | null; iso: string | null }> = [];
  for (let i = 0; i < startWeekday; i++) cells.push({ day: null, iso: null });
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = new Date(Date.UTC(year, month, d)).toISOString().slice(0, 10);
    cells.push({ day: d, iso });
  }
  while (cells.length % 7 !== 0) cells.push({ day: null, iso: null });
  return cells;
}

export function CalendarSection({ events }: CalendarSectionProps) {
  const initialMonth = new Date();
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(initialMonth.getMonth());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const cells = useMemo(() => buildMonth(year, month), [year, month]);
  const eventsByDay = useMemo(() => {
    const m = new Map<string, SportEvent[]>();
    for (const e of events) {
      const key = e.date.slice(0, 10);
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(e);
    }
    return m;
  }, [events]);

  const next = () => {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
    setSelectedDay(null);
  };
  const prev = () => {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
    setSelectedDay(null);
  };

  const selectedEvents = selectedDay
    ? eventsByDay.get(selectedDay) ?? []
    : [];

  return (
    <section id="calendar" className="relative py-16 md:py-20">
      <div className="container mx-auto px-4">
        <SectionHeader
          eyebrow="Календар"
          title="Помісячний перегляд"
          description="Переглядайте календар, щоб побачити події кожного дня. Натисніть на дату з міткою для перегляду деталей."
        />

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-xl font-semibold">
                {monthLabelLong(month)} {year}
              </h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={prev}
                  aria-label="Попередній місяць"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={next}
                  aria-label="Наступний місяць"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1.5 text-[10px] font-mono uppercase tracking-widest text-white/40 mb-2 light:text-black/40">
              {WEEKDAYS.map((d) => (
                <div key={d} className="text-center py-1">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {cells.map((c, idx) => {
                const dayEvents = c.iso ? eventsByDay.get(c.iso) ?? [] : [];
                const isSelected = c.iso === selectedDay;
                const hasEvents = dayEvents.length > 0;
                return (
                  <button
                    key={idx}
                    disabled={!c.day}
                    onClick={() => c.iso && setSelectedDay(c.iso)}
                    className={`relative aspect-square rounded-xl border text-sm transition-all duration-200 ${
                      c.day
                        ? isSelected
                          ? "bg-neon/20 border-neon/60 text-neon shadow-neon-sm"
                          : hasEvents
                            ? "bg-white/[0.04] border-white/10 hover:border-neon/40 hover:bg-neon/10 light:bg-black/[0.04] light:border-black/10"
                            : "bg-white/[0.02] border-white/[0.04] text-white/60 hover:bg-white/[0.06] light:bg-black/[0.02] light:border-black/[0.06] light:text-black/60"
                        : "border-transparent"
                    }`}
                  >
                    {c.day && (
                      <span className="absolute top-1.5 left-2 font-mono text-xs">
                        {c.day}
                      </span>
                    )}
                    {hasEvents && (
                      <div className="absolute bottom-1.5 inset-x-0 flex justify-center gap-0.5">
                        {dayEvents.slice(0, 3).map((e) => (
                          <span
                            key={e.id}
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: categoryColor(e.category) }}
                          />
                        ))}
                        {dayEvents.length > 3 && (
                          <span className="text-[8px] text-white/60 -mt-0.5 ml-0.5">
                            +{dayEvents.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="glass rounded-2xl p-5 min-h-[300px]">
            <div className="flex items-center gap-2 mb-4">
              <CalendarDays className="h-4 w-4 text-neon" />
              <h3 className="font-display text-base font-semibold">
                {selectedDay
                  ? formatEventDateLong(new Date(selectedDay).toISOString())
                  : "Оберіть день"}
              </h3>
            </div>

            <AnimatePresence mode="wait">
              {!selectedDay ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center text-sm text-white/50 light:text-black/50 mt-8"
                >
                  <p>Натисніть на будь-яку відмічену дату, щоб побачити заплановані події.</p>
                </motion.div>
              ) : selectedEvents.length === 0 ? (
                <motion.div
                  key="none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center text-sm text-white/50 light:text-black/50 mt-8"
                >
                  <p>На цю дату подій не заплановано.</p>
                </motion.div>
              ) : (
                <motion.ul
                  key={selectedDay}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3"
                >
                  {selectedEvents.map((e) => (
                    <li
                      key={e.id}
                      className="rounded-xl border border-white/5 bg-white/[0.03] p-3 light:bg-black/[0.03] light:border-black/5"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: categoryColor(e.category) }}
                        />
                        <h4 className="text-sm font-semibold truncate">
                          {e.title}
                        </h4>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-white/60 light:text-black/60">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {e.city}
                        </span>
                        <Badge variant="muted" className="text-[10px]">
                          {categoryLabel(e.category)}
                        </Badge>
                      </div>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
