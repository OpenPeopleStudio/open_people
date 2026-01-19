import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { checkProviderStatus, listModels } from "@/lib/ai/providers";
import type { AIProviderConfig, UserAISettings } from "@/types/ai-providers";
import { PROVIDER_TEMPLATES } from "@/types/ai-providers";

/* ═══════════════════════════════════════════════════════════════════════════
   GET /api/ai/settings
   Get user's AI provider settings
   ═══════════════════════════════════════════════════════════════════════════ */

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get user's AI settings from their profile or a dedicated table
    const { data: settings } = await supabase
      .from("user_ai_settings")
      .select("*")
      .eq("user_id", user.id)
      .single();
    
    if (settings) {
      return NextResponse.json({ settings: settings.settings as UserAISettings });
    }
    
    // Return default settings if none exist
    const defaultSettings: UserAISettings = {
      defaultProvider: "openai",
      providers: [
        {
          id: "openai",
          ...PROVIDER_TEMPLATES.openai,
          apiKey: process.env.OPENAI_API_KEY ? "[CONFIGURED]" : undefined,
          isEnabled: true,
          isDefault: true,
        } as AIProviderConfig,
      ],
      fallbackToOpenAI: true,
      preferLocalForSimpleTasks: false,
      useOpenAIForEmbeddings: true,
    };
    
    return NextResponse.json({ settings: defaultSettings });
    
  } catch (error) {
    console.error("AI settings fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   PUT /api/ai/settings
   Update user's AI provider settings
   ═══════════════════════════════════════════════════════════════════════════ */

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const body: { settings: Partial<UserAISettings> } = await request.json();
    
    // Validate settings
    if (!body.settings) {
      return NextResponse.json({ error: "Settings are required" }, { status: 400 });
    }
    
    // Upsert settings
    const { data, error } = await supabase
      .from("user_ai_settings")
      .upsert({
        user_id: user.id,
        settings: body.settings,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "user_id",
      })
      .select()
      .single();
    
    if (error) {
      console.error("Failed to save AI settings:", error);
      return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
    }
    
    return NextResponse.json({ settings: data.settings });
    
  } catch (error) {
    console.error("AI settings update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   POST /api/ai/settings/test
   Test a provider connection
   ═══════════════════════════════════════════════════════════════════════════ */

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const body: { provider: AIProviderConfig } = await request.json();
    
    if (!body.provider) {
      return NextResponse.json({ error: "Provider config is required" }, { status: 400 });
    }
    
    // Test the provider connection
    const status = await checkProviderStatus(body.provider);
    
    // If available, also list models
    let models: string[] = [];
    if (status.available) {
      models = await listModels(body.provider);
    }
    
    return NextResponse.json({
      status,
      models,
    });
    
  } catch (error) {
    console.error("Provider test error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
