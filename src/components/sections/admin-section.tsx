"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CalendarPlus,
  CheckCircle2,
  CircleAlert,
  Coins,
  Eye,
  ListChecks,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  TerminalSquare,
  XCircle,
} from "lucide-react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useMemo, useState } from "react";
import { SectionHeader } from "./stats-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  computeStats,
  eventsPerMonth,
  monthlyGrowth,
} from "@/lib/analytics";
import { formatUAH, compactNumber } from "@/lib/utils";
import { formatEventDate, fromNow } from "@/lib/date";
import type { ImportLogEntry, SportEvent } from "@/types";
import { TELEGRAM_CHANNEL } from "@/services/telegram";

interface AdminSectionProps {
  events: SportEvent[];
  logs: ImportLogEntry[];
}

export function AdminSection({ events, logs }: AdminSectionProps) {
  const stats = computeStats(events);
  const monthly = eventsPerMonth(events);
  const growth = monthlyGrowth(events);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const recent = useMemo(
    () =>
      [...events]
        .sort(
          (a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime(),
        )
        .slice(0, 6),
    [events],
  );

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/telegram");
      const data = await res.json();
      setLastSync(`Синхронізовано ${data.count ?? 0} постів о ${new Date().toLocaleTimeString("uk-UA")}`);
    } catch {
      setLastSync("Помилка синхронізації — спробуйте ще раз");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <section id="admin" className="relative py-16 md:py-20">
      <div className="container mx-auto px-4">
        <SectionHeader
          eyebrow="Адмін · Аналітика"
          title="Операційний дашборд"
          description="Відстежуйте дохід, стан контенту та пайплайн імпорту з Telegram."
          action={
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={handleSync} disabled={syncing}>
                <RefreshCw
                  className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`}
                />
                {syncing ? "Синхронізація..." : "Синхронізувати"}
              </Button>
              <Button>
                <Plus className="h-4 w-4" />
                Додати подію
              </Button>
            </div>
          }
        />

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-5">
            <KpiCard
              label="Дохід"
              value={formatUAH(stats.revenueUAH)}
              delta="+12.4%"
              direction="up"
              icon={Coins}
              accent="text-cyber-yellow"
            />
            <KpiCard
              label="Події"
              value={stats.totalEvents.toString()}
              delta={`${growth >= 0 ? "+" : ""}${growth}% MoM`}
              direction={growth >= 0 ? "up" : "down"}
              icon={CalendarPlus}
              accent="text-neon"
            />
            <KpiCard
              label="Перегляди"
              value={compactNumber(stats.totalViews)}
              delta="+8.1%"
              direction="up"
              icon={Eye}
              accent="text-cyber-purple"
            />

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="glass rounded-2xl p-5 md:col-span-3"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-display text-lg font-semibold">
                    Місячне зростання
                  </h3>
                  <p className="text-xs text-white/55 light:text-black/55">
                    Кількість подій, створених щомісяця
                  </p>
                </div>
                <Badge variant={growth >= 0 ? "neon" : "danger"}>
                  {growth >= 0 ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {growth >= 0 ? "+" : ""}
                  {growth}% MoM
                </Badge>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart
                  data={monthly}
                  margin={{ top: 4, right: 8, left: -28, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="adGrow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ff6633" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#ff6633" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="month"
                    stroke="rgba(255,255,255,0.35)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="rgba(255,255,255,0.35)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(10,10,10,0.94)",
                      border: "1px solid rgba(255,102,51,0.4)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="events"
                    stroke="#ff6633"
                    strokeWidth={2}
                    fill="url(#adGrow)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="glass rounded-2xl p-5 md:col-span-3"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-lg font-semibold flex items-center gap-2">
                  <ListChecks className="h-4 w-4 text-neon" />
                  Останні додані події
                </h3>
                <Badge variant="muted">{recent.length}</Badge>
              </div>
              <ul className="divide-y divide-white/5 light:divide-black/5">
                {recent.map((e) => (
                  <li
                    key={e.id}
                    className="py-3 flex items-center gap-3"
                  >
                    <img
                      src={e.image}
                      alt=""
                      loading="lazy"
                      className="h-10 w-10 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">
                        {e.title}
                      </div>
                      <div className="text-[11px] text-white/50 light:text-black/50">
                        {formatEventDate(e.date)} · {e.city}
                      </div>
                    </div>
                    <Badge
                      variant={e.state === "upcoming" ? "neon" : "muted"}
                      className="text-[10px]"
                    >
                      {e.state === "upcoming" ? "майбутня" : "завершена"}
                    </Badge>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-5">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="glass rounded-2xl p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display text-lg font-semibold flex items-center gap-2">
                  <Send className="h-4 w-4 text-sky-400" />
                  Telegram-канал
                </h3>
                <a
                  href={TELEGRAM_CHANNEL.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-neon hover:underline"
                >
                  Відкрити
                </a>
              </div>
              <div className="rounded-xl bg-white/[0.03] border border-white/5 p-3 text-xs font-mono text-white/70 light:bg-black/[0.03] light:border-black/5 light:text-black/70">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-neon" />
                  <span>@{TELEGRAM_CHANNEL.username}</span>
                </div>
                <div className="mt-2 text-white/40 light:text-black/40">
                  Авто-синхронізація що 10 хв · {lastSync ?? "очікування"}
                </div>
              </div>
              <Button
                className="mt-3 w-full"
                variant="ghost"
                onClick={handleSync}
                disabled={syncing}
              >
                <RefreshCw
                  className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`}
                />
                Синхронізувати зараз
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="glass rounded-2xl p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display text-lg font-semibold flex items-center gap-2">
                  <TerminalSquare className="h-4 w-4 text-neon" />
                  Лог імпорту
                </h3>
                <Badge variant="muted">{logs.length}</Badge>
              </div>
              <ul className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {logs.map((l) => (
                  <li
                    key={l.id}
                    className="flex items-start gap-3 text-xs"
                  >
                    <StatusIcon status={l.status} />
                    <div className="min-w-0 flex-1">
                      <div className="text-white/85 light:text-black/85">
                        {l.message}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-white/45 light:text-black/45">
                        <span suppressHydrationWarning>
                          {fromNow(l.timestamp)}
                        </span>
                        <span>·</span>
                        <span className="capitalize">{l.source}</span>
                        {l.eventsImported > 0 && (
                          <>
                            <span>·</span>
                            <span className="font-mono text-neon">
                              +{l.eventsImported}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="glass rounded-2xl p-5"
            >
              <h3 className="font-display text-lg font-semibold flex items-center gap-2 mb-3">
                <Plus className="h-4 w-4 text-neon" />
                Швидке додавання
              </h3>
              <form
                className="space-y-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  setLastSync("Подію додано в чергу на модерацію ✓");
                  (e.target as HTMLFormElement).reset();
                }}
              >
                <Input placeholder="Назва події" />
                <Input placeholder="Місто" />
                <Input type="date" />
                <Input placeholder="Посилання на реєстрацію" />
                <Button type="submit" className="w-full">
                  Зберегти подію
                </Button>
                <p className="text-[11px] text-white/40 text-center mt-1 light:text-black/40">
                  100 ₴ за публікацію — оплата після підтвердження.
                </p>
              </form>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatusIcon({
  status,
}: {
  status: ImportLogEntry["status"];
}) {
  if (status === "success")
    return <CheckCircle2 className="h-4 w-4 text-neon shrink-0 mt-0.5" />;
  if (status === "partial")
    return <CircleAlert className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />;
  return <XCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />;
}

function KpiCard({
  label,
  value,
  delta,
  direction,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  delta: string;
  direction: "up" | "down";
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35 }}
      className="glass rounded-2xl p-5"
    >
      <div className="flex items-center justify-between">
        <span
          className={`h-10 w-10 rounded-xl bg-white/5 border border-white/10 grid place-items-center ${accent} light:bg-black/[0.04] light:border-black/10`}
        >
          <Icon className="h-5 w-5" />
        </span>
        <Badge variant={direction === "up" ? "neon" : "danger"}>
          {direction === "up" ? (
            <ArrowUpRight className="h-3 w-3" />
          ) : (
            <ArrowDownRight className="h-3 w-3" />
          )}
          {delta}
        </Badge>
      </div>
      <div className="mt-4 font-display text-3xl font-bold">{value}</div>
      <div className="text-xs text-white/55 light:text-black/55">{label}</div>
    </motion.div>
  );
}

export { AlertTriangle };
