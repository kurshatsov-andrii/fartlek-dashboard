/**
 * Telegram channel post parser
 *
 * In a real deployment we would either:
 *  1) Use the Telegram Bot API / MTProto via a server-side worker, OR
 *  2) Use the public `t.me/s/{channel}` HTML preview endpoint and parse it
 *     server-side with a tolerant HTML parser (e.g. cheerio / linkedom).
 *
 * For now, this module exposes:
 *  - A pure, dependency-free heuristic extractor that turns raw Telegram post
 *    text into a structured `ParsedEventFromTelegram` object.
 *  - A small confidence scoring system so the admin UI can flag low-quality
 *    imports for manual review.
 *
 * Plug in real HTML/JSON ingestion in `fetchChannelPosts` and feed each post's
 * `text` and `images` into `parseTelegramPost` — the rest is transport-agnostic.
 */

import type { ParsedEventFromTelegram, TelegramPost } from "@/types";
import { UKRAINE_CITIES } from "@/data/cities";
import { FARTLEK_PUBLIC_TELEGRAM_URL } from "@/lib/fartlek-telegram-public";

export const TELEGRAM_CHANNEL = {
  username: "fartlekua",
  url: FARTLEK_PUBLIC_TELEGRAM_URL,
  previewUrl: FARTLEK_PUBLIC_TELEGRAM_URL.replace(
    "https://t.me/",
    "https://t.me/s/",
  ),
  displayName: "Фартлек 🇺🇦 Спортівенти",
  description:
    "Афіша спортивних івентів в Україні: біг, велоспорт, плавання, триатлон, дуатлон, акватлон, трейл, OCR, орієнтування.",
};

export const TG_TEXT_URL_REGEX = /https?:\/\/[\w./?=&%#:+\-]+/gi;

// Common Ukrainian + English date patterns:
//  • 12 червня 2026
//  • 12.06.2026 / 12-06-2026 / 12/06/26
//  • June 12, 2026 / 12 June 2026
const DATE_REGEXES: RegExp[] = [
  /\b(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{2,4})\b/,
  /\b(\d{1,2})\s+(січня|лютого|березня|квітня|травня|червня|липня|серпня|вересня|жовтня|листопада|грудня)\s+(\d{4})\b/i,
  /\b(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})\b/i,
  /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2}),?\s+(\d{4})\b/i,
];

const UKR_MONTHS: Record<string, number> = {
  січня: 0,
  лютого: 1,
  березня: 2,
  квітня: 3,
  травня: 4,
  червня: 5,
  липня: 6,
  серпня: 7,
  вересня: 8,
  жовтня: 9,
  листопада: 10,
  грудня: 11,
};

const EN_MONTHS: Record<string, number> = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
};

// Карта Latin → Cyrillic назв міст для розпізнавання змішаних постів.
const CITY_ALIASES: Record<string, string> = {
  Kyiv: "Київ",
  Kiev: "Київ",
  Lviv: "Львів",
  Kharkiv: "Харків",
  Odesa: "Одеса",
  Odessa: "Одеса",
  Одеси: "Одеса",
  Dnipro: "Дніпро",
  Zaporizhzhia: "Запоріжжя",
  Vinnytsia: "Вінниця",
  "Ivano-Frankivsk": "Івано-Франківськ",
  Ternopil: "Тернопіль",
  Chernivtsi: "Чернівці",
  Uzhhorod: "Ужгород",
  Rivne: "Рівне",
  Lutsk: "Луцьк",
  Cherkasy: "Черкаси",
  Poltava: "Полтава",
  Sumy: "Суми",
  Khmelnytskyi: "Хмельницький",
  Mykolaiv: "Миколаїв",
  Kherson: "Херсон",
  Bukovel: "Буковель",
  Yaremche: "Яремче",
  Truskavets: "Трускавець",
};

export function tryParseDate(text: string): string | null {
  for (const re of DATE_REGEXES) {
    const m = text.match(re);
    if (!m) continue;

    // dd.mm.yyyy
    if (re === DATE_REGEXES[0] && m[1] && m[2] && m[3]) {
      const day = parseInt(m[1], 10);
      const month = parseInt(m[2], 10) - 1;
      let year = parseInt(m[3], 10);
      if (year < 100) year += 2000;
      const d = new Date(Date.UTC(year, month, day, 8, 0, 0));
      if (!isNaN(d.getTime())) return d.toISOString();
    }

    // dd <ukr month> yyyy
    if (re === DATE_REGEXES[1] && m[1] && m[2] && m[3]) {
      const day = parseInt(m[1], 10);
      const month = UKR_MONTHS[m[2].toLowerCase()];
      const year = parseInt(m[3], 10);
      if (typeof month === "number") {
        return new Date(Date.UTC(year, month, day, 8, 0, 0)).toISOString();
      }
    }

    // dd <en month> yyyy
    if (re === DATE_REGEXES[2] && m[1] && m[2] && m[3]) {
      const day = parseInt(m[1], 10);
      const month = EN_MONTHS[m[2].toLowerCase()];
      const year = parseInt(m[3], 10);
      if (typeof month === "number") {
        return new Date(Date.UTC(year, month, day, 8, 0, 0)).toISOString();
      }
    }

    // <en month> dd, yyyy
    if (re === DATE_REGEXES[3] && m[1] && m[2] && m[3]) {
      const month = EN_MONTHS[m[1].toLowerCase()];
      const day = parseInt(m[2], 10);
      const year = parseInt(m[3], 10);
      if (typeof month === "number") {
        return new Date(Date.UTC(year, month, day, 8, 0, 0)).toISOString();
      }
    }
  }
  return null;
}

function tryParseCity(text: string): string | null {
  for (const c of UKRAINE_CITIES) {
    if (text.includes(c.name)) return c.name;
  }
  for (const alias of Object.keys(CITY_ALIASES)) {
    if (text.toLowerCase().includes(alias.toLowerCase())) {
      return CITY_ALIASES[alias];
    }
  }
  return null;
}

/**
 * Рядок афіші «Місто: Пилипець, Закарпатська область» — беремо населений пункт до коми/крапки з комою.
 */
function tryParseCityFromLabeledLine(text: string): string | null {
  const re =
    /(?:^|\n)\s*(?:📍\s*)?(?:Місто|Місце\s*проведення|Локація|Де|Location)\s*[:：]\s*([^\n]+)/imu;
  const m = re.exec(text);
  if (!m?.[1]) return null;
  const segment = m[1].trim().replace(/\s*#.*$/u, "").trim();
  const beforeSep =
    segment.split(/[,;:]/)[0]?.replace(/\s+/g, " ").trim() ?? "";
  const cityPart = beforeSep.replace(/\s*\([^)]*\)\s*$/u, "").trim();
  if (cityPart.length >= 2 && cityPart.length <= 80) return cityPart;
  return null;
}

function cleanCandidateTitle(raw: string): string {
  let s = raw.trim();
  // Strip zero-width chars Telegram preview uses as artwork anchors.
  s = s.replace(/[\u200B-\u200D\u2060\uFEFF\u2800]/g, "");
  s = s.trimStart();
  // Strip a leading "(http...)" or "http..." link prefix the preview anchor adds.
  s = s.replace(/^\(?https?:\/\/[^\s)]+\)?\s*/, "");
  // Drop emoji clusters used as flair on the same line.
  s = s.replace(
    /[\u{1F300}-\u{1FAFF}\u{1F000}-\u{1F2FF}\u2600-\u27BF\uFE0F\u{1F1E6}-\u{1F1FF}]/gu,
    "",
  );
  s = s.replace(/\s+/g, " ").trim();
  // Drop label-only lines like "Дата:" / "Місто:" — these are not titles.
  if (/^(дата|організатор|організатори|місто|де|час старту|дистанції?|маршрут)\s*:/i.test(s)) {
    return "";
  }
  return s;
}

function tryParseTitle(text: string): string | null {
  const lines = text.split(/\n+/);
  for (const line of lines) {
    const cleaned = cleanCandidateTitle(line);
    if (cleaned.length >= 4 && cleaned.length <= 140) return cleaned;
  }
  // fallback: first non-empty cleaned line, even if very short.
  for (const line of lines) {
    const cleaned = cleanCandidateTitle(line);
    if (cleaned) return cleaned.slice(0, 140);
  }
  return null;
}

function tryParseRegistration(links: string[], text: string): string | null {
  const all = [...links];
  const matches = text.match(TG_TEXT_URL_REGEX);
  if (matches) all.push(...matches);
  if (all.length === 0) return null;

  // Prefer URLs that look like registration / signup / reg / form links.
  const priorityKeywords = [
    "reg",
    "register",
    "signup",
    "sign-up",
    "entry",
    "form",
    "race",
    "starta",
    "start.",
  ];
  for (const url of all) {
    const lower = url.toLowerCase();
    if (priorityKeywords.some((k) => lower.includes(k))) return url;
  }
  return all[0];
}

function tryParseDescription(text: string, title: string | null): string {
  const cleaned = text
    .replace(TG_TEXT_URL_REGEX, "")
    .replace(/[#@]\w+/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (title) {
    const without = cleaned.replace(title, "").trim();
    return without.slice(0, 16000) || cleaned.slice(0, 16000);
  }
  return cleaned.slice(0, 16000);
}

export function parseTelegramPost(
  post: TelegramPost,
): ParsedEventFromTelegram {
  const title = tryParseTitle(post.text);
  const date = tryParseDate(post.text);
  const city =
    tryParseCityFromLabeledLine(post.text) ?? tryParseCity(post.text);
  const links = post.text.match(TG_TEXT_URL_REGEX) ?? [];
  const allLinks = Array.from(new Set([...(post.links ?? []), ...links]));
  const registrationLink = tryParseRegistration(allLinks, post.text);
  const description = tryParseDescription(post.text, title);

  // Confidence is a simple sum of recognized fields.
  let confidence = 0;
  if (title) confidence += 0.25;
  if (date) confidence += 0.3;
  if (city) confidence += 0.2;
  if (registrationLink) confidence += 0.15;
  if (post.images.length > 0) confidence += 0.1;

  return {
    source: "telegram",
    channelUrl: TELEGRAM_CHANNEL.url,
    postId: post.postId,
    title,
    date,
    description: description || null,
    city,
    registrationLink,
    images: post.images,
    rawText: post.text,
    parsedAt: new Date().toISOString(),
    confidence: Math.min(1, confidence),
  };
}

export function parseTelegramPosts(
  posts: TelegramPost[],
): ParsedEventFromTelegram[] {
  return posts.map(parseTelegramPost);
}
