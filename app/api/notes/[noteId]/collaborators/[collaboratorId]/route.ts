/**
 * Note Collaborator Management API
 *
 * Manages individual collaborators for shared notes.
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuthAndAuthZ } from "@/lib/auth/middleware";
import { createSupabaseServer } from "@/lib/supabase/server";

const handleUpdateCollaborator = withAuthAndAuthZ()(async (auth, request: NextRequest) => {
  const supabase = await createSupabaseServer();
  const noteId = request.nextUrl.pathname.split('/')[3];
  const collaboratorId = request.nextUrl.pathname.split('/')[5];

  if (!noteId || !collaboratorId) {
    return NextResponse.json(
      { error: 'Note ID and Collaborator ID are required' },
      { status: 400 }
    );
  }

  const { permission } = await request.json();

  // Verify ownership
  const { data: note } = await supabase
    .from('notes')
    .select('owner_id, title')
    .eq('id', noteId)
    .single();

  if (!note || note.owner_id !== auth.user.id) {
    return NextResponse.json(
      { error: 'Note not found or access denied' },
      { status: 404 }
    );
  }

  // Update collaborator permission
  const { error } = await supabase
    .from('note_collaborators')
    .update({ permission })
    .eq('id', collaboratorId)
    .eq('note_id', noteId);

  if (error) {
    console.error('Failed to update collaborator:', error);
    return NextResponse.json(
      { error: 'Failed to update collaborator' },
      { status: 500 }
    );
  }

  // Log the permission change
  await supabase
    .from('vault_audit_log')
    .insert({
      vault_id: noteId,
      action: 'note_collaborator_updated',
      resource_type: 'note',
      resource_id: noteId,
      performed_by: auth.user.id,
      success: true,
      metadata: {
        collaborator_id: collaboratorId,
        permission,
      },
    });

  return NextResponse.json({
    message: 'Collaborator updated successfully',
    permission,
  });
});

const handleRemoveCollaborator = withAuthAndAuthZ()(async (auth, request: NextRequest) => {
  const supabase = await createSupabaseServer();
  const noteId = request.nextUrl.pathname.split('/')[3];
  const collaboratorId = request.nextUrl.pathname.split('/')[5];

  if (!noteId || !collaboratorId) {
    return NextResponse.json(
      { error: 'Note ID and Collaborator ID are required' },
      { status: 400 }
    );
  }

  // Verify ownership
  const { data: note } = await supabase
    .from('notes')
    .select('owner_id, title')
    .eq('id', noteId)
    .single();

  if (!note || note.owner_id !== auth.user.id) {
    return NextResponse.json(
      { error: 'Note not found or access denied' },
      { status: 404 }
    );
  }

  // Get collaborator info for logging
  const { data: collaborator } = await supabase
    .from('note_collaborators')
    .select('user_id, user:user_profiles(email)')
    .eq('id', collaboratorId)
    .single();

  // Remove collaborator
  const { error } = await supabase
    .from('note_collaborators')
    .delete()
    .eq('id', collaboratorId)
    .eq('note_id', noteId);

  if (error) {
    console.error('Failed to remove collaborator:', error);
    return NextResponse.json(
      { error: 'Failed to remove collaborator' },
      { status: 500 }
    );
  }

  // Log the removal
  const collaboratorEmail = Array.isArray(collaborator?.user)
    ? collaborator.user[0]?.email
    : (collaborator?.user as { email?: string } | undefined)?.email;
  await supabase
    .from('vault_audit_log')
    .insert({
      vault_id: noteId,
      action: 'note_collaborator_removed',
      resource_type: 'note',
      resource_id: noteId,
      performed_by: auth.user.id,
      success: true,
      metadata: {
        collaborator_id: collaboratorId,
        ...(collaboratorEmail ? { collaborator_email: collaboratorEmail } : {}),
      },
    });

  return NextResponse.json({
    message: 'Collaborator removed successfully',
  });
});

export const PATCH = handleUpdateCollaborator;
export const DELETE = handleRemoveCollaborator;
