// Server/services/aiService.ts
import Anthropic from "@anthropic-ai/sdk";

let anthropic: Anthropic | null = null;
let anthropicDisabledReason: string | null = null;
let anthropicDisableLogged = false;
try {
  if (process.env.ANTHROPIC_API_KEY) {
    anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  } else {
    console.warn("[aiService] ANTHROPIC_API_KEY not set. AI calls will be skipped.");
  }
} catch (error) {
  console.error("[aiService] Failed to initialize Anthropic SDK:", error);
  anthropic = null;
}

function anthropicErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) return error.message.trim();
  if (typeof error === "object" && error && "error" in error) {
    const nested = (error as { error?: { message?: unknown } }).error;
    if (nested && typeof nested.message === "string" && nested.message.trim()) return nested.message.trim();
  }
  return "Anthropic request failed";
}

function shouldDisableAnthropic(error: unknown) {
  const message = anthropicErrorMessage(error).toLowerCase();
  return (
    message.includes("credit balance is too low") ||
    message.includes("purchase credits") ||
    message.includes("billing") ||
    message.includes("invalid x-api-key") ||
    message.includes("authentication_error")
  );
}

function markAnthropicUnavailable(error: unknown) {
  if (!shouldDisableAnthropic(error)) return;
  anthropicDisabledReason = anthropicErrorMessage(error);
  anthropic = null;
  if (!anthropicDisableLogged) {
    console.warn(`[aiService] Anthropic disabled for this process. ${anthropicDisabledReason}`);
    anthropicDisableLogged = true;
  }
}

/**
 * A centralized helper to call the Anthropic API and parse a JSON response.
 * It handles boilerplate for creating a message, extracting text, cleaning markdown,
 * and parsing the JSON, with a fallback for errors.
 * If the Anthropic client is not available, it will immediately return the fallback.
 * @param prompt The user prompt to send to the AI.
 * @param options Model options like model name and max_tokens.
 * @param fallback A default value to return if the API call or parsing fails.
 * @returns The parsed JSON object of type T, or the fallback value.
 */
export async function callAnthropicAndParseJson<T>(
  prompt: string,
  options: { model: string; max_tokens: number },
  fallback: T,
): Promise<T> {
  if (!anthropic) {
    if (anthropicDisabledReason && !anthropicDisableLogged) {
      console.warn(`[aiService] Anthropic unavailable. ${anthropicDisabledReason}`);
      anthropicDisableLogged = true;
    }
    return fallback;
  }
  try {
    const message = await anthropic.messages.create({ ...options, messages: [{ role: "user", content: prompt }] });
    const responseText = message.content[0]?.type === "text" ? message.content[0].text : "";
    const jsonString = responseText.replace(/```json|```/g, "").trim();
    return jsonString ? (JSON.parse(jsonString) as T) : fallback;
  } catch (error) {
    markAnthropicUnavailable(error);
    console.warn(`[aiService] Anthropic JSON fallback used. ${anthropicErrorMessage(error)}`);
    return fallback;
  }
}

/**
 * A centralized helper to call the Anthropic API and get a text response.
 * If the Anthropic client is not available, it will immediately return the fallback.
 * @param prompt The user prompt to send to the AI.
 * @param systemPrompt An optional system prompt.
 * @param options Model options like model name and max_tokens.
 * @param fallback A default value to return if the API call fails.
 * @returns The text response, or the fallback value.
 */
export async function callAnthropicAndGetText(
  prompt: string,
  systemPrompt: string | undefined,
  options: { model: string; max_tokens: number; temperature?: number },
  fallback: string,
): Promise<string> {
  if (!anthropic) {
    if (anthropicDisabledReason && !anthropicDisableLogged) {
      console.warn(`[aiService] Anthropic unavailable. ${anthropicDisabledReason}`);
      anthropicDisableLogged = true;
    }
    return fallback;
  }
  try {
    const message = await anthropic.messages.create({
      ...options,
      system: systemPrompt,
      messages: [{ role: "user", content: prompt }],
    });
    const responseText = message.content[0]?.type === "text" ? message.content[0].text : "";
    return responseText || fallback;
  } catch (error) {
    markAnthropicUnavailable(error);
    console.warn(`[aiService] Anthropic text fallback used. ${anthropicErrorMessage(error)}`);
    return fallback;
  }
}
