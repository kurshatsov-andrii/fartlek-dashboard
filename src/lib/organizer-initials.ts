import { transliterateCyrillicToLatinSource } from "@/lib/cyrillic-transliterate";

/**
 * Дві літери A–Z для «кружка» організатора: з транслітерованої назви,
 * або з наявних латинських символів у рядку.
 */
export function organizerLatinInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "OR";

  const latin = transliterateCyrillicToLatinSource(trimmed);
  const words = latin.split(/[^a-z]+/).filter((w) => w.length > 0);

  let pair: string;
  if (words.length >= 2) {
    pair = words[0]!.slice(0, 1) + words[1]!.slice(0, 1);
  } else if (words.length === 1 && words[0]!.length >= 2) {
    pair = words[0]!.slice(0, 2);
  } else if (words.length === 1) {
    pair = words[0]!.slice(0, 1) + words[0]!.slice(0, 1);
  } else {
    const ascii = trimmed.replace(/[^A-Za-z]/g, "").toLowerCase();
    pair = ascii.slice(0, 2);
  }

  const upper = pair.toUpperCase().replace(/[^A-Z]/g, "");
  if (upper.length >= 2) return upper.slice(0, 2);
  if (upper.length === 1) return (upper + upper).slice(0, 2);
  return "OR";
}
