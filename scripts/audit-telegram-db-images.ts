/**
 * Одноразовий аудит `telegram_posts.images`: шукає плейсхолдери, відносні URL, favicon тощо.
 * npm exec tsx --tsconfig tsconfig.json scripts/audit-telegram-db-images.ts
 */

import { config } from "dotenv";
import { resolve } from "node:path";

import { isRejectedStoredTelegramImageUrl } from "@/lib/event-image";
import { canonicalTelegramAssetUrlKey } from "@/lib/telegram-media-urls";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";

config({ path: resolve(process.cwd(), ".env.local") });

function normalizeImages(raw: unknown): string[] {
  if (Array.isArray(raw))
    return raw.filter((x): x is string => typeof x === "string");
  if (typeof raw === "string") {
    try {
      const p = JSON.parse(raw) as unknown;
      return Array.isArray(p)
        ? p.filter((x): x is string => typeof x === "string")
        : [];
    } catch {
      return [];
    }
  }
  return [];
}

const patterns: { id: string; test: (u: string) => boolean }[] = [
  {
    id: "cover-svg",
    test: (u) => u.toLowerCase().includes("telegram-channel-cover.svg"),
  },
  {
    id: "favicon",
    test: (u) => u.toLowerCase().includes("favicon"),
  },
  {
    id: "logo-ish-path",
    test: (u) => /\/logo\b|\/brand\b|logo\.svg/i.test(u),
  },
  {
    id: "relative-or-non-http",
    test: (u) => !/^https?:\/\//i.test(u.trim()),
  },
];

async function main() {
  if (!isSupabaseConfigured()) {
    console.error("Потрібні NEXT_PUBLIC_SUPABASE_URL та SUPABASE_SERVICE_ROLE_KEY у .env.local");
    process.exit(1);
  }

  const sb = getSupabaseAdmin();
  const chunk = 500;
  let from = 0;

  const suspicious: { post_id: number; hits: string[] }[] = [];
  let rejectedInDb = 0;
  /** Скільки дописів містять цей CDN-ключ хоча б раз */
  const urlPostHits = new Map<string, number>();
  let postsWithAnyImage = 0;

  for (;;) {
    const { data, error } = await sb
      .from("telegram_posts")
      .select("post_id,images")
      .order("post_id", { ascending: false })
      .range(from, from + chunk - 1);

    if (error) throw error;
    const rows = (data ?? []) as { post_id: number; images: unknown }[];

    for (const r of rows) {
      const imgs = normalizeImages(r.images);
      const hits = new Set<string>();
      let rowHasRejected = false;

      const keysThisPost = new Set<string>();
      for (const u of imgs) {
        if (isRejectedStoredTelegramImageUrl(u)) rowHasRejected = true;
        if (/^https?:\/\//i.test(u.trim())) {
          keysThisPost.add(canonicalTelegramAssetUrlKey(u));
        }
        for (const p of patterns) {
          if (p.test(u)) {
            hits.add(
              `[${p.id}] ${u.length > 180 ? `${u.slice(0, 180)}…` : u}`,
            );
          }
        }
      }

      if (keysThisPost.size > 0) {
        postsWithAnyImage += 1;
        for (const k of keysThisPost) {
          urlPostHits.set(k, (urlPostHits.get(k) ?? 0) + 1);
        }
      }

      if (rowHasRejected) rejectedInDb += 1;
      if (hits.size > 0)
        suspicious.push({ post_id: r.post_id, hits: [...hits] });
    }

    if (rows.length < chunk) break;
    from += chunk;
  }

  const ratioThreshold = 0.28;
  const dominantCandidates =
    postsWithAnyImage > 0
      ? [...urlPostHits.entries()]
          .map(([url, count]) => ({
            url,
            posts: count,
            ratio: count / postsWithAnyImage,
          }))
          .filter((x) => x.ratio >= ratioThreshold)
          .sort((a, b) => b.ratio - a.ratio)
      : [];

  console.log(
    JSON.stringify(
      {
        totalPostsWithImages: postsWithAnyImage,
        suspiciousRows: suspicious.length,
        rowsWithRejectedUrlsStillStored: rejectedInDb,
        dominantImageCandidatesRatioGte: ratioThreshold,
        dominantImageCandidates: dominantCandidates.slice(0, 25),
        sample: suspicious.slice(0, 50),
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
