import type { EventCategory, SportEvent } from "@/types";
import { categoryLabel } from "@/lib/analytics";
import { sportEventPagePath } from "@/lib/event-detail";
import {
  eventsMarathonFallbackByTitle,
  offeringClassicMarathonDistance,
  offeringHalfMarathonDistance,
  offeringUltraDistance,
  userAsksClassicMarathons,
  userAsksHalfMarathons,
  userAsksUltras,
} from "@/lib/fartlek-assistant/distance-tier";

const TRAILISH: EventCategory[] = ["trail", "ultra"];

/** Нормалізація для простого матчу запиту користувача. */
function normalizeQuery(s: string): string {
  return s.toLowerCase().trim();
}

/** Чи користувач явно запитує трейлові забіги (грунт, гора, trail), а не дорожню дистанцію за словом «ультра». */
export function userAsksTrailish(userText: string): boolean {
  const q = normalizeQuery(userText);
  if (!q) return false;
  return (
    /\bтрейл/i.test(userText) ||
    q.includes("trail") ||
    /\b(?:гірськ|офф[-\u2011]?роуд|оффрод)\w*/i.test(userText) ||
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
  const um = opts.lastUserMessage;

  let marathonKmFallbackTitles = false;

  /** Пріоритет: ультра → напів (+ окремий промпт класики) → трейли → загальний список. */
  if (userAsksTrailish(um)) {
    list = list.filter((e) => TRAILISH.includes(e.category));
  } else if (userAsksUltras(um)) {
    list = list.filter(offeringUltraDistance);
  } else if (userAsksHalfMarathons(um)) {
    list = list.filter(offeringHalfMarathonDistance);
  } else if (userAsksClassicMarathons(um)) {
    list = list.filter(offeringClassicMarathonDistance);
    if (list.length === 0) {
      const byTitle = eventsMarathonFallbackByTitle(events);
      if (byTitle.length > 0) {
        list = [...byTitle];
        marathonKmFallbackTitles = true;
      }
    }
  }

  if (list.length === 0 && userAsksUltras(um) && !userAsksTrailish(um)) {
    return [
      "У відфільтрованій вибірці для запиту про ультра-дистанції немає подій із каталогу (нема чисел понад класичну 42 км, мітки ультра тощо).",
      'Можна відкрити розділ «Події» на сайті або уточнити місто/дату.',
    ].join("\n");
  }

  if (list.length === 0 && userAsksHalfMarathons(um)) {
    return [
      "За текстом дописів у каналі не видно напівмарафонських дистанцій (~21 км) для цих рядків каталогу, або каталог було обрізано.",
      'Порадь перевірити картки конкретних стартів на сайті — поле «Дистанція».',
    ].join("\n");
  }

  if (list.length === 0 && userAsksClassicMarathons(um)) {
    return [
      "Строга перевірка на ~42 км у тексті дописів не знайшла рядків; у назві жодної дорожньої («Біг») події в каталозі нема явного слова «марафон» або не вдалося зіставити з запитом.",
      "Не відповідай фразою «Інформація по цьому старту відсутня…» для цього типу загального запиту. Поясни, що календар на сайті у фільтрі «Події» показує більше дорожніх забігів; запропонуй уточнити місто/місяць або відкрити сторінки подій з полем «Дистанція».",
    ].join("\n");
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
    "Поле «Категорія» узгоджене із фільтром «Події»: marathon = «Біг» (дорожній/асфальтовий забіг узагалі, без обов’язку 42 км), trail = «Трейл», ultra = «Ультра», cycling = «Велоспорт», swimming = «Плавання», triathlon = «Триатлон», duathlon = «Дуатлон», kids = «Дитячий», obstacle = «Перешкоди».",
  ];

  if (userAsksClassicMarathons(um) && marathonKmFallbackTitles)
    lines.push(
      "УВАГА для відповіді: явних км ~42 у дописах для добору «класики» недостатньо. Нижче — дорожні старти (категорія «Біг»), де в **назві** є «марафон» без пів-/напівмарафонських міток; дистанцію ~42 км треба **перевірити на лінках/картках подій**. Не стверджуй, що все нижче офіційно 42 км, якщо в колонці км інше або «—».",
    );
  if (userAsksClassicMarathons(um) && !marathonKmFallbackTitles)
    lines.push(
      "Фільтр запиту: лише класичний марафон (~41–43 км або явна доріжка 42 км у тексті дописів; виключені напівмарафони ~21 км і старти без згадки класичної дистанції). Не підміняти «усі дорожні забіги» словом «марафон».",
    );
  if (userAsksHalfMarathons(um))
    lines.push(
      "Фільтр запиту: доречні лише події де з тексту допису видно напів (~17–24 км або мітки пів-/напівмарафон).",
    );
  if (userAsksUltras(um))
    lines.push(
      "Фільтр запиту: доречні лише ультра-дистанції (слова «ультра/ультрамараф» або км понад класичну 42 km, категорія ultra тощо).",
    );

  lines.push(
    "Формат рядка: Назва | Дата (ISO) | Місто | Категорія (код та підпис із фільтра сайту «Біг/Трейл/…») | Дистанції (зі скорочених даних дописів, як є) | Статус (upcoming/finished) | URL",
    "---",
  );

  let count = 0;
  for (const e of list) {
    if (count >= maxLines) break;
    const row = [
      e.title.replace(/\|/g, "·"),
      e.date.slice(0, 10),
      e.city.replace(/\|/g, "·"),
      `${e.category}; ${categoryLabel(e.category)}`.replace(/\|/g, "·"),
      (e.distance ?? "—").replace(/\|/g, "·"),
      e.state,
      eventPageUrl(e, opts.siteOrigin),
    ].join(" | ");
    lines.push(row);
    count++;
    const joined = lines.join("\n");
    if (joined.length > maxChars) {
      lines.pop();
      lines.push(
        `… (обрізання за лімітом символів; у відповіді згадані не всі відфільтровані рядки)`,
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
