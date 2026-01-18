import { createSupabaseServer } from "@/lib/supabase/server";
import { EMAIL_PLANS } from "@/types/email";
import { NextRequest, NextResponse } from "next/server";

/* ═══════════════════════════════════════════════════════════════════════════
   Email Templates API
   GET /api/email/templates - List templates
   POST /api/email/templates - Create template
   PUT /api/email/templates - Update template
   DELETE /api/email/templates - Delete template
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

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    let query = supabase
      .from("email_templates")
      .select("*")
      .eq("tenant_id", profile.tenant_id)
      .order("created_at", { ascending: false });

    if (category) {
      query = query.eq("category", category);
    }

    const { data: templates, error } = await query;

    if (error) {
      console.error("List templates error:", error);
      return NextResponse.json({ error: "Failed to list templates" }, { status: 500 });
    }

    return NextResponse.json({ templates: templates || [] });
  } catch (error) {
    console.error("List templates error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

    // Check template limit
    const { data: subscription } = await supabase
      .from("email_subscriptions")
      .select("tier")
      .eq("tenant_id", profile.tenant_id)
      .single();

    const tier = subscription?.tier || "free";
    const plan = EMAIL_PLANS[tier as keyof typeof EMAIL_PLANS];

    const { count: templateCount } = await supabase
      .from("email_templates")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", profile.tenant_id);

    if (plan.templates !== -1 && (templateCount || 0) >= plan.templates) {
      return NextResponse.json(
        { error: `Template limit reached (${plan.templates}). Upgrade your plan.` },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, slug, subject, htmlBody, textBody, variables, category } = body;

    if (!name || !slug || !subject || !htmlBody) {
      return NextResponse.json(
        { error: "Name, slug, subject, and htmlBody are required" },
        { status: 400 }
      );
    }

    // Validate slug format
    const validSlug = /^[a-z0-9-]+$/;
    if (!validSlug.test(slug)) {
      return NextResponse.json(
        { error: "Slug must be lowercase alphanumeric with hyphens" },
        { status: 400 }
      );
    }

    const { data: template, error } = await supabase
      .from("email_templates")
      .insert({
        tenant_id: profile.tenant_id,
        name,
        slug,
        subject,
        html_body: htmlBody,
        text_body: textBody || null,
        variables: variables || [],
        category: category || "transactional",
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "A template with this slug already exists" },
          { status: 409 }
        );
      }
      console.error("Create template error:", error);
      return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error("Create template error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
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
    const { id, name, subject, htmlBody, textBody, variables, category, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: "Template ID is required" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (name !== undefined) updateData.name = name;
    if (subject !== undefined) updateData.subject = subject;
    if (htmlBody !== undefined) updateData.html_body = htmlBody;
    if (textBody !== undefined) updateData.text_body = textBody;
    if (variables !== undefined) updateData.variables = variables;
    if (category !== undefined) updateData.category = category;
    if (isActive !== undefined) updateData.is_active = isActive;

    const { data: template, error } = await supabase
      .from("email_templates")
      .update(updateData)
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .select()
      .single();

    if (error) {
      console.error("Update template error:", error);
      return NextResponse.json({ error: "Failed to update template" }, { status: 500 });
    }

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error("Update template error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
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
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Template ID is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("email_templates")
      .delete()
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id);

    if (error) {
      console.error("Delete template error:", error);
      return NextResponse.json({ error: "Failed to delete template" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete template error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
