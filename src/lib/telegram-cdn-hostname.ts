/**
 * Хости прямих зображень з Telegram CDN (без telegraph.controller.bot/file).
 * Окремий модуль без Node API — безпечно імпортувати з клієнтських компонентів.
 */
export function isTelegramCdnHostname(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return (
    h === "cdn.telegram.org" ||
    /\.telesco\.pe$/i.test(h) ||
    /\.cdn-telegram\.org$/i.test(h) ||
    /** Напр. cdn4.telegram-cdn.org — інший суфікс, ніж *.cdn-telegram.org */
    /\.telegram-cdn\.org$/i.test(h)
  );
}
