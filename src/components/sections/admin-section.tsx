"use client";

import Link from "next/link";
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
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { SectionHeader } from "./stats-section";
import { EventCoverImage } from "@/components/event/event-cover-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  computeStats,
  eventsPerMonth,
  monthlyGrowth,
} from "@/lib/analytics";
import { formatUAH, compactNumber } from "@/lib/utils";
import { formatEventDate, fromNow } from "@/lib/date";
import { sportEventPagePath } from "@/lib/event-detail";
import type { ImportLogEntry, SportEvent } from "@/types";
import { TELEGRAM_CHANNEL } from "@/services/telegram";
import { QuickEventSubmitForm } from "@/components/forms/quick-event-submit-form";

/** Для сортування «останніх з Telegram»: час допису, інакше номер допису. */
function telegramRecencyKey(e: SportEvent): number {
  if (e.telegramPostDate) {
    const t = new Date(e.telegramPostDate).getTime();
    if (!Number.isNaN(t)) return t;
  }
  const m = /^evt-tg-(\d+)$/.exec(e.id);
  return m ? Number.parseInt(m[1], 10) : 0;
}

interface AdminSectionProps {
  events: SportEvent[];
  logs: ImportLogEntry[];
}

export function AdminSection({ events, logs }: AdminSectionProps) {
  const router = useRouter();
  const stats = computeStats(events);
  const monthly = eventsPerMonth(events);
  const growth = monthlyGrowth(events);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const recent = useMemo(
    () =>
      [...events]
        .sort(
          (a, b) => telegramRecencyKey(b) - telegramRecencyKey(a),
        )
        .slice(0, 6),
    [events],
  );

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/sync-telegram", { method: "POST" });
      const data = (await res.json()) as {
        ok?: boolean;
        upsertedCount?: number;
        remoteCount?: number;
        fetchedBeforeFilter?: number;
        mode?: string;
        message?: string;
        error?: string;
      };
      if (!res.ok || data.ok === false) {
        setLastSync(data.error ?? `Помилка ${res.status}`);
        return;
      }
      router.refresh();
      if (typeof data.message === "string" && data.message.trim()) {
        setLastSync(
          `${data.message} (${new Date().toLocaleTimeString("uk-UA")})`,
        );
        return;
      }
      const cnt = data.upsertedCount ?? data.remoteCount ?? "—";
      const modeUk =
        data.mode === "incremental"
          ? "нові дописи"
          : data.mode === "bootstrap"
            ? "перше наповнення"
            : "оновлення метрик";
      const detail =
        data.fetchedBeforeFilter != null &&
        data.remoteCount != null &&
        data.upsertedCount != null
          ? ` з каналу ${data.fetchedBeforeFilter}; після фільтру: ${data.remoteCount}; збережено: ${data.upsertedCount}`
          : `: збережено ${cnt} з Telegram`;
      setLastSync(
        `${modeUk}${detail} о ${new Date().toLocaleTimeString("uk-UA")}`,
      );
    } catch {
      setLastSync("Помилка синхронізації — спробуйте ще раз");
    } finally {
      setSyncing(false);
    }
  };

  const scrollToQuickAdd = () => {
    document.getElementById("quick-add-event")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <section
      id="admin-dashboard"
      className="relative scroll-mt-28 md:scroll-mt-32 py-16 md:py-20"
    >
      <div className="container mx-auto px-4">
        <SectionHeader
          eyebrow="Адмін · Аналітика"
          title="Операційний дашборд"
          description="Відстежуйте дохід, стан контенту та пайплайн імпорту з Telegram."
          action={
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto md:justify-end">
              <Button variant="ghost" onClick={handleSync} disabled={syncing}>
                <RefreshCw
                  className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`}
                />
                {syncing ? "Синхронізація..." : "Синхронізувати"}
              </Button>
              <Button type="button" onClick={scrollToQuickAdd}>
                <Plus className="h-4 w-4" />
                Додати подію
              </Button>
            </div>
          }
        />

        <div className="mt-8 flex flex-col gap-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:items-stretch">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="glass rounded-2xl p-6 md:p-7 lg:col-span-8 flex flex-col min-h-[420px] lg:min-h-[460px]"
            >
              <div className="flex items-center justify-between gap-3 mb-5 shrink-0">
                <div>
                  <h3 className="font-display text-lg font-semibold md:text-xl">
                    Місячне зростання
                  </h3>
                  <p className="text-xs md:text-sm text-white/55 mt-0.5">
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
              <div className="w-full h-[280px] sm:h-[300px] lg:h-[310px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={monthly}
                    margin={{ top: 8, right: 12, left: -20, bottom: 4 }}
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
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="rgba(255,255,255,0.35)"
                      fontSize={11}
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
              </div>
            </motion.div>

            <div className="lg:col-span-4 flex flex-col gap-5 h-full min-h-[420px] lg:min-h-[460px]">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="glass rounded-2xl p-6 flex flex-col flex-1 min-h-[180px]"
              >
                <div className="flex items-center justify-between mb-4">
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
                <div className="rounded-xl bg-white/[0.03] border border-white/5 p-4 text-xs font-mono text-white/70 flex-1 flex flex-col justify-center min-h-[100px]">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-neon shrink-0" />
                    <span>@{TELEGRAM_CHANNEL.username}</span>
                  </div>
                  <div className="mt-3 text-white/40 leading-relaxed">
                    Авто-синхронізація що 10 хв · {lastSync ?? "очікування"}
                  </div>
                </div>
                <Button
                  className="mt-4 w-full"
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
                className="glass rounded-2xl p-6 flex flex-col flex-1 min-h-0"
              >
                <div className="flex items-center justify-between mb-4 shrink-0">
                  <h3 className="font-display text-lg font-semibold flex items-center gap-2">
                    <TerminalSquare className="h-4 w-4 text-neon" />
                    Лог імпорту
                  </h3>
                  <Badge variant="muted">{logs.length}</Badge>
                </div>
                <ul className="space-y-3 flex-1 overflow-y-auto min-h-[120px] max-h-[min(360px,42vh)] lg:max-h-none lg:min-h-[160px] pr-1">
                  {logs.map((l) => (
                    <li
                      key={l.id}
                      className="flex items-start gap-3 text-xs"
                    >
                      <StatusIcon status={l.status} />
                      <div className="min-w-0 flex-1">
                        <div className="text-white/85">
                          {l.message}
                        </div>
                        <div className="mt-0.5 flex items-center gap-2 text-white/45">
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
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="glass rounded-2xl p-6 md:p-7 w-full"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-lg font-semibold md:text-xl flex items-center gap-2">
                <ListChecks className="h-5 w-5 text-neon" />
                Останні додані події
              </h3>
              <Badge variant="muted">{recent.length}</Badge>
            </div>
            <ul className="divide-y divide-white/5">
              {recent.map((e) => (
                <li
                  key={e.id}
                  className="py-3.5 md:py-4 flex items-center gap-3 md:gap-4"
                >
                  <EventCoverImage
                    originalSrc={e.image}
                    alt=""
                    loading="lazy"
                    className="h-11 w-11 md:h-12 md:w-12 rounded-lg object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm md:text-[15px] font-medium truncate">
                      {e.title}
                    </div>
                    <div className="text-[11px] md:text-xs text-white/50 mt-0.5">
                      {formatEventDate(e.date)} · {e.city}
                    </div>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1.5">
                    <Badge
                      variant={e.state === "upcoming" ? "neon" : "muted"}
                      className="text-[10px]"
                    >
                      {e.state === "upcoming" ? "майбутня" : "завершена"}
                    </Badge>
                    <Link
                      href={sportEventPagePath(e)}
                      className="text-[10px] md:text-xs font-semibold text-neon hover:text-neon-400 hover:underline underline-offset-2 whitespace-nowrap"
                    >
                      Детальніше
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        <div
          id="quick-add-event"
          className="mt-10 lg:mt-14 scroll-mt-28 md:scroll-mt-32"
        >
          <QuickEventSubmitForm />
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
          className={`h-10 w-10 rounded-xl bg-white/5 border border-white/10 grid place-items-center ${accent}`}
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
      <div className="text-xs text-white/55">{label}</div>
    </motion.div>
  );
}

export { AlertTriangle };
