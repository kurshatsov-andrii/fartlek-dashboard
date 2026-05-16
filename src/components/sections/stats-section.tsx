"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  Coins,
  Heart,
  MapPin,
  TrendingUp,
} from "lucide-react";
import { AnimatedCounter } from "@/components/widgets/animated-counter";
import { compactNumber, formatUAH } from "@/lib/utils";
import type { DashboardStats } from "@/lib/analytics";

interface StatsSectionProps {
  stats: DashboardStats;
}

const cardBase =
  "group relative glass rounded-2xl p-5 overflow-hidden hover:border-neon/40 transition-all duration-300 hover:-translate-y-1";

export function StatsSection({ stats }: StatsSectionProps) {
  const tiles = [
    {
      label: "Всього подій",
      value: stats.totalEvents,
      icon: CalendarDays,
      accent: "from-neon/30 to-transparent",
      iconColor: "text-neon",
    },
    {
      label: "Майбутні події",
      value: stats.upcomingEvents,
      icon: CalendarClock,
      accent: "from-cyber-blue/30 to-transparent",
      iconColor: "text-cyber-blue",
    },
    {
      label: "Завершені події",
      value: stats.finishedEvents,
      icon: CalendarCheck,
      accent: "from-cyber-purple/30 to-transparent",
      iconColor: "text-cyber-purple",
    },
    {
      label: "Загальний дохід",
      value: stats.revenueUAH,
      icon: Coins,
      accent: "from-cyber-yellow/30 to-transparent",
      iconColor: "text-cyber-yellow",
      format: formatUAH,
      sub: `${stats.totalEvents} × 100 ₴`,
    },
    {
      label: "Організатори",
      value: stats.organizersCount,
      icon: Building2,
      accent: "from-cyber-pink/30 to-transparent",
      iconColor: "text-cyber-pink",
    },
    {
      label: "Міста",
      value: stats.citiesCount,
      icon: MapPin,
      accent: "from-cyber-orange/30 to-transparent",
      iconColor: "text-cyber-orange",
    },
    {
      label: "Вподобання",
      value: stats.totalLikes,
      icon: Heart,
      accent: "from-emerald-400/30 to-transparent",
      iconColor: "text-emerald-400",
      format: (n: number) => compactNumber(n),
    },
    {
      label: "Перегляди",
      value: stats.totalViews,
      icon: TrendingUp,
      accent: "from-sky-400/30 to-transparent",
      iconColor: "text-sky-400",
      format: (n: number) => compactNumber(n),
    },
  ];

  return (
    <section
      id="stats"
      className="relative scroll-mt-28 md:scroll-mt-32 py-16 md:py-20"
    >
      <div className="container mx-auto px-4">
        <SectionHeader
          eyebrow="Огляд"
          title="Статистика платформи"
          description="Аналітика в реальному часі для всіх спортивних подій України. Розміщення однієї події — 100 ₴."
        />

        <div className="mt-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {tiles.map((t, i) => {
            const Icon = t.icon;
            return (
              <motion.div
                key={t.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-15% 0px" }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className={cardBase}
              >
                <div
                  className={`absolute inset-0 -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${t.accent}`}
                />
                <div className="flex items-center justify-between">
                  <div
                    className={`h-10 w-10 rounded-xl bg-white/5 border border-white/10 grid place-items-center ${t.iconColor}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-4 font-display text-3xl md:text-4xl font-bold tracking-tight">
                  <AnimatedCounter value={t.value} format={t.format} />
                </div>
                <div className="mt-1 text-xs text-white/60">
                  {t.label}
                </div>
                {t.sub && (
                  <div className="mt-2 text-[10px] text-white/40 font-mono">
                    {t.sub}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "left",
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  align?: "left" | "center";
  action?: ReactNode;
}) {
  return (
    <div
      className={`flex flex-col gap-3 ${
        align === "center" ? "items-center text-center" : ""
      } md:flex-row md:items-end md:justify-between`}
    >
      <div className={align === "center" ? "max-w-2xl mx-auto" : "max-w-2xl"}>
        {eyebrow && (
          <div className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.18em] text-neon">
            <span className="h-px w-6 bg-neon" />
            {eyebrow}
          </div>
        )}
        <h2 className="mt-3 font-display text-3xl md:text-4xl font-bold tracking-tight">
          {title}
        </h2>
        {description && (
          <p className="mt-2 text-sm md:text-base text-white/60">
            {description}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
