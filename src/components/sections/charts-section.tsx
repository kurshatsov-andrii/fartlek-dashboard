"use client";

import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SectionHeader } from "./stats-section";
import {
  categoriesDistribution,
  eventsPerMonth,
  upcomingVsFinished,
} from "@/lib/analytics";
import type { SportEvent } from "@/types";
import { formatUAH } from "@/lib/utils";

interface ChartsSectionProps {
  events: SportEvent[];
}

const tooltipStyle = {
  backgroundColor: "rgba(10, 13, 20, 0.92)",
  border: "1px solid rgba(0,255,136,0.4)",
  borderRadius: 12,
  padding: "8px 12px",
  fontSize: 12,
  color: "#fff",
  boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
};

export function ChartsSection({ events }: ChartsSectionProps) {
  const monthly = eventsPerMonth(events);
  const categories = categoriesDistribution(events);
  const vs = upcomingVsFinished(events);

  return (
    <section className="relative py-16 md:py-20">
      <div className="container mx-auto px-4">
        <SectionHeader
          eyebrow="Аналітика"
          title="Інсайти та тренди"
          description="Візуалізація розподілу подій, місячної динаміки та доходу за категоріями."
        />

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-5">
          <ChartCard
            title="Події за місяцями"
            description="Розподіл спортивних подій протягом року"
            delay={0}
          >
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart
                data={monthly}
                margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="gEvents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00ff88" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#00ff88" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  strokeDasharray="2 4"
                  stroke="rgba(255,255,255,0.06)"
                />
                <XAxis
                  dataKey="month"
                  stroke="rgba(255,255,255,0.4)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.4)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={28}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ fill: "rgba(0,255,136,0.06)" }}
                />
                <Area
                  type="monotone"
                  dataKey="events"
                  stroke="#00ff88"
                  strokeWidth={2.5}
                  fill="url(#gEvents)"
                  activeDot={{
                    r: 5,
                    fill: "#00ff88",
                    stroke: "#0a0d14",
                    strokeWidth: 2,
                  }}
                  animationDuration={1200}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Дохід за місяцями (₴)"
            description="Кількість подій × 100 ₴ за розміщення"
            delay={0.05}
          >
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={monthly}
                margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="gRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ffd700" stopOpacity={1} />
                    <stop offset="100%" stopColor="#ff6b35" stopOpacity={1} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  strokeDasharray="2 4"
                  stroke="rgba(255,255,255,0.06)"
                />
                <XAxis
                  dataKey="month"
                  stroke="rgba(255,255,255,0.4)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.4)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={42}
                  tickFormatter={(v) =>
                    v >= 1000 ? `${(v / 1000).toFixed(1)}K` : `${v}`
                  }
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ fill: "rgba(255,215,0,0.06)" }}
                  formatter={(value: number) => [formatUAH(value), "Дохід"]}
                />
                <Bar
                  dataKey="revenue"
                  fill="url(#gRevenue)"
                  radius={[8, 8, 0, 0]}
                  animationDuration={1200}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Категорії подій"
            description="Розподіл за дисциплінами"
            delay={0.1}
          >
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={categories}
                layout="vertical"
                margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  horizontal={false}
                  strokeDasharray="2 4"
                  stroke="rgba(255,255,255,0.06)"
                />
                <XAxis
                  type="number"
                  stroke="rgba(255,255,255,0.4)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  stroke="rgba(255,255,255,0.6)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={80}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ fill: "rgba(0,255,136,0.06)" }}
                />
                <Bar
                  dataKey="count"
                  radius={[0, 8, 8, 0]}
                  animationDuration={1200}
                >
                  {categories.map((c) => (
                    <Cell key={c.category} fill={c.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Майбутні vs Завершені"
            description="Статус усіх подій у системі"
            delay={0.15}
          >
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <defs>
                  <linearGradient id="gPie1" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#00ff88" />
                    <stop offset="100%" stopColor="#00b366" />
                  </linearGradient>
                  <linearGradient id="gPie2" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#3a4258" />
                    <stop offset="100%" stopColor="#252c40" />
                  </linearGradient>
                </defs>
                <Pie
                  data={vs}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  cornerRadius={6}
                  animationDuration={1200}
                  strokeWidth={0}
                >
                  {vs.map((entry, idx) => (
                    <Cell
                      key={entry.name}
                      fill={`url(#gPie${idx + 1})`}
                    />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  formatter={(v) => (
                    <span className="text-white/70 text-xs">{v}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
    </section>
  );
}

function ChartCard({
  title,
  description,
  delay = 0,
  children,
}: {
  title: string;
  description?: string;
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
      <div className="mb-4">
        <h3 className="font-display text-lg font-semibold">{title}</h3>
        {description && (
          <p className="text-xs text-white/55 light:text-black/55">
            {description}
          </p>
        )}
      </div>
      {children}
    </motion.div>
  );
}
