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
import type { TooltipProps } from "recharts";
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
  backgroundColor: "rgba(10, 10, 10, 0.94)",
  border: "1px solid rgba(255,102,51,0.4)",
  borderRadius: 12,
  padding: "8px 12px",
  fontSize: 12,
  color: "#fff",
  boxShadow: "0 8px 32px rgba(0,0,0,0.55)",
};

function CategoryBarTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload as { label: string; count: number };
  return (
    <div style={tooltipStyle}>
      <div style={{ fontWeight: 600, marginBottom: 6, color: "#ffffff" }}>
        {row.label}
      </div>
      <div style={{ color: "rgba(255,255,255,0.92)" }}>
        Подій:{" "}
        <span
          style={{
            fontVariantNumeric: "tabular-nums",
            fontWeight: 600,
            color: "#ffffff",
          }}
        >
          {row.count}
        </span>
      </div>
    </div>
  );
}

const RADIAN = Math.PI / 180;

function statusPiePercentLabel(props: {
  cx: number;
  cy: number;
  midAngle?: number;
  innerRadius?: number;
  outerRadius?: number;
  percent?: number;
}) {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
  if (
    midAngle == null ||
    innerRadius == null ||
    outerRadius == null ||
    percent == null
  ) {
    return null;
  }
  if (percent < 0.04) return null;
  const ir = Number(innerRadius);
  const or = Number(outerRadius);
  const radius = ir + (or - ir) * 0.55;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="#ffffff"
      textAnchor="middle"
      dominantBaseline="central"
      style={{ fontSize: 13, fontWeight: 600 }}
    >
      {`${Math.round(percent * 100)}%`}
    </text>
  );
}

function StatusPieTooltip({
  active,
  payload,
  total,
}: Pick<TooltipProps<number, string>, "active" | "payload"> & {
  total: number;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const value = Number(item.value);
  const name =
    typeof item.name === "string" ? item.name : String(item.name ?? "");
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div style={tooltipStyle}>
      <div style={{ fontWeight: 600, marginBottom: 6, color: "#ffffff" }}>
        {name}
      </div>
      <div style={{ color: "rgba(255,255,255,0.92)" }}>
        Подій:{" "}
        <span
          style={{
            fontVariantNumeric: "tabular-nums",
            fontWeight: 600,
            color: "#ffffff",
          }}
        >
          {value}
        </span>
      </div>
      <div
        style={{
          marginTop: 6,
          color: "#ffffff",
          fontWeight: 600,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {pct}% від усіх
      </div>
    </div>
  );
}

export function ChartsSection({ events }: ChartsSectionProps) {
  const monthly = eventsPerMonth(events);
  const categories = categoriesDistribution(events);
  const vs = upcomingVsFinished(events);
  const pieStatusTotal = vs.reduce((s, d) => s + d.value, 0);

  return (
    <section
      id="charts"
      className="relative scroll-mt-28 md:scroll-mt-32 py-16 md:py-20"
    >
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
                    <stop offset="0%" stopColor="#ff6633" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="#ff6633" stopOpacity={0} />
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
                  cursor={{ fill: "rgba(255,102,51,0.08)" }}
                />
                <Area
                  type="monotone"
                  dataKey="events"
                  stroke="#ff6633"
                  strokeWidth={2.5}
                  fill="url(#gEvents)"
                  activeDot={{
                    r: 5,
                    fill: "#ff6633",
                    stroke: "#0a0a0a",
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
                    <stop offset="0%" stopColor="#ffeb14" stopOpacity={1} />
                    <stop offset="100%" stopColor="#ff6633" stopOpacity={1} />
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
                  cursor={{ fill: "rgba(255,235,20,0.08)" }}
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
                  content={CategoryBarTooltip}
                  cursor={{ fill: "rgba(255,102,51,0.08)" }}
                  wrapperStyle={{ outline: "none" }}
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
                    <stop offset="0%" stopColor="#ff6633" />
                    <stop offset="100%" stopColor="#e54d1a" />
                  </linearGradient>
                  <linearGradient id="gPie2" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#3a3a3b" />
                    <stop offset="100%" stopColor="#1f1f1f" />
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
                  labelLine={false}
                  label={statusPiePercentLabel}
                >
                  {vs.map((entry, idx) => (
                    <Cell
                      key={entry.name}
                      fill={`url(#gPie${idx + 1})`}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => (
                    <StatusPieTooltip
                      active={active}
                      payload={
                        payload as TooltipProps<number, string>["payload"]
                      }
                      total={pieStatusTotal}
                    />
                  )}
                  wrapperStyle={{ outline: "none" }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  formatter={(name, _entry, index) => {
                    const slice = vs[index];
                    const pct =
                      pieStatusTotal > 0 && slice
                        ? Math.round((slice.value / pieStatusTotal) * 100)
                        : 0;
                    return (
                      <span className="text-xs text-white">
                        {name}
                        <span
                          className="ml-1.5 font-semibold tabular-nums text-white"
                          style={{ fontWeight: 600 }}
                        >
                          {pct}%
                        </span>
                      </span>
                    );
                  }}
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
          <p className="text-xs text-white/55">
            {description}
          </p>
        )}
      </div>
      {children}
    </motion.div>
  );
}
