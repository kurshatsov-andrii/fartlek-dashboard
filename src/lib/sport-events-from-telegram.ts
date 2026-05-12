import type {
  EventCategory,
  EventState,
  SportEvent,
  TelegramPost,
} from "@/types";
import { getCityByName } from "@/data/cities";
import { EVENT_COVER_FALLBACK } from "@/lib/event-image";
import {
  parseTelegramPost,
  TELEGRAM_CHANNEL,
  tryParseDate,
} from "@/services/telegram/parser";

const TARGET_EVENT_YEAR_PREFIX = "2026";

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

function extractDistanceSnippet(text: string): string | undefined {
  const line = /\bДистанц[іiї][^:\n]{0,12}:\s*([^\n]+)/iu.exec(text);
  if (line?.[1]) return line[1].trim().slice(0, 140);
  const dash = /\b\d+[,.]?\d*\s*[kKкм]\b[^\n.]*/iu.exec(text);
  if (dash?.[0]) return dash[0].trim().slice(0, 140);
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

export function telegramPostsToSportEvents(posts: TelegramPost[]): SportEvent[] {
  const out: SportEvent[] = [];
  const seenIds = new Set<number>();

  for (const raw of posts) {
    const bodyPlain = stripStickyFooter(
      raw.text.replace(/[\u200B-\u200D\u2060\uFEFF\u2800]/g, ""),
    );
    const forParse: TelegramPost = {
      ...raw,
      text: bodyPlain,
    };
    const meta = parseTelegramPost(forParse);

    if (!mentionsKilometers(bodyPlain)) continue;

    const eventIsoCandidate = meta.date ?? tryParseDate(bodyPlain);
    if (
      !eventIsoCandidate ||
      !eventIsoCandidate.startsWith(TARGET_EVENT_YEAR_PREFIX)
    ) {
      continue;
    }

    const eventIso = eventIsoCandidate;
    const state = eventDateState(eventIso);
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

    const registrationLink =
      meta.registrationLink ?? `https://t.me/${raw.channelId}/${raw.postId}`;

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

    const image = raw.images[0] ?? EVENT_COVER_FALLBACK;
    const distance = extractDistanceSnippet(bodyPlain);

    out.push({
      id,
      title,
      slug,
      description: bodyPlain,
      image,
      date: eventIso,
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
    });
  }

  return out;
}
