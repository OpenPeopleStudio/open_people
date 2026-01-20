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

async function buildRequestData(
  run: any,
  supabase: Awaited<ReturnType<typeof createSupabaseServer>>
): Promise<AIRequestData> {
  // Build timeline from activity logs
  const { data: activityLogs } = await supabase
    .from("activity_ledger")
    .select("*")
    .eq("resource_id", run.id)
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
        timestamp: run.created_at,
        event: "Request received",
        details: undefined,
        status: "info",
      },
      {
        timestamp: run.completed_at || run.created_at,
        event: run.status === "completed" ? "Response generated" : `Status: ${run.status}`,
        details: undefined,
        status: run.status === "completed" ? "success" : "error",
      }
    );
  }
  
  // Get context items
  const { data: contextItems } = await supabase
    .from("ai_run_context_items")
    .select("*")
    .eq("run_id", run.id);
  
  // Get policy decision from context if available
  const policyDecision = run.context?.policy_decision || {
    decision: "allow",
    reasons: ["No policy evaluation recorded"],
  };
  
  // Get risk signals
  const riskSignals = run.context?.risk_signals || [];
  
  return {
    request_id: run.request_id || run.id,
    tenant_id: run.tenant_id,
    created_at: run.created_at,
    
    input: {
      model: run.model || "unknown",
      messages: run.messages || [
        { role: "user", content: run.input_text || "[Input not recorded]" },
      ],
      temperature: run.temperature,
    },
    
    output: {
      content: run.output_text || "[Output not recorded]",
      finish_reason: run.finish_reason,
    },
    
    metrics: {
      input_tokens: run.input_tokens || 0,
      output_tokens: run.output_tokens || 0,
      latency_ms: run.latency_ms || 0,
      cost_usd: run.estimated_cost_usd || 0,
      time_to_first_token_ms: run.time_to_first_token_ms,
    },
    
    timeline: timeline as AIRequestData["timeline"],
    
    context_items: (contextItems || []).map((item) => ({
      type: item.context_type as "memory" | "kb_chunk" | "file" | "fact",
      name: item.context_name || item.context_id,
      relevance_score: item.relevance_score,
    })),
    
    policy: {
      decision: policyDecision.decision || "allow",
      policy_name: policyDecision.policy_name,
      policy_id: policyDecision.policy_id,
      reasons: policyDecision.reasons || [],
      trace_available: !!run.context?.policy_trace,
    },
    
    risk_signals: riskSignals.map((signal: any) => ({
      type: signal.type,
      score: signal.score,
      level: signal.level || "low",
    })),
    overall_risk_score: run.context?.risk_score || 0,
    overall_risk_level: run.context?.risk_level || "low",
    
    quality: run.quality_score
      ? {
          score: run.quality_score,
          hallucination_score: run.hallucination_score,
          relevance_score: run.relevance_score,
          coherence_score: run.coherence_score,
        }
      : undefined,
    
    pii: run.context?.pii_detection
      ? {
          detected: run.context.pii_detection.detected,
          types: run.context.pii_detection.types,
          redacted: run.context.pii_detection.redacted,
        }
      : undefined,
    
    moderation: run.context?.moderation
      ? {
          passed: run.context.moderation.passed,
          flags: run.context.moderation.flags,
          scores: run.context.moderation.scores,
        }
      : undefined,
    
    guardrails: run.context?.guardrails
      ? {
          triggered: run.context.guardrails.triggered || [],
          passed: run.context.guardrails.passed || [],
        }
      : undefined,
    
    trace_id: run.trace_id,
    span_id: run.span_id,
    parent_span_id: run.parent_span_id,
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
