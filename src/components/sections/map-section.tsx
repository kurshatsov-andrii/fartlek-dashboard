"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { SectionHeader } from "./stats-section";
import { Badge } from "@/components/ui/badge";
import { UKRAINE_CITIES, type CityInfo } from "@/data/cities";
import {
  UKRAINE_ADMIN_PATH_D,
  UKRAINE_MAP_BOUNDS,
  UKRAINE_SVG_DIMENSIONS,
} from "@/data/ukraine-admin-outline";
import { sportEventPagePath } from "@/lib/event-detail";
import { formatEventDate } from "@/lib/date";
import { categoryLabel } from "@/lib/analytics";
import type { SportEvent } from "@/types";

interface MapSectionProps {
  events: SportEvent[];
}

const { w: SVG_W, h: SVG_H } = UKRAINE_SVG_DIMENSIONS;

type CityEventFilter = "all" | "upcoming" | "finished";

function sortEventsInCity(events: SportEvent[]): SportEvent[] {
  const up = events
    .filter((e) => e.state === "upcoming")
    .sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
  const fin = events
    .filter((e) => e.state === "finished")
    .sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  return [...up, ...fin];
}

function project(lat: number, lng: number): { x: number; y: number } {
  const x =
    ((lng - UKRAINE_MAP_BOUNDS.minLng) /
      (UKRAINE_MAP_BOUNDS.maxLng - UKRAINE_MAP_BOUNDS.minLng)) *
    SVG_W;
  const y =
    SVG_H -
    ((lat - UKRAINE_MAP_BOUNDS.minLat) /
      (UKRAINE_MAP_BOUNDS.maxLat - UKRAINE_MAP_BOUNDS.minLat)) *
      SVG_H;
  return { x, y };
}

export function MapSection({ events }: MapSectionProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [cityEventFilter, setCityEventFilter] =
    useState<CityEventFilter>("upcoming");

  const cityStats = useMemo(() => {
    const map = new Map<
      string,
      { city: CityInfo; total: number; upcoming: number; finished: number }
    >();
    for (const c of UKRAINE_CITIES) {
      map.set(c.name, { city: c, total: 0, upcoming: 0, finished: 0 });
    }
    for (const e of events) {
      const entry = map.get(e.city);
      if (!entry) continue;
      entry.total += 1;
      if (e.state === "upcoming") entry.upcoming += 1;
      else entry.finished += 1;
    }
    return Array.from(map.values()).filter((v) => v.total > 0);
  }, [events]);

  const max = Math.max(1, ...cityStats.map((c) => c.total));
  const hoveredStat = hovered
    ? cityStats.find((c) => c.city.name === hovered) ?? null
    : null;

  const cityEventsForPanel = useMemo(() => {
    if (!hoveredStat) return [];
    return events.filter((e) => e.city === hoveredStat.city.name);
  }, [events, hoveredStat]);

  const filteredCityEvents = useMemo(() => {
    if (cityEventFilter === "all") return sortEventsInCity(cityEventsForPanel);
    return sortEventsInCity(
      cityEventsForPanel.filter((e) => e.state === cityEventFilter),
    );
  }, [cityEventsForPanel, cityEventFilter]);

  useEffect(() => {
    if (!hovered) return;
    const stat = cityStats.find((c) => c.city.name === hovered);
    if (!stat) return;
    if (stat.upcoming > 0) setCityEventFilter("upcoming");
    else if (stat.finished > 0) setCityEventFilter("finished");
    else setCityEventFilter("all");
  }, [hovered, cityStats]);

  return (
    <section id="map" className="relative py-16 md:py-20">
      <div className="container mx-auto px-4">
        <SectionHeader
          eyebrow="Географія"
          title="Події по всій Україні"
          description="22+ міста проведення — від Львова на заході до Харкова на сході, від Києва до Чорного моря."
        />

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 glass rounded-2xl p-4 md:p-6 overflow-hidden">
            <div className="relative aspect-[16/9.5] w-full">
              <svg
                viewBox={`0 0 ${SVG_W} ${SVG_H}`}
                className="w-full h-full"
                role="img"
                aria-label="Карта спортивних подій по Україні"
              >
                <defs>
                  <linearGradient id="uaFill" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="rgba(255,102,51,0.08)" />
                    <stop offset="100%" stopColor="rgba(255,235,20,0.05)" />
                  </linearGradient>
                  <pattern
                    id="uaGrid"
                    x="0"
                    y="0"
                    width="32"
                    height="32"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 32 0 L 0 0 0 32"
                      fill="none"
                      stroke="rgba(255,255,255,0.04)"
                      strokeWidth="1"
                    />
                  </pattern>
                  <radialGradient id="dotGlow">
                    <stop offset="0%" stopColor="#ff6633" stopOpacity={1} />
                    <stop offset="100%" stopColor="#ff6633" stopOpacity={0} />
                  </radialGradient>
                </defs>

                <rect width={SVG_W} height={SVG_H} fill="url(#uaGrid)" />

                <path
                  d={UKRAINE_ADMIN_PATH_D}
                  fill="url(#uaFill)"
                  stroke="rgba(255,102,51,0.5)"
                  strokeWidth="1.25"
                />

                {cityStats.map(({ city, total, upcoming }) => {
                  const { x, y } = project(city.lat, city.lng);
                  const size = 5 + (total / max) * 14;
                  const isHovered = hovered === city.name;
                  return (
                    <g
                      key={city.name}
                      onMouseEnter={() => setHovered(city.name)}
                      className="cursor-pointer"
                    >
                      <circle
                        cx={x}
                        cy={y}
                        r={size * 2.4}
                        fill="url(#dotGlow)"
                        opacity={isHovered ? 0.9 : 0.5}
                      />
                      <circle
                        cx={x}
                        cy={y}
                        r={size}
                        fill={upcoming > 0 ? "#ff6633" : "#3a3a3b"}
                        stroke="rgba(10,10,10,0.9)"
                        strokeWidth="2"
                        className="transition-all"
                      />
                      <text
                        x={x}
                        y={y - size - 6}
                        textAnchor="middle"
                        fontSize="11"
                        fontFamily="var(--font-geist-mono), monospace"
                        fill="rgba(255,255,255,0.85)"
                        className="pointer-events-none select-none"
                        opacity={isHovered ? 1 : 0.75}
                      >
                        {city.name}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            <div className="mt-3 flex items-center gap-4 text-[11px] text-white/60">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-neon" />
                Майбутні події
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-ink-600" />
                Лише завершені
              </span>
              <span className="ml-auto text-white/40">
                Розмір крапки = кількість подій
              </span>
            </div>
            <p className="mt-2 text-[10px] text-white/30 text-right">
              Контур: спрощений полігон України з Кримом (world.geo.json, UKR);
              міста по координатах lat/lng
            </p>
          </div>

          <div className="glass rounded-2xl p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <h3 className="font-display text-base font-semibold">
                {hoveredStat ? hoveredStat.city.name : "Топ регіонів"}
              </h3>
              {hoveredStat ? (
                <button
                  type="button"
                  onClick={() => setHovered(null)}
                  className="shrink-0 text-[11px] text-white/45 hover:text-neon transition-colors"
                >
                  Усі міста
                </button>
              ) : null}
            </div>
            {hoveredStat ? (
              <motion.div
                key={hoveredStat.city.name}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <div className="text-xs text-white/60">
                  {hoveredStat.city.region}
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <button
                    type="button"
                    onClick={() => setCityEventFilter("all")}
                    className={`rounded-xl p-3 transition-colors text-left sm:text-center ${
                      cityEventFilter === "all"
                        ? "bg-neon/10 border border-neon/30"
                        : "bg-white/5 border border-transparent hover:bg-white/[0.07]"
                    }`}
                  >
                    <div className="font-display text-xl font-bold">
                      {hoveredStat.total}
                    </div>
                    <div className="text-[10px] uppercase tracking-widest text-white/50">
                      Всього
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCityEventFilter("upcoming")}
                    className={`rounded-xl p-3 transition-colors text-left sm:text-center ${
                      cityEventFilter === "upcoming"
                        ? "bg-neon/10 border border-neon/30"
                        : "bg-white/5 border border-transparent hover:bg-white/[0.07]"
                    }`}
                  >
                    <div className="font-display text-xl font-bold text-neon">
                      {hoveredStat.upcoming}
                    </div>
                    <div className="text-[10px] uppercase tracking-widest text-white/50">
                      Майбутні
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCityEventFilter("finished")}
                    className={`rounded-xl p-3 transition-colors text-left sm:text-center ${
                      cityEventFilter === "finished"
                        ? "bg-neon/10 border border-neon/30"
                        : "bg-white/5 border border-transparent hover:bg-white/[0.07]"
                    }`}
                  >
                    <div className="font-display text-xl font-bold">
                      {hoveredStat.finished}
                    </div>
                    <div className="text-[10px] uppercase tracking-widest text-white/50">
                      Завершені
                    </div>
                  </button>
                </div>

                <div className="mt-4 max-h-[280px] overflow-y-auto pr-1 space-y-2 border-t border-white/10 pt-4">
                  {filteredCityEvents.length === 0 ? (
                    <p className="text-xs text-white/45 text-center py-4">
                      Немає подій у цьому фільтрі.
                    </p>
                  ) : (
                    filteredCityEvents.map((e) => (
                      <div
                        key={e.id}
                        className="rounded-xl border border-white/5 bg-white/[0.03] p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-semibold leading-snug min-w-0">
                            {e.title}
                          </h4>
                          <Badge variant="muted" className="text-[10px] shrink-0">
                            {categoryLabel(e.category)}
                          </Badge>
                        </div>
                        <p className="mt-1 text-[11px] text-white/50">
                          {formatEventDate(e.date)}
                          {e.state === "finished" ? " · завершено" : ""}
                        </p>
                        <Link
                          href={sportEventPagePath(e)}
                          className="mt-2 inline-flex text-[11px] font-semibold text-neon hover:text-neon-400 hover:underline underline-offset-2"
                        >
                          Детальніше
                        </Link>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            ) : (
              <ul className="space-y-2">
                {cityStats
                  .slice()
                  .sort((a, b) => b.total - a.total)
                  .slice(0, 8)
                  .map((c) => (
                    <li
                      key={c.city.name}
                      className="flex items-center justify-between gap-2 py-1.5 px-2 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <MapPin className="h-3.5 w-3.5 text-neon shrink-0" />
                        <span className="text-sm truncate">{c.city.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setHovered(c.city.name)}
                        className="shrink-0 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border border-white/[0.08] bg-white/[0.03] text-white/60 hover:border-neon/35 hover:text-neon transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon/50 cursor-pointer"
                        aria-label={`Показати події в місті ${c.city.name}`}
                      >
                        {c.total} подій
                      </button>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
