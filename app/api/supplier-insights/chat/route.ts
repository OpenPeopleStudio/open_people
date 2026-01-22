import { NextRequest, NextResponse } from "next/server";
import { formatChatSummary } from "@/lib/supplier/insights";
import type { ChatPrompt, ChatReply } from "@/types/supplier";

/**
 * Supplier Insights - Conversational Summary (stub)
 *
 * POST /api/supplier-insights/chat
 *
 * Body:
 * {
 *   "message": "How are chardonnay sales trending?",
 *   "timeRange": { "from": "2026-01-01", "to": "2026-01-31" },
 *   "focusSku": "WINE-CHARD-001"
 * }
 *
 * This stub returns a grounded summary. Wire to an LLM with tool-calling
 * for production use.
 */

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ChatPrompt;
    const range = body.timeRange ?? {
      from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      to: new Date().toISOString(),
    };

    const summaryInput = {
      message: body.message,
      range,
      ...(body.focusSku ? { focusSku: body.focusSku } : {}),
    };
    const context = {
      timeRange: range,
      ...(body.focusSku ? { focusSku: body.focusSku } : {}),
    };

    const reply: ChatReply = {
      reply: formatChatSummary(summaryInput),
      context,
    };

    return NextResponse.json(reply);
  } catch (error) {
    console.error("supplier-insights chat error:", error);
    return NextResponse.json(
      { error: "Failed to build chat reply" },
      { status: 500 }
    );
  }
}
