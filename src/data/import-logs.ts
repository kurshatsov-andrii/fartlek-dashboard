import type { ImportLogEntry } from "@/types";

const now = Date.now();
const minute = 60_000;
const hour = 60 * minute;
const day = 24 * hour;

export const IMPORT_LOGS: ImportLogEntry[] = [
  {
    id: "log-1",
    source: "telegram",
    status: "success",
    message: "Синхронізовано 20 нових постів з @fartlekua (1957-1976)",
    eventsImported: 18,
    timestamp: new Date(now - 4 * minute).toISOString(),
  },
  {
    id: "log-2",
    source: "telegram",
    status: "success",
    message: "Імпортовано подію «40-ий BRAVE» (пост #1976)",
    eventsImported: 1,
    timestamp: new Date(now - 35 * minute).toISOString(),
  },
  {
    id: "log-3",
    source: "manual",
    status: "success",
    message: "Адмін позначив подію «Київський марафон Незламності» як рекомендовану",
    eventsImported: 0,
    timestamp: new Date(now - 2 * hour).toISOString(),
  },
  {
    id: "log-4",
    source: "telegram",
    status: "partial",
    message: "Синхронізовано 12/14 постів з @fartlekua (2 без дати — на перевірку)",
    eventsImported: 12,
    timestamp: new Date(now - 6 * hour).toISOString(),
  },
  {
    id: "log-5",
    source: "api",
    status: "success",
    message: "Публічне API віддало стрічку подій (4 218 запитів)",
    eventsImported: 0,
    timestamp: new Date(now - 11 * hour).toISOString(),
  },
  {
    id: "log-6",
    source: "telegram",
    status: "success",
    message: "Синхронізовано 8 постів з @fartlekua (1948-1955)",
    eventsImported: 8,
    timestamp: new Date(now - 1 * day).toISOString(),
  },
  {
    id: "log-7",
    source: "telegram",
    status: "failed",
    message: "Telegram повернув 429 (rate limit) — повторна спроба через 5 хв",
    eventsImported: 0,
    timestamp: new Date(now - 2 * day - 3 * hour).toISOString(),
  },
  {
    id: "log-8",
    source: "manual",
    status: "success",
    message: "Імпортовано «MHP Run4Victory Київ марафон» через дашборд",
    eventsImported: 1,
    timestamp: new Date(now - 3 * day).toISOString(),
  },
  {
    id: "log-9",
    source: "telegram",
    status: "success",
    message: "Початковий історичний імпорт каналу @fartlekua (1896-1947)",
    eventsImported: 52,
    timestamp: new Date(now - 9 * day).toISOString(),
  },
];
