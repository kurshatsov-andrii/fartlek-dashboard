import type { ParsedEventFromTelegram, TelegramPost } from "@/types";
import {
  parseTelegramPost,
  parseTelegramPosts,
  TELEGRAM_CHANNEL,
} from "./parser";
import { fetchAllTelegramPreviewPosts } from "./fetch-paginated-posts";
export interface FetchPostsResult {
  channel: typeof TELEGRAM_CHANNEL;
  fetchedAt: string;
  posts: TelegramPost[];
}

export interface ImportResult {
  channel: typeof TELEGRAM_CHANNEL;
  fetchedAt: string;
  count: number;
  parsed: ParsedEventFromTelegram[];
}

export async function fetchChannelPosts(): Promise<FetchPostsResult> {
  try {
    const posts = await fetchAllTelegramPreviewPosts();
    const fetchedAt = new Date().toISOString();
    return {
      channel: TELEGRAM_CHANNEL,
      fetchedAt,
      posts,
    };
  } catch (e) {
    console.error("[fetchChannelPosts]", e);
    return {
      channel: TELEGRAM_CHANNEL,
      fetchedAt: new Date().toISOString(),
      posts: [],
    };
  }
}

export async function importChannelEvents(): Promise<ImportResult> {  const res = await fetchChannelPosts();
  return {
    channel: res.channel,
    fetchedAt: res.fetchedAt,
    count: res.posts.length,
    parsed: parseTelegramPosts(res.posts),
  };
}

export { parseTelegramPost, parseTelegramPosts, TELEGRAM_CHANNEL };
