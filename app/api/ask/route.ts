import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { loadProposalKnowledge } from "@/lib/ask/knowledge";
import { logAskQuestion } from "@/lib/ask/log";
import {
  answerLooksCovered,
  askGatewayProviderOptions,
  askModel,
  assistantConfigured,
  buildAskInstructions,
  lastUserText,
} from "@/lib/ask/prompt";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_MESSAGES = 16;
const SNAG = "The assistant hit a snag. Try once more, or use the follow-up form.";

export async function POST(req: Request) {
  if (!assistantConfigured(req)) {
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

  const result = streamText({
    model: askModel(),
    instructions,
    messages: await convertToModelMessages(messages),
    providerOptions: askGatewayProviderOptions(),
    onFinish: ({ text }) => {
      logAskQuestion({ question, covered: answerLooksCovered(text) });
    },
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      onError: () => SNAG,
    }),
  });
}
