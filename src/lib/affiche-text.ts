/**
 * Текст афіші без URL: прибираємо веб-посилання та telegram, лишаємо звичайний текст.
 */
export function stripUrlsFromAfficheText(text: string): string {
  let t = text.trim();
  if (!t) return "";

  t = t.replace(/\[([^\]]*)\]\([^)]+\)/g, "$1");

  t = t
    .replace(/\bhttps?:\/\/\S+/gi, "")
    .replace(/\bwww\.\S+/gi, "")
    .replace(/\bt\.me\/\S+/gi, "")
    .replace(/\btelegram\.me\/\S+/gi, "")
    .replace(/\btelegram\.dog\/\S+/gi, "");

  /* Залишки пошукових фрагментів без домену (напр. ?q=%23D0%B1…) */
  t = t.replace(/\?q=\S+/gi, "");
  t = t.replace(
    /(?:^|[\s\r\n])\?[a-zA-Z][a-zA-Z0-9_]{0,30}=[^\s<>"]+/g,
    (m) => (m.startsWith("\n") ? "\n" : " "),
  );

  t = t
    .split("\n")
    .map((line) => line.replace(/\s*\?[\w.%=&+\-]{3,}\s*$/i, "").trimEnd())
    .filter((line) => {
      const s = line.trim();
      if (!s) return false;
      if (/^\?[\w%.=&+\-]+$/i.test(s)) return false;
      return true;
    })
    .join("\n");

  t = t
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\(\s*\)/g, "")
    .replace(/\s+\n/g, "\n")
    .trim();

  return t;
}

/** Перший непорожній рядок афіші (назва події в дописі). */
export function afficheFirstLine(text: string): string {
  const plain = stripUrlsFromAfficheText(text);
  if (!plain) return "";
  return plain.split(/\r?\n/).find((line) => line.trim())?.trim() ?? "";
}

/** Текст афіші без першого рядка (щоб не дублювати заголовок). */
export function afficheBodyAfterFirstLine(text: string): string {
  const plain = stripUrlsFromAfficheText(text);
  if (!plain) return "";
  const lines = plain.split(/\r?\n/);
  const firstIdx = lines.findIndex((line) => line.trim());
  if (firstIdx < 0) return "";
  return lines
    .slice(firstIdx + 1)
    .join("\n")
    .trim();
}
