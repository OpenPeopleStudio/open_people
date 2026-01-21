/**
 * Public Note View
 *
 * Allows anyone to view publicly shared notes without authentication.
 * Supports comments if enabled.
 */

import { notFound } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { PublicNoteView } from "@/components/notes/PublicNoteView";

interface PublicNotePageProps {
  params: {
    slug: string;
  };
}

async function getPublicNote(slug: string) {
  const supabase = await createSupabaseServer();

  // Get the public note
  const { data: note, error } = await supabase
    .from('notes')
    .select(`
      id,
      title,
      content,
      format,
      tags,
      metadata,
      is_public,
      allow_comments,
      created_at,
      updated_at,
      category:note_categories(name, color)
    `)
    .eq('public_slug', slug)
    .eq('is_public', true)
    .eq('status', 'published')
    .single();

  if (error || !note) {
    return null;
  }

  // Get comments if enabled
  let comments = [];
  if (note.allow_comments) {
    const { data: commentsData } = await supabase
      .from('note_comments')
      .select(`
        id,
        content,
        created_at,
        updated_at,
        user_name,
        user_email,
        replies:note_comments!parent_id(
          id,
          content,
          created_at,
          user_name,
          user_email
        )
      `)
      .eq('note_id', note.id)
      .is('parent_id', null)
      .order('created_at', { ascending: true });

    comments = commentsData || [];
  }

  return {
    ...note,
    comments,
  };
}

export default async function PublicNotePage({ params }: PublicNotePageProps) {
  const note = await getPublicNote(params.slug);

  if (!note) {
    notFound();
  }

  return <PublicNoteView note={note} />;
}

export async function generateMetadata({ params }: PublicNotePageProps) {
  const note = await getPublicNote(params.slug);

  if (!note) {
    return {
      title: 'Note not found',
    };
  }

  return {
    title: note.title,
    description: note.content.slice(0, 160),
    openGraph: {
      title: note.title,
      description: note.content.slice(0, 160),
      type: 'article',
    },
  };
}