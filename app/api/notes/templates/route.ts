import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

/* ═══════════════════════════════════════════════════════════════════════════
   GET /api/notes/templates
   List available note templates
   ═══════════════════════════════════════════════════════════════════════════ */

export async function GET() {
  try {
    const supabase = await createSupabaseServer();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get templates (user's + system)
    const { data: templates, error: templatesError } = await supabase
      .from("note_templates")
      .select("*")
      .or(`owner_id.eq.${user.id},is_system.eq.true`)
      .order("is_system", { ascending: false })
      .order("use_count", { ascending: false });
    
    if (templatesError) {
      console.error("Failed to fetch templates:", templatesError);
      return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
    }
    
    return NextResponse.json({ templates: templates || [] });
    
  } catch (error) {
    console.error("Templates fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   POST /api/notes/templates
   Create a custom template
   ═══════════════════════════════════════════════════════════════════════════ */

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Parse body
    const body = await request.json();
    const {
      name,
      description,
      category,
      title_template,
      content_template,
      default_tags = [],
      default_metadata = {},
      variables = [],
    } = body;
    
    if (!name?.trim() || !content_template?.trim()) {
      return NextResponse.json(
        { error: "Name and content_template are required" },
        { status: 400 }
      );
    }
    
    // Insert template
    const { data: template, error: insertError } = await supabase
      .from("note_templates")
      .insert({
        owner_id: user.id,
        name,
        description,
        category,
        title_template,
        content_template,
        default_tags,
        default_metadata,
        variables,
        is_system: false,
      })
      .select()
      .single();
    
    if (insertError) {
      console.error("Failed to create template:", insertError);
      return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
    }
    
    return NextResponse.json({ template });
    
  } catch (error) {
    console.error("Template create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
