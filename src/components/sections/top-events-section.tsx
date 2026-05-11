"use client";

import { motion } from "framer-motion";
import {
  CalendarClock,
  Eye,
  Flame,
  MapPin,
  Trophy,
  TrendingUp,
} from "lucide-react";
import { SectionHeader } from "./stats-section";
import { Badge } from "@/components/ui/badge";
import {
  categoryColor,
  categoryLabel,
  topByViews,
  topCategories,
  upcomingThisWeek,
} from "@/lib/analytics";
import { formatEventDate, fromNow } from "@/lib/date";
import { compactNumber } from "@/lib/utils";
import { CategoryIcon } from "@/components/event/category-icon";
import type { SportEvent } from "@/types";

interface TopEventsSectionProps {
  events: SportEvent[];
  upcoming: SportEvent[];
}

export function TopEventsSection({ events, upcoming }: TopEventsSectionProps) {
  const mostViewed = topByViews(events, 5);
  const topCats = topCategories(events, 5);
  const weekly = upcomingThisWeek(upcoming).slice(0, 5);

  const upcomingFallback = upcoming
    .slice()
    .sort(
      (a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime(),
    )
    .slice(0, 5);

  const week = weekly.length > 0 ? weekly : upcomingFallback;

  return (
    <section id="top" className="relative py-16 md:py-20">
      <div className="container mx-auto px-4">
        <SectionHeader
          eyebrow="Рейтинги"
          title="Топ подій та тренди"
          description="Найпопулярніші події, найгарячіші категорії та найближчий тиждень."
        />

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Panel
            title="Найпопулярніші"
            icon={<Eye className="h-4 w-4 text-cyber-purple" />}
            delay={0}
          >
            <ul className="space-y-2">
              {mostViewed.map((e, idx) => (
                <li key={e.id}>
                  <RowItem
                    rank={idx + 1}
                    title={e.title}
                    meta={
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {e.city} · {formatEventDate(e.date)}
                      </span>
                    }
                    right={
                      <span className="font-mono text-sm text-cyber-purple">
                        {compactNumber(e.views)}
                      </span>
                    }
                    accent={categoryColor(e.category)}
                  />
                </li>
              ))}
            </ul>
          </Panel>

          <Panel
            title="Топ категорії"
            icon={<Flame className="h-4 w-4 text-cyber-orange" />}
            delay={0.05}
          >
            <ul className="space-y-3">
              {topCats.map((c, idx) => {
                const pct = Math.round((c.count / topCats[0].count) * 100);
                return (
                  <li key={c.category}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white/40 font-mono w-5 light:text-black/40">
                          #{idx + 1}
                        </span>
                        <CategoryIcon
                          category={c.category as never}
                          className="h-3.5 w-3.5"
                        />
                        <span className="text-sm font-medium">{c.label}</span>
                      </div>
                      <span className="font-mono text-xs text-white/60 light:text-black/60">
                        {c.count}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${pct}%` }}
                        viewport={{ once: true }}
                        transition={{
                          duration: 0.9,
                          delay: idx * 0.08,
                          ease: "easeOut",
                        }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: c.fill }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </Panel>

          <Panel
            title="Цього тижня"
            icon={<CalendarClock className="h-4 w-4 text-neon" />}
            delay={0.1}
          >
            {week.length === 0 ? (
              <p className="text-sm text-white/50 mt-4 light:text-black/50">
                Подій цього тижня не заплановано.
              </p>
            ) : (
              <ul className="space-y-2">
                {week.map((e, idx) => (
                  <li key={e.id}>
                    <RowItem
                      rank={idx + 1}
                      title={e.title}
                      meta={
                        <span
                          className="inline-flex items-center gap-1"
                          suppressHydrationWarning
                        >
                          <CalendarClock className="h-3 w-3" />
                          {fromNow(e.date)}
                        </span>
                      }
                      right={
                        <Badge variant="muted" className="text-[10px]">
                          {categoryLabel(e.category)}
                        </Badge>
                      }
                      accent={categoryColor(e.category)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </section>
  );
}

function Panel({
  title,
  icon,
  delay = 0,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  delay?: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 0.4, delay }}
      className="glass rounded-2xl p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-base font-semibold flex items-center gap-2">
          {icon}
          {title}
        </h3>
        <Trophy className="h-4 w-4 text-white/30 light:text-black/30" />
      </div>
      {children}
    </motion.div>
  );
}

function RowItem({
  rank,
  title,
  meta,
  right,
  accent,
}: {
  rank: number;
  title: string;
  meta: React.ReactNode;
  right: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.04] transition-colors light:hover:bg-black/[0.04]">
      <div
        className="relative h-8 w-8 rounded-lg grid place-items-center font-mono text-xs font-bold bg-white/5 border border-white/10 shrink-0 light:bg-black/[0.04] light:border-black/10"
        style={accent ? { color: accent } : undefined}
      >
        {rank}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium truncate">{title}</div>
        <div className="text-[11px] text-white/55 light:text-black/55">
          {meta}
        </div>
      </div>
      <div className="shrink-0">{right}</div>
    </div>
  );
}

export { TrendingUp };
