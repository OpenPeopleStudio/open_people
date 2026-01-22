/**
 * Public Note View
 *
 * Allows anyone to view publicly shared notes without authentication.
 * Supports comments if enabled.
 */

import { notFound } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { PublicNoteView } from "@/components/notes/PublicNoteView";
import type { Note, NoteComment } from "@/types/notes";

type PublicNote = Pick<
  Note,
  | "id"
  | "title"
  | "content"
  | "format"
  | "tags"
  | "metadata"
  | "is_public"
  | "allow_comments"
  | "created_at"
  | "updated_at"
> & {
  category?: { name: string; color: string } | null;
  comments: NoteComment[];
};

type PublicNotePageProps = {
  params: Promise<{ slug: string }>;
};

async function getPublicNote(slug: string): Promise<PublicNote | null> {
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
  let comments: NoteComment[] = [];
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

    comments = (commentsData || []) as NoteComment[];
  }

  const category = Array.isArray(note.category) ? note.category[0] : note.category;

  return {
    ...note,
    category: category ?? null,
    comments,
  } as PublicNote;
}

export default async function PublicNotePage({ params }: PublicNotePageProps) {
  const { slug } = await params;
  const note = await getPublicNote(slug);

  if (!note) {
    notFound();
  }

  return <PublicNoteView note={note} />;
}

export async function generateMetadata({ params }: PublicNotePageProps) {
  const { slug } = await params;
  const note = await getPublicNote(slug);

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
