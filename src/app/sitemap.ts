import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://fartlek.events";
  const now = new Date();
  return [
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
    {
      url: `${base}/#admin`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.5,
    },
  ];
}
