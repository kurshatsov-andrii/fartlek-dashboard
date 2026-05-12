import type {
  EventCategory,
  EventState,
  ParsedEventFromTelegram,
  SportEvent,
  TelegramPost,
} from "@/types";
import { getCityByName } from "@/data/cities";
import {
  telegramPostCoverCandidates,
} from "@/lib/telegram-media-urls";
import { EVENT_COVER_FALLBACK } from "@/lib/event-image";
import {
  parseTelegramPost,
  TELEGRAM_CHANNEL,
  tryParseDate,
} from "@/services/telegram/parser";

const TARGET_EVENT_YEAR_PREFIX = "2026";

/**
 * У дописі явно є мітка дати (як у афішах каналу): рядок «Дата:» / «Date:» тощо.
 */
const EXPLICIT_EVENT_DATE_MARKER =
  /^\s*(?:📅\s*)?(?:[Дд]ата(?:\s+(?:старту|забігу|заходу|події|івенту))?|Date)\s*[:\uFF1A\u2014\u2013\-–]\s*\S/im;

/**
 * Повертає null, якщо допис не потрапляє на дашборд / у кеш таблиці:
 * лише події 2026 року, із зазначенням км/K та явною датою в тексті.
 */
export function parseTelegramPostForDashboard(post: TelegramPost): {
  bodyPlain: string;
  meta: ParsedEventFromTelegram;
  eventIso: string;
} | null {
  const bodyPlain = stripStickyFooter(
    post.text.replace(/[\u200B-\u200D\u2060\uFEFF\u2800]/g, ""),
  );
  const meta = parseTelegramPost({ ...post, text: bodyPlain });
  if (!mentionsKilometers(bodyPlain)) return null;
  if (!EXPLICIT_EVENT_DATE_MARKER.test(bodyPlain)) return null;
  const eventIsoCandidate = meta.date ?? tryParseDate(bodyPlain);
  if (
    !eventIsoCandidate ||
    !eventIsoCandidate.startsWith(TARGET_EVENT_YEAR_PREFIX)
  ) {
    return null;
  }
  return { bodyPlain, meta, eventIso: eventIsoCandidate };
}

/**
 * Чи треба зберігати цей допис у `telegram_posts` (фільтр як у парсері дашборду).
 */
export function telegramPostShouldSyncToDb(post: TelegramPost): boolean {
  return parseTelegramPostForDashboard(post) !== null;
}

/**
 * Є згадка дистанції в км / K у тексті допису (умова включення до дашборду 2026 км).
 */
export function mentionsKilometers(text: string): boolean {
  if (/\d+[,.]?\d*\s*(км\b|км\.|км,)/iu.test(text)) return true;
  if (/\b\d{1,3}\s*[kK]\b/i.test(text)) return true;
  if (/\b\d{1,3}\s*km\b/i.test(text)) return true;
  if (/\d+[,.]\d{3}\s*км/iu.test(text)) return true;
  if (
    /\bДистанц[іiї]?\b[^\n]{0,120}(\d+[,.]?\d*\s*[kKкм]|км)/iu.test(text)
  ) {
    return true;
  }
  return false;
}

/**
 * Короткий текст для картки: дистанції з афіші (км / km / K).
 */
function extractDistanceSnippet(text: string): string | undefined {
  const labelled =
    /\bДистанц[іiї][^:\n]{0,20}:\s*([^\n]+)/iu.exec(text)?.[1]?.trim();
  const fromLabel = labelled ? pickDistanceCandidatesFromSlice(labelled) : "";
  const fromBody = pickDistanceCandidatesFromSlice(text);
  const best = fromLabel.trim() || fromBody.trim();
  return best ? best.slice(0, 140) : undefined;
}

/** Збирає збіги на кшталт «10 км», «1км», «21 K», «5 km». */
function pickDistanceCandidatesFromSlice(src: string): string {
  const patterns: RegExp[] = [
    /\d+[,.]?\d*\s*км(?:\.|,)?(?=[\s,;).\]!?…]|$)/giu,
    /\d+[,.]?\d*км\b/giu,
    /\d+[,.]?\d*\s+km\b/gi,
    /\d+[,.]?\d*\s+[kK](?=\s|,|;|$|\)|]|!)/g,
    /\d+[,.]?\d*[kK](?=\s|,|;|$|\)|]|!|[\u0400-\u04FF])/g,
  ];

  const seen = new Set<string>();
  const unique: string[] = [];

  const pushFormatted = (raw: string) => {
    let t = raw.replace(/\s+/g, " ").trim();
    if (!t) return;
    const glued = /^(\d+[,.]?\d*)км\b$/iu.exec(t.replace(/\s/g, ""));
    if (glued?.[1]) t = `${glued[1]} км`;
    const dedupKey = t.toLowerCase().replace(",", ".").replace(/\s/g, "");
    if (seen.has(dedupKey)) return;
    seen.add(dedupKey);
    unique.push(t);
  };

  for (const re of patterns) {
    re.lastIndex = 0;
    for (const m of src.matchAll(re)) pushFormatted(m[0]);
  }

  if (unique.length > 0) return unique.slice(0, 10).join(", ");

  const trailKm =
    /((?:\d+[,.]?\d*\s*[,+]?\s*)+\d+[,.]?\d*)\s*км\b/iu.exec(src);
  if (trailKm?.[0])
    return trailKm[0].replace(/\s+/g, " ").trim().slice(0, 140);

  return "";
}

const KYIV_FALLBACK = getCityByName("Київ") ?? {
  name: "Київ",
  region: "Київська область",
  lat: 50.4501,
  lng: 30.5234,
};

function stripStickyFooter(txt: string): string {
  const m = /\n[^\n]*(Надіслати івент|SiS зі знижкою|fartlek_services)\b/i.exec(
    txt,
  );
  if (m && m.index !== undefined && m.index > 40) return txt.slice(0, m.index).trim();
  return txt.trim();
}

function parseOrganizerLine(text: string): string | null {
  const m =
    /^Організатор(?:и)?\s*:\s*([^\n]+)/mi.exec(text) ??
    /^Организатор(?:ы)?\s*:\s*([^\n]+)/mi.exec(text);
  return m?.[1]?.replace(/\s{2,}/g, " ").trim() ?? null;
}

export function inferEventCategory(postText: string): EventCategory {
  const pt = postText;
  const low = pt.toLowerCase();
  if (/#\s*дуатлон\b|дуатлон/i.test(pt)) return "duathlon";
  if (/крос.?триатлон|#\s*триатлон\b|\bтриатлон\b/i.test(pt)) return "triathlon";
  if (/swimrun|swim\s*&?\s*run|#\s*акватлон/i.test(low)) return "triathlon";
  if (/#\s*вело\b|🚴|\.вело\b/i.test(pt)) return "cycling";
  if (/#\s*плавання\b|\bплавання\b|🏊/i.test(pt)) return "swimming";
  if (/#\s*трейл\b|трейл(?!-б)|trail\s*battle|\btrail\b/i.test(low)) return "trail";
  if (/#\s*ocr\b|перешкод|#\s*kordon/i.test(low)) return "obstacle";
  if (/#\s*дитяч\b|дитяч(ий|ої)?\s*забіг/i.test(low)) return "kids";
  if (/\bультра\b|#\s*ультра\b|backyard\s*ultra/i.test(low)) return "ultra";
  return "marathon";
}

function alphaSlug(input: string): string {
  const s = input
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return s.length > 0 ? s : "org";
}

function slugFromTitle(title: string, postId: number): string {
  const base = title
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]+/gu, " ")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 96);
  return `${base.length > 3 ? base : "event"}-${postId}`;
}

function eventDateState(eventIso: string): EventState {
  const t = new Date(eventIso).getTime();
  if (Number.isNaN(t)) return "upcoming";
  return t < Date.now() ? "finished" : "upcoming";
}

function fallbackTitleFromText(post: TelegramPost, body: string): string {
  const line =
    body
      .split("\n")
      .map((s) =>
        s
          .trim()
          .replace(/[\u200B-\u200D\u2060\uFEFF\u2800]/g, "")
          .replace(/^\([^)]*\)\s*/, ""),
      )
      .find((s) => s.length >= 3 && !/^(Дата|Місто|Організатор)/i.test(s)) ?? "";
  return line.slice(0, 200) || `Допис Telegram #${post.postId}`;
}

function normalizeForDedup(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Ключ «та сама афішна подія» для кількох дописів у каналі про один забіг / дату / місто */
function sportEventDuplicateKey(event: SportEvent): string {
  const day =
    /^(\d{4}-\d{2}-\d{2})/u.exec(event.date)?.[1] ??
    event.date.trim().slice(0, 10);
  const cityKey = normalizeForDedup(event.city);
  const titleKey = normalizeForDedup(event.title);
  return `${day}|${cityKey}|${titleKey}`;
}

function telegramPostIdFromEvent(event: SportEvent): number {
  const m = /^evt-tg-(\d+)$/.exec(event.id);
  return m ? Number.parseInt(m[1], 10) : -1;
}

function dedupeRepeatedTelegramEventPosts(events: SportEvent[]): SportEvent[] {
  if (events.length <= 1) return events;

  /** Для групи-дублікатів лишаємо допис із більшим post_id новіших нагадувань / підсумкових дописів. */

  const bestByKey = new Map<string, SportEvent>();

  for (const e of events) {
    const k = sportEventDuplicateKey(e);
    const prev = bestByKey.get(k);
    if (
      !prev ||
      telegramPostIdFromEvent(e) > telegramPostIdFromEvent(prev)
    ) {
      bestByKey.set(k, e);
    }
  }

  const seen = new Set<string>();
  const out: SportEvent[] = [];
  for (const e of events) {
    const k = sportEventDuplicateKey(e);
    if (seen.has(k)) continue;
    seen.add(k);

    out.push(bestByKey.get(k)!);
  }

  return out;
}

export function telegramPostsToSportEvents(posts: TelegramPost[]): SportEvent[] {
  const out: SportEvent[] = [];
  const seenIds = new Set<number>();

  for (const raw of posts) {
    const extracted = parseTelegramPostForDashboard(raw);
    if (!extracted) continue;
    const { bodyPlain, meta, eventIso } = extracted;

    const eventIsoParsed = eventIso;
    const state = eventDateState(eventIsoParsed);
    const title =
      meta.title?.trim()?.slice(0, 220) ?? fallbackTitleFromText(raw, bodyPlain);

    const city = meta.city?.trim() || "Україна";
    const cityRow =
      getCityByName(city) ??
      (city === "Україна" || city.includes("Україн") ? KYIV_FALLBACK : undefined);
    const region = cityRow?.region ?? KYIV_FALLBACK.region;
    const coordinates = cityRow ?? {
      lat: KYIV_FALLBACK.lat,
      lng: KYIV_FALLBACK.lng,
    };

    const category = inferEventCategory(bodyPlain);

    /** Кнопки «Реєстрація» / «Результати» ведуть на сам допис каналу. */
    const registrationLink = `https://t.me/${raw.channelId}/${raw.postId}`;

    const hashtagRaw = bodyPlain.match(/#([^\s#]+)/g) ?? [];
    const tags = Array.from(
      new Set(
        hashtagRaw.map((h) =>
          h
            .slice(1)
            .toLowerCase()
            .replace(/[.,;!?]+$/gu, ""),
        ).filter(Boolean),
      ),
    ).slice(0, 16);

    const organizerName =
      parseOrganizerLine(bodyPlain)?.slice(0, 180) ?? TELEGRAM_CHANNEL.displayName;
    const organizerId = `tg-org-${alphaSlug(organizerName)}`;

    const slug = slugFromTitle(title, raw.postId);
    const id = `evt-tg-${raw.postId}`;
    if (seenIds.has(raw.postId)) continue;
    seenIds.add(raw.postId);

    const coverCandidates = telegramPostCoverCandidates(raw);
    const image = coverCandidates[0] ?? EVENT_COVER_FALLBACK;
    const imageAlternates = coverCandidates
      .slice(1)
      .filter((u) => u !== EVENT_COVER_FALLBACK);
    const distance = extractDistanceSnippet(bodyPlain);

    out.push({
      id,
      title,
      slug,
      description: bodyPlain,
      image,
      date: eventIsoParsed,
      city,
      region,
      coordinates,
      category,
      status: state === "finished" ? "finished" : "registration_open",
      state,
      registrationLink,
      organizerId,
      organizerName,
      likes: Number.isFinite(raw.likes) ? raw.likes : 0,
      views: Number.isFinite(raw.views) ? raw.views : 0,
      tags,
      distance,
      featured: false,
      ...(imageAlternates.length ? { imageAlternates } : {}),
    });
  }

  return dedupeRepeatedTelegramEventPosts(out);
}
