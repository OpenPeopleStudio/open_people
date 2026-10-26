import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { loadProposalKnowledge } from "@/lib/ask/knowledge";
import { logAskQuestion } from "@/lib/ask/log";
import {
  answerLooksCovered,
  buildAskInstructions,
  lastUserText,
} from "@/lib/ask/prompt";
import { askLanguageModel, askRuntime } from "@/lib/ask/provider";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_MESSAGES = 16;
const SNAG = "The assistant hit a snag. Try once more, or use the follow-up form.";

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
  const selected = askRuntime(req);
  if (selected.state === "unconfigured") {
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

  const logFields = {
    question,
    provider: selected.provider,
    model: selected.model,
  };

  if (selected.state === "snag") {
    logAskQuestion({ ...logFields, covered: false });
    return snagResponse();
  }

  const knowledge = loadProposalKnowledge();
  const instructions = buildAskInstructions(knowledge);

  try {
    const result = streamText({
      model: askLanguageModel(selected),
      instructions,
      messages: await convertToModelMessages(messages),
      ...(selected.providerOptions ? { providerOptions: selected.providerOptions } : {}),
      onFinish: ({ text }) => {
        logAskQuestion({
          ...logFields,
          covered: answerLooksCovered(text),
        });
      },
    });

    return createUIMessageStreamResponse({
      stream: toUIMessageStream({
        stream: result.stream,
        onError: () => SNAG,
      }),
    });
  } catch {
    logAskQuestion({ ...logFields, covered: false });
    return snagResponse();
  }
}
