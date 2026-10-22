import OpenAI from "openai";
import type { UIMessage } from "ai";
import { messageText } from "./prompt";

export function openaiDirectKey(): string {
  return process.env.OPENAI_API_KEY?.trim() ?? "";
}

export function openaiDirectConfigured(): boolean {
  return openaiDirectKey().length > 0;
}

/** Gateway slug `openai/gpt-4.1-mini` → OpenAI model id `gpt-4.1-mini`. */
export function openaiDirectModel(gatewayModel: string): string {
  const trimmed = gatewayModel.trim();
  const slash = trimmed.lastIndexOf("/");
  return slash === -1 ? trimmed : trimmed.slice(slash + 1);
}

export function toOpenAIChatMessages(
  instructions: string,
  messages: UIMessage[],
): OpenAI.Chat.ChatCompletionMessageParam[] {
  const out: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: instructions },
  ];
  for (const message of messages) {
    if (message.role !== "user" && message.role !== "assistant") continue;
    const text = messageText(message);
    if (!text) continue;
    out.push({
      role: message.role,
      content: text,
    });
  }
  return out;
}

export async function* streamOpenAIText(input: {
  model: string;
  instructions: string;
  messages: UIMessage[];
}): AsyncGenerator<string, void, void> {
  const client = new OpenAI({ apiKey: openaiDirectKey() });
  const stream = await client.chat.completions.create({
    model: input.model,
    messages: toOpenAIChatMessages(input.instructions, input.messages),
    stream: true,
  });
  for await (const part of stream) {
    const delta = part.choices[0]?.delta?.content;
    if (delta) yield delta;
  }
}
