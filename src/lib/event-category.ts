import type { EventCategory, SportEvent } from "@/types";

/** SwimRun / акватлон у назві або тексті афіші. */
export function textIndicatesAquathlon(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  if (/акватлон/i.test(t)) return true;
  return /swim\s*run|swimrun/i.test(t.toLowerCase());
}

/** Triathlon / триатлон у назві або тексті (латиниця та кирилиця). */
export function textIndicatesTriathlon(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  if (/\btriathlon\b/i.test(t)) return true;
  return /\bтриатлон\b/i.test(t) || /крос[\s-]?триатлон/i.test(t);
}

/** Категорія з урахуванням назви та опису (для вже збережених подій у БД). */
export function resolveEventCategory(
  event: Pick<SportEvent, "category" | "title" | "description">,
): EventCategory {
  const probe = `${event.title}\n${event.description ?? ""}`;
  if (textIndicatesAquathlon(probe)) return "aquathlon";
  if (textIndicatesTriathlon(probe)) return "triathlon";
  return event.category;
}
