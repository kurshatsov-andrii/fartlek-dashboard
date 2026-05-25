import { sportEventAbsoluteUrl } from "@/lib/event-detail";
import { absoluteSiteUrl, getCanonicalSiteUrl } from "@/lib/site-url";
import { fetchTelegramDashboard } from "@/lib/telegram-dashboard-cache";
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticUrls: MetadataRoute.Sitemap = [
    {
      url: getCanonicalSiteUrl(),
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: absoluteSiteUrl("/tools/pace"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.75,
    },
    {
      url: absoluteSiteUrl("/contacts"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.72,
    },
    {
      url: absoluteSiteUrl("/assistant"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
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
