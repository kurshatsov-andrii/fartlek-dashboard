/**
 * Зовнішня кнопка Wayforpay: оплата розміщення старту в Telegram @fartlekua
 * (https://t.me/fartlekua). Сума задається у кабінеті Wayforpay.
 *
 * Перевизначити: `NEXT_PUBLIC_WAYFORPAY_PUBLISH_URL` у середовищі.
 * Посилання з запиту: https://secure.wayforpay.com/button/b8d2696506552
 */
export const WAYFORPAY_EVENT_PUBLISH_BUTTON_URL =
  process.env.NEXT_PUBLIC_WAYFORPAY_PUBLISH_URL?.trim() ||
  "https://secure.wayforpay.com/button/b8d2696506552";
