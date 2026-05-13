/**
 * Трансліт кирилиці (укр./рос.) у латинські літери та цифри для slug / монограм.
 */
export function transliterateCyrillicToLatinSource(text: string): string {
  let t = text.normalize("NFKC").toLowerCase();

  const pairs: [string, string][] = [
    ["щ", "shch"],
    ["шч", "shch"],
    ["ж", "zh"],
    ["х", "kh"],
    ["ч", "ch"],
    ["ш", "sh"],
    ["ц", "ts"],
    ["ю", "u"],
    ["я", "a"],
    ["є", "e"],
    ["ї", "i"],
    ["й", "y"],
    ["ґ", "g"],
    ["ь", ""],
    ["ъ", ""],
    ["ё", "e"],
    ["ы", "y"],
    ["э", "e"],
  ];
  for (const [a, b] of pairs) {
    t = t.split(a).join(b);
  }

  const single: Record<string, string> = {
    а: "a",
    б: "b",
    в: "v",
    г: "h",
    д: "d",
    е: "e",
    з: "z",
    и: "y",
    і: "i",
    к: "k",
    л: "l",
    м: "m",
    н: "n",
    о: "o",
    п: "p",
    р: "r",
    с: "s",
    т: "t",
    у: "u",
    ф: "f",
  };

  let out = "";
  for (const ch of t) {
    if (single[ch]) out += single[ch];
    else if (/[a-z0-9]/.test(ch)) out += ch;
    else out += " ";
  }
  return out.replace(/\s+/g, " ").trim();
}

/** Лише a-z, 0-9 та дефіси; суфікс — id допису в Telegram. */
export function eventSlugFromTitle(title: string, postId: number): string {
  const src = transliterateCyrillicToLatinSource(title);
  const base = src
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return `${base.length > 0 ? base : "event"}-${postId}`;
}
