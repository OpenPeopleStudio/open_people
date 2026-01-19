import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import type { CreateCategoryRequest } from "@/types/notes";

/* ═══════════════════════════════════════════════════════════════════════════
   GET /api/notes/categories
   List note categories
   ═══════════════════════════════════════════════════════════════════════════ */

export async function GET() {
  try {
    const supabase = await createSupabaseServer();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get categories
    const { data: categories, error: categoriesError } = await supabase
      .from("note_categories")
      .select("*")
      .eq("owner_id", user.id)
      .order("sort_order", { ascending: true });
    
    if (categoriesError) {
      console.error("Failed to fetch categories:", categoriesError);
      return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
    }
    
    return NextResponse.json({ categories: categories || [] });
    
  } catch (error) {
    console.error("Categories fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   POST /api/notes/categories
   Create a new category
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
    const body: CreateCategoryRequest = await request.json();
    const { name, description, color = "#6b7280", icon, parent_id } = body;
    
    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    
    // Generate slug
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    
    // Get max sort order
    const { data: maxOrder } = await supabase
      .from("note_categories")
      .select("sort_order")
      .eq("owner_id", user.id)
      .order("sort_order", { ascending: false })
      .limit(1)
      .single();
    
    const sortOrder = (maxOrder?.sort_order || 0) + 1;
    
    // Insert category
    const { data: category, error: insertError } = await supabase
      .from("note_categories")
      .insert({
        owner_id: user.id,
        name,
        slug,
        description,
        color,
        icon,
        parent_id,
        sort_order: sortOrder,
      })
      .select()
      .single();
    
    if (insertError) {
      if (insertError.code === "23505") {
        return NextResponse.json({ error: "Category with this name already exists" }, { status: 400 });
      }
      console.error("Failed to create category:", insertError);
      return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
    }
    
    return NextResponse.json({ category });
    
  } catch (error) {
    console.error("Category create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
