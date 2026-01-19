import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { decryptApiKey } from "@/lib/api-keys/encryption";
import type { ExternalNoteResponse } from "@/types/notes";

/* ═══════════════════════════════════════════════════════════════════════════
   External API: GET /api/v1/notes
   
   Fetch notes accessible via API key
   
   Authentication: Bearer token (API key)
   
   Query params:
   - project: Filter by project name
   - slug: Get specific note by slug
   - tag: Filter by tag
   - limit: Max results (default 50)
   
   Long-term vision: AI agents can fetch project context via this API
   ═══════════════════════════════════════════════════════════════════════════ */

export async function GET(request: NextRequest) {
  try {
    // Extract API key from Authorization header
    const authHeader = request.headers.get("authorization");
    
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid Authorization header" },
        { status: 401 }
      );
    }
    
    const apiKey = authHeader.slice(7); // Remove "Bearer "
    
    const supabase = await createSupabaseServer();
    
    // Look up the API key
    const { data: keyRecord, error: keyError } = await supabase
      .from("api_keys")
      .select("id, owner_id, is_active, encrypted_key, encryption_iv")
      .eq("is_active", true)
      .limit(100); // Get recent active keys to check
    
    if (keyError || !keyRecord?.length) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }
    
    // Find matching key (we need to decrypt each to compare)
    let matchedKey: { id: string; owner_id: string } | null = null;
    
    for (const record of keyRecord) {
      try {
        const decrypted = decryptApiKey({
          encryptedKey: record.encrypted_key,
          iv: record.encryption_iv,
        });
        
        if (decrypted === apiKey) {
          matchedKey = { id: record.id, owner_id: record.owner_id };
          break;
        }
      } catch {
        // Skip keys that fail to decrypt
        continue;
      }
    }
    
    if (!matchedKey) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }
    
    // Log the API access
    await supabase
      .from("api_key_usage")
      .insert({
        key_id: matchedKey.id,
        action: "notes_read",
        source: "external_api",
        ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
        user_agent: request.headers.get("user-agent"),
        success: true,
      });
    
    // Parse query params
    const { searchParams } = new URL(request.url);
    const project = searchParams.get("project");
    const slug = searchParams.get("slug");
    const tag = searchParams.get("tag");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    
    // Build query for notes accessible via this API key
    let query = supabase
      .from("notes")
      .select("id, title, slug, content, excerpt, format, tags, metadata, project_name, version, updated_at")
      .eq("owner_id", matchedKey.owner_id)
      .eq("is_api_accessible", true)
      .eq("status", "published")
      .order("updated_at", { ascending: false })
      .limit(limit);
    
    // Filter by specific API key if note has one assigned
    // Notes with api_key_id = NULL are accessible by any key from the same owner
    // Notes with api_key_id set are only accessible by that specific key
    
    // Apply filters
    if (slug) {
      query = query.eq("slug", slug);
    }
    if (project) {
      query = query.eq("project_name", project);
    }
    if (tag) {
      query = query.contains("tags", [tag]);
    }
    
    const { data: notes, error: notesError } = await query;
    
    if (notesError) {
      console.error("Failed to fetch notes:", notesError);
      return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 });
    }
    
    // Filter out notes that require a specific API key that doesn't match
    const accessibleNotes = notes?.filter(note => {
      const noteApiKeyId = (note as unknown as { api_key_id: string | null }).api_key_id;
      return !noteApiKeyId || noteApiKeyId === matchedKey!.id;
    });
    
    // Log note access
    if (accessibleNotes?.length) {
      await supabase
        .from("note_api_access")
        .insert(
          accessibleNotes.map(note => ({
            note_id: note.id,
            api_key_id: matchedKey!.id,
            action: "read",
            ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
            user_agent: request.headers.get("user-agent"),
          }))
        );
    }
    
    // Format response
    const response: ExternalNoteResponse[] = (accessibleNotes || []).map(note => ({
      id: note.id,
      title: note.title,
      slug: note.slug,
      content: note.content,
      excerpt: note.excerpt,
      format: note.format,
      tags: note.tags,
      metadata: note.metadata as Record<string, unknown>,
      project_name: note.project_name,
      version: note.version,
      updated_at: note.updated_at,
    }));
    
    // If fetching single note by slug, return just that note
    if (slug) {
      if (response.length === 0) {
        return NextResponse.json({ error: "Note not found" }, { status: 404 });
      }
      return NextResponse.json({ note: response[0] });
    }
    
    return NextResponse.json({
      notes: response,
      count: response.length,
    });
    
  } catch (error) {
    console.error("External notes API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
