import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const EVENT_PRICE_UAH = 100;

// Деталі: і Node, і браузер мають Intl, але реалізації ICU різняться —
// зокрема для UAH сервер може віддати "грн", а клієнт "₴", що ламає
// hydration. Тому використовуємо детермінований ручний формат із
// нерозривним пробілом у ролі розділювача тисяч.
const NBSP = "\u00A0";

const groupThousands = (n: number): string => {
  const rounded = Math.round(n);
  const sign = rounded < 0 ? "-" : "";
  const digits = Math.abs(rounded).toString();
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
  return sign + grouped;
};

export const formatUAH = (n: number): string => `${groupThousands(n)}${NBSP}₴`;

export const formatNumber = (n: number): string => groupThousands(n);

export const compactNumber = (n: number): string => {
  if (n < 1000) return Math.round(n).toString();
  if (n < 1_000_000) {
    const v = n / 1000;
    return (n < 10_000 ? v.toFixed(1) : Math.round(v).toString()) + "K";
  }
  return (n / 1_000_000).toFixed(1) + "M";
};

export const calculateRevenue = (totalEvents: number): number =>
  totalEvents * EVENT_PRICE_UAH;

export const monthLabel = (m: number): string =>
  [
    "Січ",
    "Лют",
    "Бер",
    "Кві",
    "Тра",
    "Чер",
    "Лип",
    "Сер",
    "Вер",
    "Жов",
    "Лис",
    "Гру",
  ][m] ?? "";

export const monthLabelLong = (m: number): string =>
  [
    "Січень",
    "Лютий",
    "Березень",
    "Квітень",
    "Травень",
    "Червень",
    "Липень",
    "Серпень",
    "Вересень",
    "Жовтень",
    "Листопад",
    "Грудень",
  ][m] ?? "";

export const ALL_MONTHS = Array.from({ length: 12 }, (_, i) => i);
