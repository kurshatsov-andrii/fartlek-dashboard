import { ChatOpenAI } from "@langchain/openai";

/** Модель за замовчуванням — економна й швидка для чату-асистента. */
const DEFAULT_MODEL = "gpt-4o-mini";

/**
 * Фабрика чат-моделі LangChain. Повертає `null`, якщо немає ключа.
 */
export function createFartlekChatModel(): ChatOpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;

  const modelName = process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL;

  return new ChatOpenAI({
    apiKey,
    model: modelName,
    temperature: 0.35,
  });
}
