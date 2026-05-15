import type { EventCategory, SportEvent } from "@/types";
import { sportEventPagePath } from "@/lib/event-detail";

const TRAILISH: EventCategory[] = ["trail", "ultra"];

/** Нормалізація для простого матчу запиту користувача. */
function normalizeQuery(s: string): string {
  return s.toLowerCase().trim();
}

/** Чи схоже, що питання про трейл/ультра. */
export function userAsksTrailish(userText: string): boolean {
  const q = normalizeQuery(userText);
  if (!q) return false;
  return (
    /\bтрейл/i.test(userText) ||
    q.includes("trail") ||
    q.includes("ультра") ||
    q.includes("ultra") ||
    q.includes("гірськ") ||
    q.includes("грунт")
  );
}

export function eventPageUrl(
  event: Pick<SportEvent, "slug">,
  siteOrigin: string,
): string {
  const base = siteOrigin.replace(/\/$/, "");
  return `${base}${sportEventPagePath(event)}`;
}

/**
 * Схема для моделі: одна подія на рядок, обмежений обсяг (токени).
 */
export function buildEventsCatalogContext(
  events: SportEvent[],
  opts: {
     /** Origin браузера (https://fartlek-dashboard.vercel.app тощо) */
    siteOrigin: string;
    /** Повідомлення користувача — для вибору фільтра трейл/все */
    lastUserMessage: string;
    maxLines?: number;
    maxChars?: number;
  },
): string {
  const maxLines = opts.maxLines ?? 120;
  const maxChars = opts.maxChars ?? 28_000;

  let list = [...events];
  if (userAsksTrailish(opts.lastUserMessage)) {
    list = list.filter((e) => TRAILISH.includes(e.category));
  }

  const upcomingFirst = (a: SportEvent, b: SportEvent) => {
    if (a.state !== b.state)
      return a.state === "upcoming" ? -1 : 1;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  };
  list.sort(upcomingFirst);

  const lines: string[] = [
    `База посилань на сторінки подій (копіюй у відповіді точно, з цим хостом): ${opts.siteOrigin.replace(/\/$/, "")}`,
    `Джерело: кеш каталогу Fartlek (з Dashboard). Усього подій у вибірці для асистента: ${list.length}.`,
    "Формат рядка: Назва | Дата (ISO) | Місто | Категорія | Статус (upcoming/finished) | URL",
    "---",
  ];

  let count = 0;
  for (const e of list) {
    if (count >= maxLines) break;
    const row = [
      e.title.replace(/\|/g, "·"),
      e.date.slice(0, 10),
      e.city.replace(/\|/g, "·"),
      e.category,
      e.state,
      eventPageUrl(e, opts.siteOrigin),
    ].join(" | ");
    lines.push(row);
    count++;
    const joined = lines.join("\n");
    if (joined.length > maxChars) {
      lines.pop();
      lines.push(
        `… (іде обрізання списку за лімітом символів; показано ${lines.length - 3} подій)`,
      );
      break;
    }
  }

  if (list.length === 0 && userAsksTrailish(opts.lastUserMessage)) {
    return [
      "У каталозі для поточного року немає подій з категоріями trail/ultra (або фільтр дав порожній список).",
      "Можна порадити користувачу відкрити секцію «Події» на сайті й скористатися фільтрами.",
    ].join("\n");
  }

  return lines.join("\n");
}
