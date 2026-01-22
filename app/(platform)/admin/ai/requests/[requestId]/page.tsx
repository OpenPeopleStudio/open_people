/* ═══════════════════════════════════════════════════════════════════════════
   AI Request Detail Page (Rosetta Stone UI)
   Unified view for a single AI request with all context
   ═══════════════════════════════════════════════════════════════════════════ */

import { notFound } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import AIRequestDetail, { type AIRequestData } from "@/components/ai/AIRequestDetail";

// ─────────────────────────────────────────────────────────────────────────────
// Data Fetching
// ─────────────────────────────────────────────────────────────────────────────

async function getRequestData(requestId: string): Promise<AIRequestData | null> {
  const supabase = await createSupabaseServer();
  
  // Get the AI run
  const { data: run, error } = await supabase
    .from("ai_runs")
    .select("*")
    .eq("id", requestId)
    .single();
  
  if (error || !run) {
    // Try by request_id field if not found by primary ID
    const { data: runByRequestId } = await supabase
      .from("ai_runs")
      .select("*")
      .eq("request_id", requestId)
      .single();
    
    if (!runByRequestId) {
      return null;
    }
    
    return buildRequestData(runByRequestId, supabase);
  }
  
  return buildRequestData(run, supabase);
}

type RiskSignal = { type?: string; score?: number; level?: string };

type AIRunContext = {
  policy_decision?: {
    decision?: string;
    policy_name?: string;
    policy_id?: string;
    reasons?: string[];
  };
  risk_signals?: RiskSignal[];
  risk_score?: number;
  risk_level?: string;
  pii_detection?: {
    detected: boolean;
    types?: string[];
    redacted?: boolean;
  };
  moderation?: {
    passed?: boolean;
    flags?: string[];
    scores?: Record<string, number>;
  };
  guardrails?: {
    triggered?: string[];
    passed?: string[];
  };
  policy_trace?: unknown;
};

type AIRunRecord = {
  id: string;
  tenant_id: string;
  created_at: string;
  completed_at?: string | null;
  request_id?: string;
  status?: string;
  model?: string;
  messages?: { role: string; content: string }[];
  input_text?: string;
  temperature?: number;
  output_text?: string;
  finish_reason?: string;
  input_tokens?: number;
  output_tokens?: number;
  latency_ms?: number;
  estimated_cost_usd?: number;
  time_to_first_token_ms?: number;
  quality_score?: number;
  hallucination_score?: number;
  relevance_score?: number;
  coherence_score?: number;
  trace_id?: string;
  span_id?: string;
  parent_span_id?: string;
  context?: AIRunContext;
};

async function buildRequestData(
  run: AIRunRecord,
  supabase: Awaited<ReturnType<typeof createSupabaseServer>>
): Promise<AIRequestData> {
  const runRecord = run;
  // Build timeline from activity logs
  const { data: activityLogs } = await supabase
    .from("activity_ledger")
    .select("*")
    .eq("resource_id", runRecord.id)
    .order("created_at", { ascending: true });
  
  const timeline = (activityLogs || []).map((log) => ({
    timestamp: log.created_at,
    event: log.action.replace(/_/g, " "),
    details: log.context?.details as string | undefined,
    status: log.success ? "success" : "error",
  }));
  
  // Add default timeline events if none found
  if (timeline.length === 0) {
    timeline.push(
      {
        timestamp: runRecord.created_at,
        event: "Request received",
        details: undefined,
        status: "info",
      },
      {
        timestamp: runRecord.completed_at || runRecord.created_at,
        event: runRecord.status === "completed" ? "Response generated" : `Status: ${runRecord.status}`,
        details: undefined,
        status: runRecord.status === "completed" ? "success" : "error",
      }
    );
  }
  
  // Get context items
  const { data: contextItems } = await supabase
    .from("ai_run_context_items")
    .select("*")
    .eq("run_id", runRecord.id);
  
  // Get policy decision from context if available
  const policyDecision = runRecord.context?.policy_decision || {
    decision: "allow",
    reasons: ["No policy evaluation recorded"],
  };
  
  // Get risk signals
  const riskSignals = runRecord.context?.risk_signals || [];
  
  return {
    request_id: runRecord.request_id || runRecord.id,
    tenant_id: runRecord.tenant_id,
    created_at: runRecord.created_at,
    
    input: {
      model: runRecord.model || "unknown",
      messages: runRecord.messages || [
        { role: "user", content: runRecord.input_text || "[Input not recorded]" },
      ],
      ...(runRecord.temperature !== undefined ? { temperature: runRecord.temperature } : {}),
  },
  
  output: {
    content: runRecord.output_text || "[Output not recorded]",
    ...(runRecord.finish_reason ? { finish_reason: runRecord.finish_reason } : {}),
  },
    
  metrics: {
    input_tokens: runRecord.input_tokens || 0,
    output_tokens: runRecord.output_tokens || 0,
    latency_ms: runRecord.latency_ms || 0,
    cost_usd: runRecord.estimated_cost_usd || 0,
    ...(runRecord.time_to_first_token_ms !== undefined
      ? { time_to_first_token_ms: runRecord.time_to_first_token_ms }
      : {}),
  },
    
    timeline: timeline as AIRequestData["timeline"],
    
    context_items: (contextItems || []).map((item) => ({
      type: item.context_type as "memory" | "kb_chunk" | "file" | "fact",
      name: item.context_name || item.context_id,
      relevance_score: item.relevance_score,
    })),
    
  policy: {
    decision:
      policyDecision.decision === "deny" || policyDecision.decision === "require_approval"
        ? policyDecision.decision
        : "allow",
    ...(policyDecision.policy_name ? { policy_name: policyDecision.policy_name } : {}),
    ...(policyDecision.policy_id ? { policy_id: policyDecision.policy_id } : {}),
    reasons: policyDecision.reasons || [],
    trace_available: !!runRecord.context?.policy_trace,
  },
  
  risk_signals: riskSignals.map((signal: RiskSignal) => {
    const level = (signal.level || "low") as "low" | "medium" | "high" | "critical";
    return {
      type: signal.type || "unknown",
      score: signal.score ?? 0,
      level,
    };
  }),
  overall_risk_score: runRecord.context?.risk_score || 0,
  overall_risk_level: (runRecord.context?.risk_level || "low") as
    | "low"
    | "medium"
    | "high"
    | "critical",

  quality: {
    score: runRecord.quality_score ?? 0,
    ...(runRecord.hallucination_score !== undefined
      ? { hallucination_score: runRecord.hallucination_score }
      : {}),
    ...(runRecord.relevance_score !== undefined ? { relevance_score: runRecord.relevance_score } : {}),
    ...(runRecord.coherence_score !== undefined ? { coherence_score: runRecord.coherence_score } : {}),
  },
    
  pii: runRecord.context?.pii_detection
    ? {
        detected: runRecord.context.pii_detection.detected,
        ...(runRecord.context.pii_detection.types
          ? { types: runRecord.context.pii_detection.types }
          : {}),
        redacted: runRecord.context.pii_detection.redacted ?? false,
      }
    : { detected: false, redacted: false },
    
  moderation: runRecord.context?.moderation
    ? {
        passed: !!runRecord.context.moderation.passed,
        ...(runRecord.context.moderation.flags
          ? { flags: runRecord.context.moderation.flags }
          : {}),
        ...(runRecord.context.moderation.scores
          ? { scores: runRecord.context.moderation.scores }
          : {}),
      }
    : { passed: false },
    
  guardrails: runRecord.context?.guardrails
    ? {
        triggered: runRecord.context.guardrails.triggered || [],
        passed: runRecord.context.guardrails.passed || [],
      }
    : { triggered: [], passed: [] },
    
  trace_id: runRecord.trace_id ?? "",
  span_id: runRecord.span_id ?? "",
  parent_span_id: runRecord.parent_span_id ?? "",
};
}

// ─────────────────────────────────────────────────────────────────────────────
// Page Component
// ─────────────────────────────────────────────────────────────────────────────

export default async function AIRequestDetailPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = await params;
  
  const data = await getRequestData(requestId);
  
  if (!data) {
    notFound();
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <AIRequestDetail data={data} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Metadata
// ─────────────────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = await params;
  return {
    title: `AI Request ${requestId.slice(0, 8)}... | Admin`,
  };
}
