/**
 * Ключ сортування (км): максимум усіх чисел у фрагменті («5+10+21 км» → 21).
 */
export function distanceSortKeyKm(token: string): number {
  const nums = [...token.matchAll(/(\d+[,.]?\d*)/g)]
    .map((m) => parseFloat(m[1].replace(",", ".")))
    .filter((n) => !Number.isNaN(n));
  if (nums.length === 0) return 0;
  return Math.max(...nums);
}

/** Прибирає хвіст «,», «, », «,,» у кінці рядка. */
function stripTrailingCommasFromEnd(s: string): string {
  return s.replace(/(?:,\s*)+$/g, "").trim();
}

/**
 * Нормалізує рядок дистанцій для показу: коми між значеннями → пробіл,
 * зайва кома в кінці вилучається.
 */
export function normalizeDistanceLine(line: string): string {
  return stripTrailingCommasFromEnd(
    line
      .trim()
      .replace(/\s+/g, " ")
      .replace(/, /g, " "),
  );
}

/** Сортує окремі дистанції від більшої до меншої (стабільно при рівних км). */
export function sortDistanceTokensDesc(tokens: string[]): string[] {
  return [...tokens].sort(
    (a, b) => distanceSortKeyKm(b) - distanceSortKeyKm(a),
  );
}

/**
 * Розбиває рядок «42 км 21 км …», сортує та знову з’єднує пробілами.
 * Підходить для показу даних з БД без повторного парсингу допису.
 */
export function sortDistancesDisplayLine(line: string): string {
  const trimmed = normalizeDistanceLine(line);
  if (!trimmed) return "";
  const tokens = trimmed
    .split(/ (?=\d)/)
    .map((t) => stripTrailingCommasFromEnd(t.trim()))
    .filter(Boolean);
  if (tokens.length === 0) return "";
  if (tokens.length === 1) return tokens[0] ?? "";
  return sortDistanceTokensDesc(tokens).join(" ");
}
