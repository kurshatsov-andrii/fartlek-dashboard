/** Обмеження open-redirect для `next` після входу (лише відносний шлях на цьому ж origin). */
export function sanitizeReturnPath(param: string | null, fallback = "/admin"): string {
  const n = (param ?? "").trim();
  if (!n || !n.startsWith("/") || n.startsWith("//")) return fallback;
  return n;
}
