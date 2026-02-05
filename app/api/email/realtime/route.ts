import { createSupabaseServer } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/* ═══════════════════════════════════════════════════════════════════════════
   Email Real-time API
   GET /api/email/realtime - Server-Sent Events for real-time email updates
   ═══════════════════════════════════════════════════════════════════════════ */

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get user profile and tenant
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return new NextResponse("No tenant found", { status: 400 });
    }

    // Set up Server-Sent Events
    const responseStream = new ReadableStream({
      start(controller) {
        // Send initial connection message
        const initialData = {
          type: "connected",
          timestamp: new Date().toISOString(),
          user_id: user.id,
          tenant_id: profile.tenant_id,
        };

        controller.enqueue(`data: ${JSON.stringify(initialData)}\n\n`);

        // Set up real-time subscription for email events
        const channel = supabase
          .channel(`email-updates-${user.id}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "email_messages",
              filter: `tenant_id=eq.${profile.tenant_id}`,
            },
            (payload) => {
              const eventData = {
                type: "email_update",
                event: payload.eventType,
                table: payload.table,
                record: payload.new || payload.old,
                timestamp: new Date().toISOString(),
              };

              controller.enqueue(`data: ${JSON.stringify(eventData)}\n\n`);
            }
          )
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "email_threads",
              filter: `tenant_id=eq.${profile.tenant_id}`,
            },
            (payload) => {
              const eventData = {
                type: "thread_update",
                event: payload.eventType,
                table: payload.table,
                record: payload.new || payload.old,
                timestamp: new Date().toISOString(),
              };

              controller.enqueue(`data: ${JSON.stringify(eventData)}\n\n`);
            }
          )
          .subscribe((status) => {
            console.log(`[Email Realtime] Subscription status: ${status}`);

            if (status === "SUBSCRIBED") {
              controller.enqueue(`data: ${JSON.stringify({
                type: "subscribed",
                timestamp: new Date().toISOString(),
              })}\n\n`);
            }
          });

        // Handle client disconnect
        request.signal.addEventListener("abort", () => {
          console.log("[Email Realtime] Client disconnected");
          supabase.removeChannel(channel);
          controller.close();
        });

        // Keep-alive ping every 30 seconds
        const keepAlive = setInterval(() => {
          controller.enqueue(`data: ${JSON.stringify({
            type: "ping",
            timestamp: new Date().toISOString(),
          })}\n\n`);
        }, 30000);

        // Clean up on stream end
        request.signal.addEventListener("abort", () => {
          clearInterval(keepAlive);
        });
      },
    });

    return new NextResponse(responseStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Cache-Control",
      },
    });

  } catch (error) {
    console.error("Email realtime error:", error);
    return new NextResponse(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500 }
    );
  }
}
