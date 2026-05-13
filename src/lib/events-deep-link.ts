/** Посилання на головну з секцією подій, відфільтрованою за містом. */
export function eventsSectionHrefForCity(cityName: string): string {
  return `/?city=${encodeURIComponent(cityName)}#events`;
}
