import type { TelegramPost } from "@/types";
import { isRejectedStoredTelegramImageUrl } from "@/lib/event-image";
import { narrowTelegramPostImagesToSingleCover } from "@/lib/telegram-media-urls";
import { getSupabaseAdmin } from "@/lib/supabase/server";

const TABLE = "telegram_posts";

function sanitizeDbTelegramImages(images: string[]): string[] {
  return narrowTelegramPostImagesToSingleCover(
    images.filter(
      (u) => typeof u === "string" && !isRejectedStoredTelegramImageUrl(u),
    ),
  );
}

type TelegramPostRow = {
  post_id: number;
  channel_id: string;
  channel_name: string;
  text_content: string;
  post_iso_date: string;
  images: unknown;
  links: unknown;
  views: number | null;
  likes: number | null;
  raw_html: string | null;
};

function rowToPost(r: TelegramPostRow): TelegramPost {
  const imagesRaw = Array.isArray(r.images)
    ? (r.images as string[])
    : typeof r.images === "string"
      ? (JSON.parse(r.images) as string[])
      : [];
  const images = sanitizeDbTelegramImages(imagesRaw);
  const links = Array.isArray(r.links)
    ? (r.links as string[])
    : typeof r.links === "string"
      ? (JSON.parse(r.links) as string[])
      : [];
  const postId = Number(r.post_id);
  const channelId = r.channel_id;
  return {
    id: `${channelId}-${postId}`,
    channelId,
    channelName: r.channel_name,
    postId,
    text: r.text_content ?? "",
    date: r.post_iso_date || new Date().toISOString(),
    images,
    links,
    views: Number(r.views ?? 0) || 0,
    likes: Number(r.likes ?? 0) || 0,
    rawHtml: r.raw_html ?? undefined,
  };
}

function postToRow(p: TelegramPost): TelegramPostRow {
  return {
    post_id: p.postId,
    channel_id: p.channelId,
    channel_name: p.channelName,
    text_content: p.text ?? "",
    post_iso_date: p.date ?? new Date().toISOString(),
    images: sanitizeDbTelegramImages(Array.isArray(p.images) ? p.images : []),
    links: p.links ?? [],
    views: p.views ?? 0,
    likes: p.likes ?? 0,
    raw_html: p.rawHtml ?? null,
  };
}

export async function getMaxTelegramPostIdFromDb(): Promise<number | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from(TABLE)
    .select("post_id")
    .order("post_id", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (data == null || data.post_id == null) return null;
  return Number(data.post_id);
}

export async function listTelegramPostsFromDb(): Promise<TelegramPost[]> {
  const supabase = getSupabaseAdmin();
  const chunk = 500;
  let from = 0;
  const all: TelegramPost[] = [];

  for (;;) {
    const { data, error } = await supabase
      .from(TABLE)
      .select(
        "post_id,channel_id,channel_name,text_content,post_iso_date,images,links,views,likes,raw_html",
      )
      .order("post_id", { ascending: false })
      .range(from, from + chunk - 1);

    if (error) throw error;
    const rows = (data ?? []) as TelegramPostRow[];
    for (const r of rows) all.push(rowToPost(r));

    if (rows.length < chunk) break;
    from += chunk;
  }

  return all;
}

export async function getTelegramPostByPostId(
  postId: number,
): Promise<TelegramPost | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from(TABLE)
    .select(
      "post_id,channel_id,channel_name,text_content,post_iso_date,images,links,views,likes,raw_html",
    )
    .eq("post_id", postId)
    .maybeSingle();
  if (error) throw error;
  if (data == null) return null;
  return rowToPost(data as TelegramPostRow);
}

/** Порожнить `telegram_posts`, видаляючи рядки батчами. */
export async function deleteAllTelegramPosts(): Promise<number> {
  const supabase = getSupabaseAdmin();
  let removed = 0;
  const batch = 700;
  for (;;) {
    const { data, error } = await supabase
      .from(TABLE)
      .select("post_id")
      .limit(batch);

    if (error) throw error;
    const rows = data ?? [];
    if (rows.length === 0) break;

    const ids = rows.map((r: { post_id: number }) => Number(r.post_id));
    const { error: delErr } = await supabase
      .from(TABLE)
      .delete()
      .in("post_id", ids);
    if (delErr) throw delErr;

    removed += ids.length;
    if (rows.length < batch) break;
  }
  return removed;
}

export async function getLatestTelegramSyncTimeFromDb(): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from(TABLE)
    .select("synced_at")
    .order("synced_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  const t = (data as { synced_at?: string } | null)?.synced_at;
  return t?.trim() ? t : null;
}

export async function upsertTelegramPosts(
  posts: TelegramPost[],
): Promise<number> {
  if (posts.length === 0) return 0;
  const supabase = getSupabaseAdmin();
  const syncedAt = new Date().toISOString();
  const rows = posts.map((p) => ({
    ...postToRow(p),
    synced_at: syncedAt,
  }));

  const batchSize = 200;
  for (let i = 0; i < rows.length; i += batchSize) {
    const slice = rows.slice(i, i + batchSize);
    const { error } = await supabase.from(TABLE).upsert(slice, {
      onConflict: "post_id",
    });
    if (error) throw error;
  }
  return posts.length;
}

export async function updateTelegramPostImages(
  postId: number,
  images: string[],
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const safe = sanitizeDbTelegramImages(images);
  const { error } = await supabase
    .from(TABLE)
    .update({ images: safe })
    .eq("post_id", postId);
  if (error) throw error;
}

/**
 * Обнуляє `images` для всіх рядків (батчами). Не чіпає `raw_html`, текст тощо.
 */
export async function clearAllTelegramPostImages(): Promise<number> {
  const supabase = getSupabaseAdmin();
  let total = 0;
  const chunk = 400;
  let from = 0;

  for (;;) {
    const { data, error } = await supabase
      .from(TABLE)
      .select("post_id")
      .order("post_id", { ascending: true })
      .range(from, from + chunk - 1);

    if (error) throw error;
    const rows = data ?? [];
    if (rows.length === 0) break;

    const ids = rows.map((r: { post_id: number }) => Number(r.post_id));
    const { error: upErr } = await supabase
      .from(TABLE)
      .update({ images: [] })
      .in("post_id", ids);
    if (upErr) throw upErr;

    total += ids.length;
    if (rows.length < chunk) break;
    from += chunk;
  }

  return total;
}
