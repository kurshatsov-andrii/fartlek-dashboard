import { TELEGRAM_CHANNEL } from "./parser";
import { parseTelegramChannelWall } from "./html-preview-parser";
import type { TelegramPost } from "@/types";

const MAX_PAGES = 100;
/** Пауза між запитами, щоб менше наражати endpoint на блокування */
const FETCH_GAP_MS = 280;

async function pause(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

/**
 * Завантажує всі доступні дописи з публічного превʼю каналу (сторінки `?before=postId`).
 * Telegram віддає ~20 записів за раз; точна кількість сторінок залежить від історії каналу.
 */
export async function fetchAllTelegramPreviewPosts(): Promise<TelegramPost[]> {
  const byId = new Map<number, TelegramPost>();
  let before: number | undefined;

  const headers = {
    "User-Agent":
      "Mozilla/5.0 (compatible; FartlekEventsDashboard/1.2; +https://t.me/fartlekua)",
    Accept: "text/html,application/xhtml+xml",
  } as const;

  for (let page = 0; page < MAX_PAGES; page++) {
    const url = before
      ? `${TELEGRAM_CHANNEL.previewUrl}?before=${before}`
      : TELEGRAM_CHANNEL.previewUrl;

    const res = await fetch(url, {
      headers,
      next: { revalidate: 600 },
    });
    if (!res.ok) {
      console.warn(`[fetchAllTelegramPreviewPosts] HTTP ${res.status} for ${url}`);
      break;
    }

    const html = await res.text();
    const batch = parseTelegramChannelWall(html);
    if (batch.length === 0) break;

    let newlyAdded = 0;
    for (const p of batch) {
      if (!byId.has(p.postId)) {
        byId.set(p.postId, p);
        newlyAdded++;
      }
    }

    const oldestOnPage = Math.min(...batch.map((p) => p.postId));
    if (!Number.isFinite(oldestOnPage)) break;

    /** Нема прогресу — ті самі дописи, вихід */
    if (newlyAdded === 0) break;

    /** Наступна сторінка — старіші за найменший id поточної */
    before = oldestOnPage;

    await pause(FETCH_GAP_MS);
  }

  return [...byId.values()].sort((a, b) => b.postId - a.postId);
}
