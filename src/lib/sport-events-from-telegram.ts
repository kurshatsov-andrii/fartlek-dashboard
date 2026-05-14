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
import { sortDistanceTokensDesc, normalizeDistanceLine } from "@/lib/distance-sort";
import { eventSlugFromTitle } from "@/lib/cyrillic-transliterate";

/** Роки відбору дописів: `2026` за замовчуванням або `DASHBOARD_TELEGRAM_TARGET_YEAR_PREFIXES=2026,2027`. */
export function dashboardTargetYearPrefixes(): string[] {
  const raw = process.env.DASHBOARD_TELEGRAM_TARGET_YEAR_PREFIXES?.trim();
  if (!raw)
    return ["2026"];
  const parts = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : ["2026"];
}

function isoMatchesTargetYears(eventIso: string): boolean {
  /** Використовуйте лише префікси року типу «2026» / «2027». */
  return dashboardTargetYearPrefixes().some((p) => eventIso.startsWith(p));
}

/**
 * У дописі явно є мітка дати (як у афішах каналу): рядок «Дата:» / «Date:» тощо.
 * «Дата проведення:» також буває (інакше вимога «\:» не збігається після лише слова «Дата»).
 */
const EXPLICIT_EVENT_DATE_MARKER =
  /^\s*(?:📅\s*)?(?:[Дд]ата(?:\s+(?:старту|забігу|заходу|події|івенту|проведення))?|Date)\s*[:\uFF1A\u2014\u2013\-–]\s*\S/im;

/** Ті самі мітки, що й блок «Коли:» тощо, але в будь‑якій позиції (t.me часто складає афішу з кількох речень в одному рядку). */
const ALT_DATE_LABEL_INLINE =
  /\b(?:Коли|Період(?:\s+проведення)?|Термін|Дати(?:\s+проведення)?|When|Dates?)\s*[:\uFF1A\u2014\u2013\-–]\s*\S/i;

/**
 * Діапазон типу «05.06.2026 - 07.06.2026» — будь‑де в тексті (не лише початок рядка):
 * без цього фільтр відсікує дописи, де перший рядок — лише заголовок.
 */
const INLINE_EVENT_DATE_RANGE =
  /\d{1,2}[.\-/]\d{1,2}[.\-/]\d{4}\s*[\u2013\u2014-]\s*\d{1,2}[.\-/]\d{1,2}[.\-/]\d{4}\b/;

/** «Дата: …» / «Date: …» також посередині рядка. */
const EXPLICIT_DATE_LABEL_INLINE =
  /\b(?:[Дд]ата(?:\s+(?:старту|забігу|заходу|події|івенту|проведення))?|Date)\s*[:\uFF1A\u2014\u2013\-–]\s*\S/i;

/** Рядок лише з підписом «Дата …» без значення тієї самої строк — далі дата окремим рядком. */
const LABEL_ONLY_DATE_HEADER_LINE =
  /^\s*(?:📅\s*)?(?:[Дд]ата(?:\s+(?:старту|забігу|заходу|події|івенту|проведення))?|Date)\s*:?\s*$/i;

const LABEL_ONLY_CALENDAR_LINE = /^\s*📅\s*:?\s*$/i;

function lineHasParsableDate(lineRaw: string): boolean {
  const line = lineRaw.trim();
  if (!line) return false;
  return tryParseDate(line) !== null;
}

function hasExplicitEventDateScheduling(bodyPlain: string): boolean {
  if (EXPLICIT_EVENT_DATE_MARKER.test(bodyPlain)) return true;
  if (EXPLICIT_DATE_LABEL_INLINE.test(bodyPlain)) return true;
  if (ALT_DATE_LABEL_INLINE.test(bodyPlain)) return true;
  if (INLINE_EVENT_DATE_RANGE.test(bodyPlain)) return true;

  const lines = bodyPlain.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";

    const labelCalendarOrDate =
      LABEL_ONLY_DATE_HEADER_LINE.test(line) || LABEL_ONLY_CALENDAR_LINE.test(line);
    if (labelCalendarOrDate) {
      for (let j = i + 1; j < Math.min(lines.length, i + 12); j++) {
        const next = lines[j]?.trim();
        if (!next) continue;
        if (lineHasParsableDate(next)) return true;
      }
    }

    if (/^\s*📅[^\n]+$/.test(line) && lineHasParsableDate(line)) return true;
  }
  return false;
}

function stripStickyFooter(txt: string): string {
  const m = /\n[^\n]*(Надіслати івент|SiS зі знижкою|fartlek_services)\b/i.exec(
    txt,
  );
  if (m && m.index !== undefined && m.index > 40) return txt.slice(0, m.index).trim();
  return txt.trim();
}

function preprocessTelegramBody(post: TelegramPost): string {
  let t = post.text.replace(/[\u200B-\u200D\u2060\uFEFF\u2800]/g, "");
  /** NBSP, тонкий/цифровий пробіл — у превʼю t.me часто «6\u00a0км» замість «6 км». */
  t = t.replace(/[\u00a0\u1680\u2000-\u200a\u202f\u205f\u3000]/g, " ");
  return stripStickyFooter(t);
}

/** Для синку: текст причини, якщо допис не входить до дашборду; інакше `null`. */
export function telegramPostDashboardRejectReason(
  post: TelegramPost,
): string | null {
  const bodyPlain = preprocessTelegramBody(post);
  const meta = parseTelegramPost({ ...post, text: bodyPlain });
  if (!mentionsKilometers(bodyPlain))
    return "нема згадки дистанції (км / km / K / кирилична К)";
  if (!hasExplicitEventDateScheduling(bodyPlain)) {
    return "немає прийнятої мітки дати або діапазону dd.mm.yyyy — dd.mm.yyyy";
  }
  const eventIsoCandidate = meta.date ?? tryParseDate(bodyPlain);
  if (!eventIsoCandidate) return "дату події не вдалося перетворити в ISO з тексту";
  if (!isoMatchesTargetYears(eventIsoCandidate)) {
    const y = dashboardTargetYearPrefixes().join(", ");
    return `дата поза налаштуванням років (${y})`;
  }
  return null;
}

/**
 * Повертає null, якщо допис не потрапляє на дашборд / у кеш таблиці:
 * лише події налаштованих років ISO-дати; згадка км/K та явний блок «Дата» у тексті.
 */
export function parseTelegramPostForDashboard(post: TelegramPost): {
  bodyPlain: string;
  meta: ParsedEventFromTelegram;
  eventIso: string;
} | null {
  const bodyPlain = preprocessTelegramBody(post);
  const reason = telegramPostDashboardRejectReason({
    ...post,
    text: bodyPlain,
  });
  if (reason !== null) return null;

  const meta = parseTelegramPost({ ...post, text: bodyPlain });
  const eventIsoCandidate = meta.date ?? tryParseDate(bodyPlain);
  if (!eventIsoCandidate) return null;
  return { bodyPlain, meta, eventIso: eventIsoCandidate };
}

/**
 * Чи треба зберігати цей допис у `telegram_posts` (фільтр як у парсері дашборду).
 */
export function telegramPostShouldSyncToDb(post: TelegramPost): boolean {
  return telegramPostDashboardRejectReason(post) === null;
}

/**
 * Є згадка дистанції в км / K у тексті допису (умова включення до дашборду).
 * У афішах трапляються кирилична «К» замість латинської K (як «6 К» після VERTICAL тощо)
 * Типові афішні рядки: «6 км», «9 км, 23 км»; також km, K та кирилична «К» після числа.
 */
export function mentionsKilometers(text: string): boolean {
  /** «Число + пробіл(и) + км» — основний кейс каналів (після preprocess і NBSP тощо). */
  if (/\d+[,.]?\d*\s*(км\b|км\.|км,)/iu.test(text)) return true;
  /** лат. k/K, кирилична К/к — окремий токен після числа */
  if (/\b\d+[,.]?\d*\s*[kKКк]\b/u.test(text)) return true;
  if (/\d+[,.]?\d*km\b/iu.test(text)) return true;
  if (/\b\d+[,.]?\d*\s+km\b/i.test(text)) return true;
  /** «23км» без проміжку */
  if (/\d+[,.]?\d*км\b/iu.test(text)) return true;
  /** трейлові блоки каналів: число поруч із міткою дистанції */
  if (
    /\b(?:VERTICAL|LITE|MARATHON|ULTRA|MEDIUM|HALF|SPRINT|Sprint)\b[^\n|\r]{0,60}\d+[,.]?\d*/i.test(
      text,
    )
  )
    return true;
  /** формат таблиць « … | 6 km » */
  if (/\|\s*\d+[,.]?\d*\s*(км|km|[kKКк])(?!\p{L})/iu.test(text)) return true;

  if (/\d+[,.]\d{3}\s*км/iu.test(text)) return true;
  if (
    /\bДистанц[іiї]?\b[^\n]{0,120}(\d+[,.]?\d*\s*[kKКкм]|км)/iu.test(text)
  ) {
    return true;
  }
  return false;
}

/** Збирає збіги на кшталт «10 км», «1км», «21 K», «5 km» — унікальні, до 10. */
function pickDistanceUniqueList(src: string): string[] {
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

  if (unique.length > 0) return unique.slice(0, 10);

  const trailKm =
    /((?:\d+[,.]?\d*\s*[,+]?\s*)+\d+[,.]?\d*)\s*км\b/iu.exec(src);
  if (trailKm?.[0]) {
    const t = trailKm[0].replace(/\s+/g, " ").trim().slice(0, 140);
    return t ? [t] : [];
  }

  return [];
}

function mergeDistanceLists(lists: string[][]): string[] {
  const seen = new Set<string>();
  const merged: string[] = [];
  for (const list of lists) {
    for (const raw of list) {
      let t = raw.replace(/\s+/g, " ").trim();
      if (!t) continue;
      const glued = /^(\d+[,.]?\d*)км\b$/iu.exec(t.replace(/\s/g, ""));
      if (glued?.[1]) t = `${glued[1]} км`;
      const dedupKey = t.toLowerCase().replace(",", ".").replace(/\s/g, "");
      if (seen.has(dedupKey)) continue;
      seen.add(dedupKey);
      merged.push(t);
    }
  }
  return merged;
}

/**
 * Короткий текст для картки: усі дистанції з «Дистанція: …» та з повного тексту допису.
 */
function extractDistanceSnippet(text: string): string | undefined {
  const labelled =
    /\bДистанц[іiї][^:\n]{0,20}:\s*([^\n]+)/iu.exec(text)?.[1]?.trim();
  const fromLabel = labelled ? pickDistanceUniqueList(labelled) : [];
  const fromBody = pickDistanceUniqueList(text);
  const merged = mergeDistanceLists([fromLabel, fromBody]);
  if (merged.length === 0) return undefined;
  const joined = sortDistanceTokensDesc(merged).slice(0, 10).join(" ");
  return normalizeDistanceLine(joined) || undefined;
}

const KYIV_FALLBACK = getCityByName("Київ") ?? {
  name: "Київ",
  region: "Київська область",
  lat: 50.4501,
  lng: 30.5234,
};

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

    /** Первинне посилання на афішу — сторінка аналітики; t.me лишається в CTA. */
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
      parseOrganizerLine(bodyPlain) || TELEGRAM_CHANNEL.displayName;
    const organizerId = `tg-org-${alphaSlug(organizerName)}`;

    const slug = eventSlugFromTitle(title, raw.postId);
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
      telegramPostDate: raw.date,
      featured: false,
      ...(imageAlternates.length ? { imageAlternates } : {}),
    });
  }

  return dedupeRepeatedTelegramEventPosts(out);
}
