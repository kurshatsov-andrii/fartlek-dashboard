"use client";

import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Eye, Heart, TrendingUp } from "lucide-react";
import type { SportEvent } from "@/types";
import { categoryLabel } from "@/lib/analytics";
import { compactNumber, formatUAH } from "@/lib/utils";
import {
  engagementPercent,
  meanLikes,
  meanViews,
  meanViewsInCategory,
  rankByViews,
} from "@/lib/single-event-analytics";
import { calculateRevenue } from "@/lib/utils";

const tooltipStyle = {
  backgroundColor: "rgba(10, 10, 10, 0.94)",
  border: "1px solid rgba(255,102,51,0.4)",
  borderRadius: 12,
  padding: "8px 12px",
  fontSize: 12,
  color: "#fff",
};

interface EventDetailAnalyticsProps {
  event: SportEvent;
  allEvents: SportEvent[];
}

export function EventDetailAnalytics({
  event,
  allEvents,
}: EventDetailAnalyticsProps) {
  const avg = meanViews(allEvents);
  const avgLikes = meanLikes(allEvents);
  const avgCat = meanViewsInCategory(event, allEvents);
  const rank = rankByViews(event, allEvents);
  const engagement = engagementPercent(event);
  const peersAvgEngagement =
    allEvents.length > 0
      ? (meanLikes(allEvents) / Math.max(1, meanViews(allEvents))) * 100
      : 0;

  const chartData = [
    { name: "Ця подія", Перегляди: event.views },
    { name: "Середнє (усі)", Перегляди: Math.round(avg) },
    { name: `Сер. (${categoryLabel(event.category)})`, Перегляди: Math.round(avgCat) },
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      >
        <div className="glass rounded-2xl p-4 border border-white/10">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-white/45">
            <Eye className="h-3.5 w-3.5 text-cyber-purple" />
            Перегляди
          </div>
          <div className="mt-2 font-mono text-2xl font-bold text-neon tabular-nums">
            {compactNumber(event.views)}
          </div>
          <p className="mt-1 text-[11px] text-white/50">
            #{rank} з {allEvents.length} за охопленням
          </p>
        </div>
        <div className="glass rounded-2xl p-4 border border-white/10">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-white/45">
            <Heart className="h-3.5 w-3.5 text-cyber-pink" />
            Реакції
          </div>
          <div className="mt-2 font-mono text-2xl font-bold text-cyber-pink tabular-nums">
            {compactNumber(event.likes)}
          </div>
          <p className="mt-1 text-[11px] text-white/50">
            сер. по дашборду {compactNumber(Math.round(avgLikes))}
          </p>
        </div>
        <div className="glass rounded-2xl p-4 border border-white/10">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-white/45">
            <TrendingUp className="h-3.5 w-3.5 text-neon" />
            Залученість
          </div>
          <div className="mt-2 font-mono text-2xl font-bold text-white tabular-nums">
            {engagement.toFixed(1)}%
          </div>
          <p className="mt-1 text-[11px] text-white/50">
            реакції / перегляди · сер. {peersAvgEngagement.toFixed(1)}%
          </p>
        </div>
        <div className="glass rounded-2xl p-4 border border-white/10">
          <div className="text-[11px] uppercase tracking-wider text-white/45">
            Умовний KPI
          </div>
          <div className="mt-2 font-mono text-2xl font-bold text-neon tabular-nums">
            {formatUAH(calculateRevenue(1))}
          </div>
          <p className="mt-1 text-[11px] text-white/50">
            модель як на головній (1 подія = 100 ₴)
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.08 }}
        className="glass rounded-2xl p-5 border border-white/10"
      >
        <h2 className="font-display text-lg font-semibold mb-1">
          Порівняння переглядів
        </h2>
        <p className="text-xs text-white/55 mb-4">
          Ця афіша проти середнього по всьому дашборду та по категорії{" "}
          «{categoryLabel(event.category)}».
        </p>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis
                dataKey="name"
                tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
                interval={0}
                angle={-12}
                textAnchor="end"
                height={52}
              />
              <YAxis
                tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }}
                tickFormatter={(v) => compactNumber(Number(v))}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number | string) => [
                  compactNumber(Number(value)),
                  "Перегляди",
                ]}
              />
              <Bar dataKey="Перегляди" fill="#ff6633" radius={[8, 8, 0, 0]} maxBarSize={56} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}
