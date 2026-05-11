"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { SectionHeader } from "./stats-section";
import { Badge } from "@/components/ui/badge";
import { UKRAINE_CITIES, type CityInfo } from "@/data/cities";
import type { SportEvent } from "@/types";

interface MapSectionProps {
  events: SportEvent[];
}

// Geographic bounds of mainland Ukraine for projection
const BOUNDS = {
  minLat: 44.0,
  maxLat: 52.5,
  minLng: 22.0,
  maxLng: 40.5,
};

// SVG viewbox
const SVG_W = 800;
const SVG_H = 480;

function project(lat: number, lng: number): { x: number; y: number } {
  const x = ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * SVG_W;
  const y =
    SVG_H -
    ((lat - BOUNDS.minLat) / (BOUNDS.maxLat - BOUNDS.minLat)) * SVG_H;
  return { x, y };
}

// Simplified outline of Ukraine (stylized, not a precise topology)
const UKRAINE_PATH =
  "M 60 280 L 110 230 L 165 200 L 215 175 L 260 165 L 290 130 L 340 110 L 390 105 L 440 115 L 480 100 L 530 90 L 575 105 L 615 95 L 660 100 L 700 130 L 720 165 L 745 195 L 720 230 L 700 265 L 715 295 L 740 325 L 710 360 L 665 380 L 615 395 L 565 405 L 510 410 L 460 405 L 410 395 L 360 380 L 310 360 L 270 335 L 230 360 L 195 380 L 165 365 L 130 340 L 100 320 L 70 305 Z";

export function MapSection({ events }: MapSectionProps) {
  const [hovered, setHovered] = useState<string | null>(null);

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
                  d={UKRAINE_PATH}
                  fill="url(#uaFill)"
                  stroke="rgba(255,102,51,0.5)"
                  strokeWidth="1.5"
                />

                {cityStats.map(({ city, total, upcoming }) => {
                  const { x, y } = project(city.lat, city.lng);
                  const size = 5 + (total / max) * 14;
                  const isHovered = hovered === city.name;
                  return (
                    <g
                      key={city.name}
                      onMouseEnter={() => setHovered(city.name)}
                      onMouseLeave={() => setHovered(null)}
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

            <div className="mt-3 flex items-center gap-4 text-[11px] text-white/60 light:text-black/60">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-neon" />
                Майбутні події
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-ink-600" />
                Лише завершені
              </span>
              <span className="ml-auto text-white/40 light:text-black/40">
                Розмір крапки = кількість подій
              </span>
            </div>
          </div>

          <div className="glass rounded-2xl p-5">
            <h3 className="font-display text-base font-semibold mb-3">
              {hoveredStat ? hoveredStat.city.name : "Топ регіонів"}
            </h3>
            {hoveredStat ? (
              <motion.div
                key={hoveredStat.city.name}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <div className="text-xs text-white/60 light:text-black/60">
                  {hoveredStat.city.region}
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-white/5 p-3">
                    <div className="font-display text-xl font-bold">
                      {hoveredStat.total}
                    </div>
                    <div className="text-[10px] uppercase tracking-widest text-white/50 light:text-black/50">
                      Всього
                    </div>
                  </div>
                  <div className="rounded-xl bg-neon/10 border border-neon/20 p-3">
                    <div className="font-display text-xl font-bold text-neon">
                      {hoveredStat.upcoming}
                    </div>
                    <div className="text-[10px] uppercase tracking-widest text-white/50 light:text-black/50">
                      Майбутні
                    </div>
                  </div>
                  <div className="rounded-xl bg-white/5 p-3">
                    <div className="font-display text-xl font-bold">
                      {hoveredStat.finished}
                    </div>
                    <div className="text-[10px] uppercase tracking-widest text-white/50 light:text-black/50">
                      Завершені
                    </div>
                  </div>
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
                      onMouseEnter={() => setHovered(c.city.name)}
                      onMouseLeave={() => setHovered(null)}
                      className="flex items-center justify-between gap-2 py-1.5 px-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer light:hover:bg-black/5"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <MapPin className="h-3.5 w-3.5 text-neon shrink-0" />
                        <span className="text-sm truncate">{c.city.name}</span>
                      </div>
                      <Badge variant="muted">{c.total} подій</Badge>
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
