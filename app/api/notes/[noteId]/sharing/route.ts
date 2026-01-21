/**
 * Note Sharing API
 *
 * Manages sharing settings and collaborators for notes.
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuthAndAuthZ, UserRole } from "@/lib/auth/middleware";
import { createSupabaseServer } from "@/lib/supabase/server";

const handleGetSharing = withAuthAndAuthZ()(async (auth, request: NextRequest) => {
  const supabase = await createSupabaseServer();
  const noteId = request.nextUrl.pathname.split('/')[3];

  if (!noteId) {
    return NextResponse.json(
      { error: 'Note ID is required' },
      { status: 400 }
    );
  }

  // Verify ownership
  const { data: note } = await supabase
    .from('notes')
    .select('owner_id, is_public, public_slug, allow_comments')
    .eq('id', noteId)
    .single();

  if (!note || note.owner_id !== auth.user.id) {
    return NextResponse.json(
      { error: 'Note not found or access denied' },
      { status: 404 }
    );
  }

  // Get collaborators
  const { data: collaborators } = await supabase
    .from('note_collaborators')
    .select(`
      id,
      note_id,
      user_id,
      permission,
      invited_by,
      invited_at,
      accepted_at,
      user:user_profiles(email, full_name)
    `)
    .eq('note_id', noteId);

  const formattedCollaborators = collaborators?.map(collab => ({
    id: collab.id,
    note_id: collab.note_id,
    user_id: collab.user_id,
    permission: collab.permission,
    invited_by: collab.invited_by,
    invited_at: collab.invited_at,
    accepted_at: collab.accepted_at,
    user_email: collab.user?.email,
    user_name: collab.user?.full_name,
  })) || [];

  return NextResponse.json({
    isPublic: note.is_public,
    publicSlug: note.public_slug,
    allowComments: note.allow_comments,
    collaborators: formattedCollaborators,
  });
});

const handleUpdateSharing = withAuthAndAuthZ()(async (auth, request: NextRequest) => {
  const supabase = await createSupabaseServer();
  const noteId = request.nextUrl.pathname.split('/')[3];

  if (!noteId) {
    return NextResponse.json(
      { error: 'Note ID is required' },
      { status: 400 }
    );
  }

  const { isPublic, publicSlug, allowComments } = await request.json();

  // Verify ownership
  const { data: note } = await supabase
    .from('notes')
    .select('owner_id')
    .eq('id', noteId)
    .single();

  if (!note || note.owner_id !== auth.user.id) {
    return NextResponse.json(
      { error: 'Note not found or access denied' },
      { status: 404 }
    );
  }

  // Generate public slug if making public
  let finalPublicSlug = publicSlug;
  if (isPublic && !finalPublicSlug) {
    finalPublicSlug = `${noteId.slice(0, 8)}-${Date.now().toString(36)}`;
  }

  // Update sharing settings
  const { error } = await supabase
    .from('notes')
    .update({
      is_public: isPublic,
      public_slug: isPublic ? finalPublicSlug : null,
      allow_comments: allowComments,
      updated_at: new Date().toISOString(),
    })
    .eq('id', noteId);

  if (error) {
    console.error('Failed to update sharing:', error);
    return NextResponse.json(
      { error: 'Failed to update sharing settings' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    message: 'Sharing settings updated',
    isPublic,
    publicSlug: finalPublicSlug,
    allowComments,
  });
});

export const GET = handleGetSharing;
export const PATCH = handleUpdateSharing;