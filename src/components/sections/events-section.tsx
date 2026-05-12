"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarClock,
  CalendarCheck,
  SlidersHorizontal,
  Search as SearchIcon,
  X,
} from "lucide-react";
import { EventCard } from "@/components/event/event-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "./stats-section";
import type {
  EventCategory,
  EventFilters,
  EventStatus,
  SportEvent,
} from "@/types";
import { UKRAINE_CITIES } from "@/data/cities";
import { ALL_MONTHS, monthLabelLong } from "@/lib/utils";

interface EventsSectionProps {
  upcoming: SportEvent[];
  finished: SportEvent[];
}

const CATEGORY_OPTIONS: { value: EventCategory; label: string }[] = [
  { value: "marathon", label: "Біг" },
  { value: "trail", label: "Трейл" },
  { value: "ultra", label: "Ультра" },
  { value: "cycling", label: "Велоспорт" },
  { value: "swimming", label: "Плавання" },
  { value: "triathlon", label: "Триатлон" },
  { value: "duathlon", label: "Дуатлон" },
  { value: "kids", label: "Дитячий" },
  { value: "obstacle", label: "Перешкоди" },
];

const STATUS_OPTIONS: { value: EventStatus; label: string }[] = [
  { value: "registration_open", label: "Реєстрація відкрита" },
  { value: "soon", label: "Незабаром" },
  { value: "finished", label: "Завершено" },
  { value: "sold_out", label: "Місць немає" },
];

const defaultFilters: EventFilters = {
  city: null,
  category: null,
  month: null,
  status: null,
  search: "",
};

function applyFilters(events: SportEvent[], f: EventFilters): SportEvent[] {
  return events.filter((e) => {
    if (f.city && e.city !== f.city) return false;
    if (f.category && e.category !== f.category) return false;
    if (f.status && e.status !== f.status) return false;
    if (f.month !== null && new Date(e.date).getUTCMonth() !== f.month)
      return false;
    if (f.search) {
      const q = f.search.toLowerCase();
      const hay = (
        e.title +
        " " +
        e.city +
        " " +
        e.description +
        " " +
        e.organizerName +
        " " +
        e.tags.join(" ")
      ).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function EventsSection({ upcoming, finished }: EventsSectionProps) {
  const [filters, setFilters] = useState<EventFilters>(defaultFilters);
  const [tab, setTab] = useState<"upcoming" | "finished">("upcoming");

  const filteredUpcoming = useMemo(
    () => applyFilters(upcoming, filters),
    [upcoming, filters],
  );
  const filteredFinished = useMemo(
    () => applyFilters(finished, filters),
    [finished, filters],
  );

  const updateFilter = <K extends keyof EventFilters>(
    key: K,
    value: EventFilters[K],
  ) => setFilters((f) => ({ ...f, [key]: value }));

  const reset = () => setFilters(defaultFilters);
  const hasFilters =
    !!filters.city ||
    !!filters.category ||
    filters.month !== null ||
    !!filters.status ||
    !!filters.search;

  return (
    <section id="events" className="relative py-16 md:py-20">
      <div id="search" className="container mx-auto px-4">
        <SectionHeader
          eyebrow="Знайти"
          title="Спортивні події"
          description="Переглядайте майбутні та минулі події за допомогою потужних фільтрів і пошуку."
        />

        <div className="mt-8 glass rounded-2xl p-4 md:p-5">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-4 relative">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 pointer-events-none" />
              <Input
                placeholder="Пошук подій..."
                value={filters.search}
                onChange={(e) => updateFilter("search", e.target.value)}
                className="pl-10"
                aria-label="Пошук подій"
              />
            </div>
            <div className="md:col-span-2">
              <Select
                value={filters.city ?? ""}
                onChange={(e) =>
                  updateFilter("city", e.target.value || null)
                }
                options={UKRAINE_CITIES.map((c) => ({
                  value: c.name,
                  label: c.name,
                }))}
                placeholder="Усі міста"
                aria-label="Фільтр за містом"
              />
            </div>
            <div className="md:col-span-2">
              <Select
                value={filters.category ?? ""}
                onChange={(e) =>
                  updateFilter(
                    "category",
                    (e.target.value || null) as EventCategory | null,
                  )
                }
                options={CATEGORY_OPTIONS}
                placeholder="Усі категорії"
                aria-label="Фільтр за категорією"
              />
            </div>
            <div className="md:col-span-2">
              <Select
                value={filters.month === null ? "" : String(filters.month)}
                onChange={(e) =>
                  updateFilter(
                    "month",
                    e.target.value === "" ? null : Number(e.target.value),
                  )
                }
                options={ALL_MONTHS.map((m) => ({
                  value: String(m),
                  label: monthLabelLong(m),
                }))}
                placeholder="Усі місяці"
                aria-label="Фільтр за місяцем"
              />
            </div>
            <div className="md:col-span-2">
              <Select
                value={filters.status ?? ""}
                onChange={(e) =>
                  updateFilter(
                    "status",
                    (e.target.value || null) as EventStatus | null,
                  )
                }
                options={STATUS_OPTIONS}
                placeholder="Усі статуси"
                aria-label="Фільтр за статусом"
              />
            </div>
          </div>

          <AnimatePresence>
            {hasFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-3 flex items-center justify-between text-xs text-white/60">
                  <span className="inline-flex items-center gap-1.5">
                    <SlidersHorizontal className="h-3.5 w-3.5 text-neon" />
                    Фільтри активні
                  </span>
                  <Button variant="ghost" size="sm" onClick={reset}>
                    <X className="h-3.5 w-3.5" />
                    Скинути
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-8">
          <Tabs
            defaultValue="upcoming"
            value={tab}
            onValueChange={(v) => setTab(v as "upcoming" | "finished")}
          >
            <div className="flex items-center justify-between flex-wrap gap-3">
              <TabsList>
                <TabsTrigger value="upcoming">
                  <CalendarClock className="h-4 w-4 inline mr-1.5 -mt-0.5" />
                  Майбутні ({filteredUpcoming.length})
                </TabsTrigger>
                <TabsTrigger value="finished">
                  <CalendarCheck className="h-4 w-4 inline mr-1.5 -mt-0.5" />
                  Завершені ({filteredFinished.length})
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="upcoming" className="mt-6">
              <EventGrid events={filteredUpcoming} />
            </TabsContent>

            <TabsContent value="finished" className="mt-6">
              <EventGrid events={filteredFinished} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </section>
  );
}

function EventGrid({ events }: { events: SportEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="glass rounded-2xl p-12 text-center">
        <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-white/5 grid place-items-center">
          <SearchIcon className="h-7 w-7 text-white/40" />
        </div>
        <h3 className="font-display text-xl font-semibold">Подій не знайдено</h3>
        <p className="mt-2 text-sm text-white/60">
          Спробуйте змінити фільтри або пошуковий запит.
        </p>
      </div>
    );
  }
  return (
    <motion.div
      layout
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
    >
      {events.map((e, idx) => (
        <motion.div
          key={e.id}
          layout
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-5% 0px" }}
          transition={{ duration: 0.35, delay: Math.min(idx * 0.03, 0.3) }}
        >
          <EventCard event={e} />
        </motion.div>
      ))}
    </motion.div>
  );
}
