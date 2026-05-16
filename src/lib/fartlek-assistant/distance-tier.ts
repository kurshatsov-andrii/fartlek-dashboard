import type { SportEvent } from "@/types";

/**
 * Пороги (км) узгоджені з промптом асистента:
 * напів ~21, класика ~42.195, ультра > 42.195.
 */
const KM_HALF_MIN = 17;
const KM_HALF_MAX = 24;
/** Класика з урахуванням округлень у дописах. */
const KM_FULL_MIN = 40.8;
const KM_FULL_MAX = 43.2;
const KM_ULTRA_OVER = 43.25;

/**
 * Усі числа-км з фрагмента («42 км», «21,1 км», «42,195 км»).
 */
export function extractKilometersFromText(raw: string): number[] {
  const s = raw.replace(/\u00a0/g, " ");
  const out: number[] = [];
  for (const m of s.matchAll(/(\d{1,3}(?:[,.]\d{1,3})?)\s*(?:км|km)\b/giu)) {
    const n = parseFloat(m[1]!.replace(",", "."));
    if (Number.isFinite(n) && n > 0 && n < 500) out.push(n);
  }
  return uniqSorted(out);
}

function uniqSorted(nums: number[]): number[] {
  return [...new Set(nums)].sort((a, b) => a - b);
}

function hasHalfMarathonCue(text: string): boolean {
  return /\b(?:пів|напів)\s*марафон|півмарафон|полумарафон|half[\s\-–—]*marathon\b/i.test(
    text,
  );
}

function hasUltraCue(text: string): boolean {
  return /\b(?:ультрамараф|\bультра\b|backyard\s*ultra|\bultra\b(?!\s*триат))/iu.test(text);
}

/**
 * Є у події доріжка класичного марафону (~42 км), а не лише напів або коротші дистанції.
 */
export function offeringClassicMarathonDistance(e: SportEvent): boolean {
  const title = e.title ?? "";
  if (hasHalfMarathonCue(title)) return false;

  const kms = uniqSorted([
    ...extractKilometersFromText(title),
    ...extractKilometersFromText(e.distance ?? ""),
    ...extractKilometersFromText(e.description ?? ""),
  ]);

  const hasClassic = kms.some((k) => k >= KM_FULL_MIN && k <= KM_FULL_MAX);
  const onlyShorterRace =
    kms.length > 0 &&
    !hasClassic &&
    Math.max(...kms) <= KM_HALF_MAX &&
    Math.max(...kms) >= KM_HALF_MIN;

  if (kms.some((k) => k >= KM_ULTRA_OVER) || hasUltraCue(title) || e.category === "ultra") {
    return hasClassic;
  }

  if (hasClassic) return true;
  if (onlyShorterRace) return false;

  if (kms.length === 0) {
    if (hasHalfMarathonCue(title)) return false;
    const tl = title.toLowerCase();
    const idx = tl.indexOf("марафон");
    if (idx === -1) return false;
    const prev = tl.slice(Math.max(0, idx - 12), idx);
    if (/пів$|напів$/i.test(prev.trim())) return false;
    return true;
  }

  return false;
}

/** «Марафон» у тексті без префіксу напів-/пів- одразу перед цим коренем (JS `\\b` не працює з кирилицею). */
function titleHasStandaloneMarathonWord(title: string): boolean {
  const tl = title.toLowerCase();
  let idx = tl.indexOf("марафон");
  while (idx !== -1) {
    const prevSlice = tl.slice(Math.max(0, idx - 14), idx);
    if (
      !/(?:^|[^\s])(?:пів|напів)(?:[\u00a0\s\u2011\u2013\u2014-]+)?$/i.test(
        prevSlice,
      )
    ) {
      return true;
    }
    idx = tl.indexOf("марафон", idx + 7);
  }
  return false;
}

/**
 * Дорожній «Біг»: кириличне «марафон» (не в складі напів-/півмарафону) або англ. marathon без half.
 */
export function eventsMarathonFallbackByTitle(
  events: SportEvent[],
): SportEvent[] {
  return events.filter((e) => {
    const blob = `${e.title ?? ""} ${e.distance ?? ""}`;
    if (e.category !== "marathon") return false;
    if (hasHalfMarathonCue(blob)) return false;
    const t = e.title ?? "";
    if (/\bhalf[\s\-–—]*marathon\b/i.test(t)) return false;
    const en =
      /\bmarathon\b/i.test(t) && !/\bhalf[\s\-–—]*marathon\b/i.test(t);
    const uk = titleHasStandaloneMarathonWord(t);
    return uk || Boolean(en);
  });
}

export function offeringHalfMarathonDistance(e: SportEvent): boolean {
  const blob = `${e.title} ${e.distance ?? ""}`.slice(0, 3500);
  if (hasHalfMarathonCue(blob)) return true;
  const kms = uniqSorted([
    ...extractKilometersFromText(e.title ?? ""),
    ...extractKilometersFromText(e.distance ?? ""),
  ]);
  const hasClassic = kms.some((k) => k >= KM_FULL_MIN && k <= KM_FULL_MAX);
  return (
    kms.some((k) => k >= KM_HALF_MIN && k <= KM_HALF_MAX) &&
    !hasClassic
  );
}

export function offeringUltraDistance(e: SportEvent): boolean {
  const blob = `${e.title} ${e.distance ?? ""}`.slice(0, 3500);
  if (hasUltraCue(blob)) return true;
  if (e.category === "ultra") return true;
  const kms = uniqSorted([
    ...extractKilometersFromText(e.distance ?? ""),
    ...extractKilometersFromText(e.description ?? ""),
    ...extractKilometersFromText(e.title ?? ""),
  ]);
  return kms.some((k) => k >= KM_ULTRA_OVER);
}

/** Запит про класику ~42 км. «Напівмарафон» також містить «марафон» — не рахуємо як класику. */
export function userAsksClassicMarathons(userText: string): boolean {
  if (userAsksUltras(userText)) return false;
  if (/(?:пів|напів)\s*марафон|півмарафон|полумарафон|half[\s\-–—]*marathon/i.test(userText))
    return false;
  return /марафон/i.test(userText) || /\bmarathon\b/i.test(userText);
}

export function userAsksHalfMarathons(userText: string): boolean {
  return hasHalfMarathonCue(userText.normalize("NFKC"));
}

export function userAsksUltras(userText: string): boolean {
  return (
    /\bультрамараф/i.test(userText) ||
    /\b(?:^|[\s,])ультра\b/i.test(userText) ||
    /\bultra\b/i.test(userText)
  );
}
