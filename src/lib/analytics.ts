import type { SportEvent, EventCategory } from "@/types";
import { calculateRevenue, monthLabel } from "./utils";

export interface DashboardStats {
  totalEvents: number;
  upcomingEvents: number;
  finishedEvents: number;
  revenueUAH: number;
  organizersCount: number;
  citiesCount: number;
  /** Події, де з тексту афіші вдалося виділити дистанцію */
  eventsWithDistance: number;
  totalViews: number;
}

export const computeStats = (events: SportEvent[]): DashboardStats => {
  const upcoming = events.filter((e) => e.state === "upcoming").length;
  const finished = events.filter((e) => e.state === "finished").length;
  const organizers = new Set(events.map((e) => e.organizerId)).size;
  const cities = new Set(events.map((e) => e.city)).size;
  const withDist = events.filter((e) => Boolean(e.distance?.trim())).length;
  return {
    totalEvents: events.length,
    upcomingEvents: upcoming,
    finishedEvents: finished,
    revenueUAH: calculateRevenue(events.length),
    organizersCount: organizers,
    citiesCount: cities,
    eventsWithDistance: withDist,
    totalViews: events.reduce((s, e) => s + e.views, 0),
  };
};

export interface MonthlyPoint {
  month: string;
  monthIdx: number;
  events: number;
  revenue: number;
}

export const eventsPerMonth = (events: SportEvent[]): MonthlyPoint[] => {
  const buckets = new Map<number, number>();
  for (const e of events) {
    const m = new Date(e.date).getUTCMonth();
    buckets.set(m, (buckets.get(m) ?? 0) + 1);
  }
  return Array.from({ length: 12 }, (_, m) => {
    const count = buckets.get(m) ?? 0;
    return {
      month: monthLabel(m),
      monthIdx: m,
      events: count,
      revenue: calculateRevenue(count),
    };
  });
};

export interface CategoryPoint {
  category: EventCategory | string;
  label: string;
  count: number;
  fill: string;
}

const CATEGORY_LABELS: Record<EventCategory, string> = {
  marathon: "Біг",
  trail: "Трейл",
  ultra: "Ультра",
  cycling: "Велоспорт",
  swimming: "Плавання",
  triathlon: "Триатлон",
  duathlon: "Дуатлон",
  kids: "Дитячий",
  obstacle: "Перешкоди",
};

const CATEGORY_COLORS: Record<EventCategory, string> = {
  marathon: "#ff6633",
  trail: "#ffeb14",
  ultra: "#9b5cff",
  cycling: "#3da5ff",
  swimming: "#22d3ee",
  triathlon: "#ff3d7f",
  duathlon: "#f472b6",
  kids: "#facc15",
  obstacle: "#ff8052",
};

export const categoryLabel = (c: EventCategory): string =>
  CATEGORY_LABELS[c] ?? c;
export const categoryColor = (c: EventCategory): string =>
  CATEGORY_COLORS[c] ?? "#94a3b8";

export const categoriesDistribution = (
  events: SportEvent[],
): CategoryPoint[] => {
  const buckets = new Map<EventCategory, number>();
  for (const e of events) {
    buckets.set(e.category, (buckets.get(e.category) ?? 0) + 1);
  }
  return Array.from(buckets.entries())
    .map(([category, count]) => ({
      category,
      label: CATEGORY_LABELS[category] ?? category,
      count,
      fill: CATEGORY_COLORS[category] ?? "#94a3b8",
    }))
    .sort((a, b) => b.count - a.count);
};

export interface UpcomingVsFinished {
  name: string;
  value: number;
  fill: string;
}

export const upcomingVsFinished = (
  events: SportEvent[],
): UpcomingVsFinished[] => {
  const up = events.filter((e) => e.state === "upcoming").length;
  const fin = events.filter((e) => e.state === "finished").length;
  return [
    { name: "Майбутні", value: up, fill: "#ff6633" },
    { name: "Завершені", value: fin, fill: "#3a3a3b" },
  ];
};

export const monthlyGrowth = (events: SportEvent[]): number => {
  const now = new Date();
  const thisMonth = now.getUTCMonth();
  const lastMonth = (thisMonth - 1 + 12) % 12;
  const points = eventsPerMonth(events);
  const cur = points[thisMonth]?.events ?? 0;
  const prev = points[lastMonth]?.events ?? 0;
  if (prev === 0) return cur > 0 ? 100 : 0;
  return Math.round(((cur - prev) / prev) * 100);
};

export const topByViews = (events: SportEvent[], n: number = 5) =>
  [...events].sort((a, b) => b.views - a.views).slice(0, n);

export const topCategories = (events: SportEvent[], n: number = 5) =>
  categoriesDistribution(events).slice(0, n);

export const upcomingThisWeek = (events: SportEvent[]) => {
  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  return events
    .filter((e) => e.state === "upcoming")
    .filter((e) => {
      const d = new Date(e.date);
      return d >= now && d <= weekFromNow;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};
