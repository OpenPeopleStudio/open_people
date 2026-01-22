"use client";

import { useState } from "react";
import { Button, Card } from "@/lib/ui";
import type { Note, NoteComment } from "@/types/notes";

/* ═══════════════════════════════════════════════════════════════════════════
   Public Note View Component

   Renders publicly shared notes with optional commenting functionality.
   ═══════════════════════════════════════════════════════════════════════════ */

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

interface PublicNoteViewProps {
  note: PublicNote;
}

export function PublicNoteView({ note }: PublicNoteViewProps) {
  const [showComments, setShowComments] = useState(false);

  const renderContent = () => {
    switch (note.format) {
      case 'markdown':
      case 'mdx':
        // Simple markdown-like rendering (in production, use a proper markdown renderer)
        return (
          <div className="prose prose-invert max-w-none">
            {note.content.split('\n').map((line, index) => {
              if (line.startsWith('# ')) {
                return <h1 key={index} className="text-2xl font-bold mb-4">{line.slice(2)}</h1>;
              }
              if (line.startsWith('## ')) {
                return <h2 key={index} className="text-xl font-semibold mb-3">{line.slice(3)}</h2>;
              }
              if (line.startsWith('- ')) {
                return <li key={index} className="mb-1">{line.slice(2)}</li>;
              }
              if (line.trim() === '') {
                return <br key={index} />;
              }
              return <p key={index} className="mb-2">{line}</p>;
            })}
          </div>
        );
      default:
        return <pre className="whitespace-pre-wrap font-mono text-sm">{note.content}</pre>;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--void)]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-4">
            <span>Public Note</span>
            {note.category && (
              <>
                <span>•</span>
                <span
                  className="px-2 py-1 rounded text-xs"
                  style={{ backgroundColor: `${note.category.color}20`, color: note.category.color }}
                >
                  {note.category.name}
                </span>
              </>
            )}
          </div>

          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-4">
            {note.title}
          </h1>

          <div className="flex items-center gap-4 text-sm text-[var(--text-muted)]">
            <span>Published {new Date(note.created_at).toLocaleDateString()}</span>
            {note.updated_at !== note.created_at && (
              <span>• Updated {new Date(note.updated_at).toLocaleDateString()}</span>
            )}
          </div>

          {note.tags.length > 0 && (
            <div className="flex gap-2 mt-4">
              {note.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 rounded-full text-xs bg-[var(--surface-2)] text-[var(--text-secondary)]"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <Card className="mb-8">
          <div className="p-6">
            {renderContent()}
          </div>
        </Card>

        {/* Comments Section */}
        {note.allow_comments && (
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                  Comments ({note.comments.length})
                </h2>
                <Button
                  variant="outline"
                  onClick={() => setShowComments(!showComments)}
                >
                  {showComments ? 'Hide Comments' : 'Show Comments'}
                </Button>
              </div>

              {showComments && (
                <div className="space-y-4">
                  {note.comments.length === 0 ? (
                    <p className="text-center text-[var(--text-muted)] py-8">
                      No comments yet. Be the first to comment!
                    </p>
                  ) : (
                    note.comments.map((comment) => (
                      <CommentThread key={comment.id} comment={comment} />
                    ))
                  )}

                  {/* Add Comment Form (would require authentication) */}
                  <div className="pt-4 border-t border-[var(--border-subtle)]">
                    <p className="text-sm text-[var(--text-muted)]">
                      To leave a comment, please sign in to your account.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-[var(--text-muted)] mt-8">
          <p>Shared via OpenPeople.ai</p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Comment Thread Component
   ═══════════════════════════════════════════════════════════════════════════ */

interface CommentThreadProps {
  comment: NoteComment;
}

function CommentThread({ comment }: CommentThreadProps) {
  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-full bg-[var(--electric-lime)]/10 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-medium text-[var(--electric-lime)]">
            {(comment.user_name || comment.user_email || 'A')[0].toUpperCase()}
          </span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-[var(--text-primary)]">
              {comment.user_name || 'Anonymous'}
            </span>
            <span className="text-xs text-[var(--text-muted)]">
              {new Date(comment.created_at).toLocaleDateString()}
            </span>
          </div>
          <p className="text-sm text-[var(--text-secondary)]">
            {comment.content}
          </p>
        </div>
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-11 space-y-3">
          {comment.replies.map((reply) => (
            <div key={reply.id} className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-[var(--surface-3)] flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-medium text-[var(--text-primary)]">
                  {(reply.user_name || reply.user_email || 'A')[0].toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {reply.user_name || 'Anonymous'}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">
                    {new Date(reply.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-[var(--text-secondary)]">
                  {reply.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
