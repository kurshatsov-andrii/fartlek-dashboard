import { NextRequest, NextResponse } from "next/server";
import {
  isValidUaQuickSubmitPhone,
} from "@/lib/ua-quick-submit-phone";

const MAX = {
  title: 220,
  city: 120,
  description: 3500,
  registrationLink: 500,
} as const;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function isNonEmpty(s: unknown): s is string {
  return typeof s === "string" && s.trim().length > 0;
}

function isValidHttpUrl(s: string): boolean {
  try {
    const u = new URL(s.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function isReasonableDate(d: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return false;
  const t = new Date(`${d}T12:00:00`).getTime();
  return Number.isFinite(t);
}

/** Декілька чатів: особистий id + група (`-100…`) через кому чи переведення рядка. */
function parseQuickSubmitChatRecipients(raw: string): string[] {
  return raw
    .split(/[\s,;]+/u)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

async function sendQuickSubmitTelegramMessage(
  token: string,
  chatRecipients: readonly string[],
  html: string,
): Promise<{ ok: boolean; errors: string[] }> {
  const errors: string[] = [];
  for (const chatRecipient of chatRecipients) {
    const tgRes = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatRecipient,
          text: html,
          parse_mode: "HTML",
          disable_web_page_preview: false,
        }),
      },
    );

    let tgJson: { ok?: boolean; description?: string } = {};
    try {
      const txt = await tgRes.text();
      if (txt.trim()) tgJson = JSON.parse(txt) as typeof tgJson;
    } catch {
      if (!tgRes.ok) {
        errors.push(`${chatRecipient}: ${tgRes.statusText}`);
      }
      continue;
    }

    if (!tgRes.ok || tgJson.ok === false) {
      errors.push(
        `${chatRecipient}: ${tgJson.description ?? tgRes.statusText}`,
      );
    }
  }

  return { ok: errors.length === 0, errors };
}

export async function POST(req: NextRequest) {
  const token = process.env.TELEGRAM_QUICK_SUBMIT_BOT_TOKEN?.trim();
  const chatEnv = process.env.TELEGRAM_QUICK_SUBMIT_CHAT_ID?.trim();

  if (!token || !chatEnv) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Сервер не налаштовано: потрібні TELEGRAM_QUICK_SUBMIT_BOT_TOKEN і TELEGRAM_QUICK_SUBMIT_CHAT_ID.",
      },
      { status: 503 },
    );
  }

  let raw: Record<string, unknown>;
  try {
    raw = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Некоректний JSON." }, {
      status: 400,
    });
  }

  const title =
    typeof raw.title === "string" ? raw.title.trim().slice(0, MAX.title) : "";
  const city =
    typeof raw.city === "string" ? raw.city.trim().slice(0, MAX.city) : "";
  const date = typeof raw.date === "string" ? raw.date.trim() : "";
  const registrationLink =
    typeof raw.registrationLink === "string"
      ? raw.registrationLink.trim().slice(0, MAX.registrationLink)
      : "";
  const description =
    typeof raw.description === "string"
      ? raw.description.trim().slice(0, MAX.description)
      : "";
  const phone =
    typeof raw.phone === "string" ? raw.phone.trim() : "";

  if (
    !isNonEmpty(title) ||
    !isNonEmpty(city) ||
    !isNonEmpty(date) ||
    !isNonEmpty(registrationLink) ||
    !isNonEmpty(description) ||
    !isNonEmpty(phone)
  ) {
    return NextResponse.json(
      { ok: false, error: "Усі поля обов'язкові." },
      { status: 400 },
    );
  }

  if (!isReasonableDate(date)) {
    return NextResponse.json(
      { ok: false, error: "Оберіть коректну дату." },
      { status: 400 },
    );
  }

  if (!isValidHttpUrl(registrationLink)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Посилання на реєстрацію має бути повним http(s)-URL.",
      },
      { status: 400 },
    );
  }

  if (!isValidUaQuickSubmitPhone(phone)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Телефон у форматі +380 XX XXX-XX-XX (9 цифр після коду країни).",
      },
      { status: 400 },
    );
  }

  const regEscaped = escapeHtml(registrationLink);
  const html = [
    "<b>Нова подія — швидке додавання</b>",
    "",
    `<b>Назва:</b> ${escapeHtml(title)}`,
    `<b>Місто:</b> ${escapeHtml(city)}`,
    `<b>Дата:</b> ${escapeHtml(date)}`,
    `<b>Телефон:</b> <code>${escapeHtml(phone)}</code>`,
    `<b>Реєстрація:</b> <a href="${regEscaped}">${regEscaped}</a>`,
    "",
    `<b>Опис:</b>`,
    escapeHtml(description),
  ].join("\n");

  if (html.length > 4090) {
    return NextResponse.json(
      {
        ok: false,
        error: "Занадто довгий текст — скорочіть опис.",
      },
      { status: 400 },
    );
  }

  const chatRecipients = parseQuickSubmitChatRecipients(chatEnv);
  if (chatRecipients.length === 0) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "TELEGRAM_QUICK_SUBMIT_CHAT_ID порожній — вкажіть свій числовий id (та/або id групи через кому).",
      },
      { status: 503 },
    );
  }

  const { ok: tgOk, errors: tgErrors } = await sendQuickSubmitTelegramMessage(
    token,
    chatRecipients,
    html,
  );

  if (!tgOk) {
    return NextResponse.json(
      {
        ok: false,
        error:
          tgErrors.join(" ") ||
          "Не вдалося надіслати в Telegram — перевірте токен і chat_id.",
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
