import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  type UIMessage,
} from "ai";
import { loadProposalKnowledge } from "@/lib/ask/knowledge";
import { logAskQuestion } from "@/lib/ask/log";
import {
  answerLooksCovered,
  buildAskInstructions,
  lastUserText,
} from "@/lib/ask/prompt";
import { askFallbackRuntime, askLanguageModel, askRuntime } from "@/lib/ask/provider";
import { runAskWithFallback } from "@/lib/ask/stream";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_MESSAGES = 16;
const SNAG = "The assistant hit a snag. Try once more, or use the follow-up form.";
const TEXT_ID = "ask-text";

function snagResponse() {
  return createUIMessageStreamResponse({
    stream: createUIMessageStream({
      execute() {
        throw new Error("ask-unconfigured");
      },
      onError: () => SNAG,
    }),
  });
}

export async function POST(req: Request) {
  const primary = askRuntime(req);
  const fallback = askFallbackRuntime(req);

  if (primary.state === "unconfigured" && fallback == null) {
    return Response.json(
      {
        error:
          "The assistant is not configured on this environment. Use the follow-up form and Tom will email you.",
      },
      { status: 503 },
    );
  }

  let messages: UIMessage[] = [];
  try {
    const body = (await req.json()) as { messages?: UIMessage[] };
    messages = Array.isArray(body.messages) ? body.messages.slice(-MAX_MESSAGES) : [];
  } catch {
    return Response.json({ error: "Send a question." }, { status: 400 });
  }

  const question = lastUserText(messages);
  if (question.length < 2) {
    return Response.json({ error: "Write a question first." }, { status: 400 });
  }

  const knowledge = loadProposalKnowledge();
  const instructions = buildAskInstructions(knowledge);

  let outcome: Awaited<ReturnType<typeof runAskWithFallback>>;
  try {
    const modelMessages = await convertToModelMessages(messages);
    outcome = await runAskWithFallback({
      primary,
      fallback,
      start: (selected, abortSignal) => {
        const result = streamText({
          model: askLanguageModel(selected),
          instructions,
          messages: modelMessages,
          abortSignal,
          ...(selected.providerOptions ? { providerOptions: selected.providerOptions } : {}),
        });
        return result.textStream;
      },
    });
  } catch {
    logAskQuestion({
      question,
      covered: false,
      provider: primary.provider,
      model: primary.model,
      fallbackFired: false,
    });
    return snagResponse();
  }

  if (!outcome.ok) {
    logAskQuestion({
      question,
      covered: false,
      provider: primary.provider,
      model: primary.model,
      fallbackFired: outcome.fallbackFired,
    });
    return snagResponse();
  }

  return createUIMessageStreamResponse({
    stream: createUIMessageStream({
      async execute({ writer }) {
        writer.write({ type: "text-start", id: TEXT_ID });
        let text = "";
        try {
          for await (const delta of outcome.chunks) {
            text += delta;
            writer.write({ type: "text-delta", id: TEXT_ID, delta });
          }
        } finally {
          writer.write({ type: "text-end", id: TEXT_ID });
          logAskQuestion({
            question,
            covered: answerLooksCovered(text),
            provider: outcome.runtime.provider,
            model: outcome.runtime.model,
            fallbackFired: outcome.fallbackFired,
          });
        }
      },
      onError: () => SNAG,
    }),
  });
}
