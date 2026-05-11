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
    message: "Синхронізовано 8 постів з @aigurtfartlek",
    eventsImported: 8,
    timestamp: new Date(now - 3 * minute).toISOString(),
  },
  {
    id: "log-2",
    source: "manual",
    status: "success",
    message: 'Додано «Львівський зимовий трейл» через дашборд',
    eventsImported: 1,
    timestamp: new Date(now - 47 * minute).toISOString(),
  },
  {
    id: "log-3",
    source: "telegram",
    status: "partial",
    message: "Синхронізовано 6/7 постів (1 без дати — позначено для перевірки)",
    eventsImported: 6,
    timestamp: new Date(now - 4 * hour).toISOString(),
  },
  {
    id: "log-4",
    source: "api",
    status: "success",
    message: "Публічне API віддало стрічку подій (2 431 запит)",
    eventsImported: 0,
    timestamp: new Date(now - 9 * hour).toISOString(),
  },
  {
    id: "log-5",
    source: "telegram",
    status: "success",
    message: "Синхронізовано 5 постів з @aigurtfartlek",
    eventsImported: 5,
    timestamp: new Date(now - 1 * day).toISOString(),
  },
  {
    id: "log-6",
    source: "telegram",
    status: "failed",
    message: "Обмеження від Telegram — повторна спроба через 5 хв",
    eventsImported: 0,
    timestamp: new Date(now - 2 * day - 4 * hour).toISOString(),
  },
  {
    id: "log-7",
    source: "manual",
    status: "success",
    message: 'Додано «Карпатський OCR Battle» через дашборд',
    eventsImported: 1,
    timestamp: new Date(now - 3 * day).toISOString(),
  },
  {
    id: "log-8",
    source: "telegram",
    status: "success",
    message: "Початковий історичний імпорт з @aigurtfartlek",
    eventsImported: 32,
    timestamp: new Date(now - 9 * day).toISOString(),
  },
];
