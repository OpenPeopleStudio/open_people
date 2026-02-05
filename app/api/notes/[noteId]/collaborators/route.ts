/**
 * Note Collaborators API
 *
 * Manages collaborators for shared notes.
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuthAndAuthZ } from "@/lib/auth/middleware";
import { createSupabaseServer } from "@/lib/supabase/server";

const handleInviteCollaborator = withAuthAndAuthZ()(async (auth, request: NextRequest) => {
  const supabase = await createSupabaseServer();
  const noteId = request.nextUrl.pathname.split('/')[3];

  if (!noteId) {
    return NextResponse.json(
      { error: 'Note ID is required' },
      { status: 400 }
    );
  }

  const { email, permission } = await request.json();

  if (!email || !permission) {
    return NextResponse.json(
      { error: 'Email and permission are required' },
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

  // Check if user exists
  const { data: existingUser } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .eq('email', email)
    .single();

  if (!existingUser) {
    return NextResponse.json(
      { error: 'User not found. They must have an account first.' },
      { status: 400 }
    );
  }

  // Check if already a collaborator
  const { data: existingCollab } = await supabase
    .from('note_collaborators')
    .select('id')
    .eq('note_id', noteId)
    .eq('user_id', existingUser.id)
    .single();

  if (existingCollab) {
    return NextResponse.json(
      { error: 'User is already a collaborator' },
      { status: 400 }
    );
  }

  // Add collaborator
  const { error } = await supabase
    .from('note_collaborators')
    .insert({
      note_id: noteId,
      user_id: existingUser.id,
      permission,
      invited_by: auth.user.id,
      invited_at: new Date().toISOString(),
      accepted_at: new Date().toISOString(), // Auto-accept for now
    });

  if (error) {
    console.error('Failed to add collaborator:', error);
    return NextResponse.json(
      { error: 'Failed to add collaborator' },
      { status: 500 }
    );
  }

  // Log the collaboration invitation
  await supabase
    .from('vault_audit_log')
    .insert({
      vault_id: noteId,
      action: 'note_collaborator_added',
      resource_type: 'note',
      resource_id: noteId,
      performed_by: auth.user.id,
      success: true,
      metadata: {
        collaborator_email: email,
        permission,
      },
    });

  return NextResponse.json({
    message: 'Collaborator added successfully',
    collaborator: {
      user_id: existingUser.id,
      user_email: existingUser.email,
      user_name: existingUser.full_name,
      permission,
    },
  });
});

const handleGetCollaborators = withAuthAndAuthZ()(async (auth, request: NextRequest) => {
  const supabase = await createSupabaseServer();
  const noteId = request.nextUrl.pathname.split('/')[3];

  if (!noteId) {
    return NextResponse.json(
      { error: 'Note ID is required' },
      { status: 400 }
    );
  }

  // Verify ownership or collaboration
  const { data: note } = await supabase
    .from('notes')
    .select('owner_id')
    .eq('id', noteId)
    .single();

  if (!note) {
    return NextResponse.json(
      { error: 'Note not found' },
      { status: 404 }
    );
  }

  // Check if user has access
  const hasAccess = note.owner_id === auth.user.id ||
    await checkCollaborationAccess(supabase, noteId, auth.user.id);

  if (!hasAccess) {
    return NextResponse.json(
      { error: 'Access denied' },
      { status: 403 }
    );
  }

  // Get collaborators
  const { data: collaborators } = await supabase
    .from('note_collaborators')
    .select(`
      id,
      user_id,
      permission,
      invited_by,
      invited_at,
      accepted_at,
      user:user_profiles(email, full_name)
    `)
    .eq('note_id', noteId);

  const formattedCollaborators =
    collaborators?.map((collab) => {
      const userInfo = Array.isArray(collab.user) ? collab.user[0] : collab.user;
      return {
        id: collab.id,
        user_id: collab.user_id,
        permission: collab.permission,
        invited_by: collab.invited_by,
        invited_at: collab.invited_at,
        accepted_at: collab.accepted_at,
        user_email: userInfo?.email,
        user_name: userInfo?.full_name,
      };
    }) || [];

  return NextResponse.json({
    collaborators: formattedCollaborators,
  });
});

export const GET = handleGetCollaborators;
export const POST = handleInviteCollaborator;

async function checkCollaborationAccess(
  supabase: ReturnType<typeof createSupabaseServer> extends Promise<infer T> ? T : never,
  noteId: string,
  userId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('note_collaborators')
    .select('id')
    .eq('note_id', noteId)
    .eq('user_id', userId)
    .not('accepted_at', 'is', null)
    .single();

  return !!data;
}
