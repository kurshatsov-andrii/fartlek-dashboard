import { sportEventAbsoluteUrl } from "@/lib/event-detail";
import { fetchTelegramDashboard } from "@/lib/telegram-dashboard-cache";
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://fartlek.events";
  const now = new Date();
  const staticUrls: MetadataRoute.Sitemap = [
    {
      url: base,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${base}/#events`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${base}/#calendar`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  let eventUrls: MetadataRoute.Sitemap = [];
  try {
    const { events } = await fetchTelegramDashboard();
    eventUrls = events.map((e) => ({
      url: sportEventAbsoluteUrl(e),
      lastModified: e.telegramPostDate ? new Date(e.telegramPostDate) : now,
      changeFrequency: "weekly" as const,
      priority: 0.65,
    }));
  } catch {
    // Напр. без env під час збірки — лишаємо лише статичні URL
  }

  return [...staticUrls, ...eventUrls];
}
