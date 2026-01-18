import { createSupabaseServer } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/* ═══════════════════════════════════════════════════════════════════════════
   User Notification Preferences API
   GET /api/notifications/preferences - Get user preferences
   PUT /api/notifications/preferences - Update user preferences
   ═══════════════════════════════════════════════════════════════════════════ */

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("709_profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 403 });
    }

    const { data: preferences, error } = await supabase
      .from("user_notification_preferences")
      .select("*")
      .eq("user_id", user.id)
      .eq("tenant_id", profile.tenant_id);

    if (error) {
      console.error("Fetch preferences error:", error);
      return NextResponse.json(
        { error: "Failed to fetch preferences" },
        { status: 500 }
      );
    }

    // Return preferences keyed by channel
    const prefsMap: Record<string, {
      enabled: boolean;
      quietHoursStart: string | null;
      quietHoursEnd: string | null;
    }> = {};

    for (const pref of preferences || []) {
      prefsMap[pref.channel] = {
        enabled: pref.enabled,
        quietHoursStart: pref.quiet_hours_start,
        quietHoursEnd: pref.quiet_hours_end,
      };
    }

    // Default preferences for channels not yet set
    const channels = ["sms", "in_app", "push", "email"];
    for (const channel of channels) {
      if (!prefsMap[channel]) {
        prefsMap[channel] = {
          enabled: true,
          quietHoursStart: null,
          quietHoursEnd: null,
        };
      }
    }

    return NextResponse.json({ preferences: prefsMap });
  } catch (error) {
    console.error("Fetch preferences error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("709_profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 403 });
    }

    const body = await request.json();
    const { channel, enabled, quietHoursStart, quietHoursEnd } = body;

    if (!channel) {
      return NextResponse.json(
        { error: "Channel is required" },
        { status: 400 }
      );
    }

    const validChannels = ["sms", "in_app", "push", "email"];
    if (!validChannels.includes(channel)) {
      return NextResponse.json(
        { error: "Invalid channel" },
        { status: 400 }
      );
    }

    // Upsert preference
    const { data: preference, error } = await supabase
      .from("user_notification_preferences")
      .upsert(
        {
          user_id: user.id,
          tenant_id: profile.tenant_id,
          channel,
          enabled: enabled ?? true,
          quiet_hours_start: quietHoursStart || null,
          quiet_hours_end: quietHoursEnd || null,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,tenant_id,channel",
        }
      )
      .select()
      .single();

    if (error) {
      console.error("Update preference error:", error);
      return NextResponse.json(
        { error: "Failed to update preference" },
        { status: 500 }
      );
    }

    return NextResponse.json({ preference });
  } catch (error) {
    console.error("Update preference error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
