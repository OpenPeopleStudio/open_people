import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getRunDetails, explainResponse } from "@/lib/mlf/ai-traces";

/* ═══════════════════════════════════════════════════════════════════════════
   GET /api/mlf/runs/[runId]
   Get AI run details with context items
   ═══════════════════════════════════════════════════════════════════════════ */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    const { runId } = await params;
    const supabase = await createSupabaseServer();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const explain = searchParams.get("explain") === "true";
    const byMessage = searchParams.get("by_message");
    
    // If querying by message ID
    if (byMessage) {
      const result = await explainResponse(supabase, byMessage);
      return NextResponse.json(result);
    }
    
    const run = await getRunDetails(supabase, runId);
    
    if (!run) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }
    
    // Verify ownership
    if (run.owner_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    
    if (explain) {
      // Build explanation
      let explanation = `## AI Run Trace\n\n`;
      explanation += `**Model:** ${run.model}\n`;
      explanation += `**Type:** ${run.run_type}\n`;
      explanation += `**Status:** ${run.status}\n\n`;
      
      if (run.latency_ms) {
        explanation += `**Latency:** ${run.latency_ms}ms\n`;
      }
      
      if (run.total_tokens) {
        explanation += `**Tokens:** ${run.total_tokens} (${run.input_tokens} in, ${run.output_tokens} out)\n`;
      }
      
      if (run.estimated_cost_usd) {
        explanation += `**Estimated Cost:** $${run.estimated_cost_usd.toFixed(6)}\n`;
      }
      
      explanation += `\n### Why This Response\n\n`;
      
      if (run.reasoning) {
        explanation += `${run.reasoning}\n\n`;
      }
      
      const contextItems = run.context_items || [];
      if (contextItems.length > 0) {
        explanation += `### Context Used (${contextItems.length} items)\n\n`;
        
        for (const item of contextItems) {
          explanation += `- **[${item.source_type}]** ${item.source_name || item.source_id}`;
          if (item.relevance_score) {
            explanation += ` (${(item.relevance_score * 100).toFixed(0)}% relevant)`;
          }
          explanation += `\n`;
          if (item.content_preview) {
            explanation += `  > ${item.content_preview.slice(0, 100)}...\n`;
          }
        }
      } else {
        explanation += `No additional context was used.\n`;
      }
      
      return NextResponse.json({ run, explanation });
    }
    
    return NextResponse.json({ run });
    
  } catch (error) {
    console.error("Run fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
