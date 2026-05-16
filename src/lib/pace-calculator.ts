/**
 * Розрахунки темпу/часу для бігу: дистанція в км.
 * Час або темп у форматі «ГГ:ХХ:СС», «ХХ:СС», «Х:ХХ:СС».
 */

export function formatMmSs(seconds: number): string {
  if (!Number.isFinite(seconds)) return "—";
  const sRounded = Math.max(0, Math.round(seconds));
  const m = Math.floor(sRounded / 60);
  const sec = sRounded % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export function formatHms(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds)) return "—";
  const sec = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Допустимі лише не від’ємні цілі в кожній частині; «3:06:41», «61:59», «59:59».
 */
export function parseClockToSeconds(text: string): number | null {
  const trimmed = text.replace(/\u00a0/g, " ").trim();
  if (!trimmed) return null;
  const parts = trimmed.split(/[:;.]/).map((p) => p.trim());

  const nums: number[] = [];
  for (const p of parts) {
    if (!/^\d+$/.test(p)) return null;
    const n = parseInt(p, 10);
    if (Number.isNaN(n) || n < 0) return null;
    nums.push(n);
    if (nums.length > 3) return null;
  }
  if (nums.length === 0) return null;

  /** Одна лише секунда малоймовірна для UI — але дозволяємо «90» секунд майданчик */
  if (nums.length === 1) return nums[0]! > 86400 ? null : nums[0]!;
  /** M:S або H:M:S */
  if (nums.length === 2) {
    const [a, b] = nums as [number, number];
    if (b >= 60) return null;
    return a * 60 + b;
  }
  const [hh, mm, ss] = nums as [number, number, number];
  if (mm >= 60 || ss >= 60) return null;
  return hh * 3600 + mm * 60 + ss;
}

export function parseDistanceKm(raw: string): number | null {
  const normalized = raw.replace(",", ".").trim();
  if (!normalized) return null;
  const km = Number.parseFloat(normalized);
  if (!Number.isFinite(km) || km <= 0 || km > 500) return null;
  return km;
}

/** Секунди на км за фінішним часом і дистанцією */
export function computePaceSecondsPerKm(
  distanceKm: number,
  totalSeconds: number,
): number | null {
  if (!(distanceKm > 0) || !(totalSeconds > 0)) return null;
  return totalSeconds / distanceKm;
}

/** Прогнозований час пробігу */
export function computeFinishSeconds(
  distanceKm: number,
  paceSecondsPerKm: number,
): number | null {
  if (!(distanceKm > 0) || !(paceSecondsPerKm > 0)) return null;
  return distanceKm * paceSecondsPerKm;
}
