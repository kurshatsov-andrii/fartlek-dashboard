import type { ParsedEventFromTelegram, TelegramPost } from "@/types";
import {
  parseTelegramPost,
  parseTelegramPosts,
  TELEGRAM_CHANNEL,
} from "./parser";
import { MOCK_TELEGRAM_POSTS } from "./mock-posts";

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

/**
 * In production this would fetch from the Telegram preview endpoint
 *   `https://t.me/s/aigurtfartlek`
 * (server-side, with cache + revalidate) or use the Bot API.
 *
 * For the dashboard demo we return curated mock posts so the parser pipeline
 * can be exercised end-to-end with deterministic data.
 */
export async function fetchChannelPosts(): Promise<FetchPostsResult> {
  // simulate latency in client-side calls
  await new Promise((r) => setTimeout(r, 250));
  return {
    channel: TELEGRAM_CHANNEL,
    fetchedAt: new Date().toISOString(),
    posts: MOCK_TELEGRAM_POSTS,
  };
}

export async function importChannelEvents(): Promise<ImportResult> {
  const res = await fetchChannelPosts();
  return {
    channel: res.channel,
    fetchedAt: res.fetchedAt,
    count: res.posts.length,
    parsed: parseTelegramPosts(res.posts),
  };
}

export { parseTelegramPost, parseTelegramPosts, TELEGRAM_CHANNEL };
export { MOCK_TELEGRAM_POSTS } from "./mock-posts";
