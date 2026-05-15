import type { BaseMessage } from "@langchain/core/messages";
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { NextResponse } from "next/server";
import { buildEventsCatalogContext } from "@/lib/fartlek-assistant/events-context";
import { createFartlekChatModel } from "@/lib/fartlek-assistant/chat-model";
import { FARTLEK_ASSISTANT_SYSTEM_PROMPT_UK } from "@/lib/fartlek-assistant/system-prompt";
import {
  alignAssistantLinksToOrigin,
  requestOriginHints,
  resolvePublicOrigin,
} from "@/lib/public-origin";
import { fetchTelegramDashboard } from "@/lib/telegram-dashboard-cache";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_MESSAGES = 24;
const MAX_CONTENT_LENGTH = 6000;

function toText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((c) => {
        if (typeof c === "object" && c !== null && "text" in c)
          return String((c as { text?: string }).text ?? "");
        return "";
      })
      .join("")
      .trim();
  }
  return String(content ?? "");
}

export async function POST(req: Request) {
  const model = createFartlekChatModel();
  if (!model) {
    return NextResponse.json(
      {
        error:
          "Асистент тимчасово недоступний: на сервері не налаштовано OPENAI_API_KEY.",
      },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Некоректний JSON у тілі запиту." }, { status: 400 });
  }

  const clientOrigin = (body as { clientOrigin?: unknown }).clientOrigin;
  const clientOriginStr =
    typeof clientOrigin === "string" ? clientOrigin : undefined;

  const rawMessages = (body as { messages?: unknown }).messages;
  if (!Array.isArray(rawMessages)) {
    return NextResponse.json(
      { error: "Очікується поле messages (масив повідомлень)." },
      { status: 400 },
    );
  }

  const slice = rawMessages.slice(-MAX_MESSAGES);

  let lastUserText = "";
  for (let i = slice.length - 1; i >= 0; i--) {
    const item = slice[i];
    if (!item || typeof item !== "object") continue;
    if ((item as { role?: string }).role !== "user") continue;
    const content = (item as { content?: unknown }).content;
    if (typeof content === "string") {
      lastUserText = content.slice(0, MAX_CONTENT_LENGTH).trim();
      break;
    }
  }

  const publicOrigin = resolvePublicOrigin(
    req,
    requestOriginHints(req, [clientOriginStr]),
  );

  const { events } = await fetchTelegramDashboard();
  const catalogContext = buildEventsCatalogContext(events, {
    siteOrigin: publicOrigin,
    lastUserMessage: lastUserText,
  });

  const lcMessages: BaseMessage[] = [
    new SystemMessage(FARTLEK_ASSISTANT_SYSTEM_PROMPT_UK),
    new SystemMessage(
      `ДАНІ КАТАЛОГУ ПОДІЙ (використовуй лише їх для конкретних назв, дат і посилань)\n\n${catalogContext}`,
    ),
  ];

  for (const item of slice) {
    if (!item || typeof item !== "object") continue;
    const role = (item as { role?: string }).role;
    const content = (item as { content?: unknown }).content;
    if (role !== "user" && role !== "assistant") continue;
    if (typeof content !== "string") continue;
    const trimmed = content.slice(0, MAX_CONTENT_LENGTH).trim();
    if (!trimmed) continue;
    if (role === "user") lcMessages.push(new HumanMessage(trimmed));
    else lcMessages.push(new AIMessage(trimmed));
  }

  if (lcMessages.length < 3) {
    return NextResponse.json(
      {
        error:
          "Надішліть хоча б одне повідомлення користувача (role: \"user\").",
      },
      { status: 400 },
    );
  }

  try {
    const res = await model.invoke(lcMessages);
    let message = toText(res.content);
    message = alignAssistantLinksToOrigin(message, publicOrigin);
    return NextResponse.json({ message });
  } catch (err) {
    console.error("[assistant/chat]", err);
    return NextResponse.json(
      {
        error:
          "Не вдалося отримати відповідь моделі. Спробуйте пізніше або перевірте ключ API.",
      },
      { status: 502 },
    );
  }
}
