"use client";

import { useState } from "react";
import { Button, Card, Modal, ModalActions, FormField, Input, StatusBadge, LoadingSpinner } from "@/lib/ui";
import type { NoteCollaborator } from "@/types/notes";

/* ═══════════════════════════════════════════════════════════════════════════
   Note Sharing Component

   Allows users to share notes with others and manage sharing permissions.
   Supports public sharing, collaborator invitations, and permission management.
   ═══════════════════════════════════════════════════════════════════════════ */

interface NoteSharingProps {
  noteId: string;
  currentUserId: string;
  isPublic: boolean;
  publicSlug?: string;
  allowComments: boolean;
  collaborators: NoteCollaborator[];
  onUpdateSharing: (updates: {
    isPublic?: boolean;
    publicSlug?: string;
    allowComments?: boolean;
  }) => Promise<void>;
  onInviteCollaborator: (email: string, permission: "read" | "write") => Promise<void>;
  onUpdateCollaborator: (collaboratorId: string, permission: "read" | "write") => Promise<void>;
  onRemoveCollaborator: (collaboratorId: string) => Promise<void>;
}

export function NoteSharing({
  noteId,
  currentUserId,
  isPublic,
  publicSlug,
  allowComments,
  collaborators,
  onUpdateSharing,
  onInviteCollaborator,
  onUpdateCollaborator,
  onRemoveCollaborator,
}: NoteSharingProps) {
  void noteId;
  void currentUserId;
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showPublicSettings, setShowPublicSettings] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePermission, setInvitePermission] = useState<"read" | "write">("read");
  const [updating, setUpdating] = useState(false);

  const publicUrl =
    typeof window === "undefined" || !publicSlug
      ? null
      : `${window.location.origin}/notes/public/${publicSlug}`;

  const copyPublicLink = async () => {
    if (publicUrl) {
      await navigator.clipboard.writeText(publicUrl);
      // Could show a toast notification here
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;

    setUpdating(true);
    try {
      await onInviteCollaborator(inviteEmail, invitePermission);
      setInviteEmail('');
      setInvitePermission('read');
      setShowInviteModal(false);
    } catch (error) {
      console.error('Failed to invite collaborator:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateSharing = async (updates: {
    isPublic?: boolean;
    publicSlug?: string;
    allowComments?: boolean;
  }) => {
    setUpdating(true);
    try {
      await onUpdateSharing(updates);
    } catch (error) {
      console.error('Failed to update sharing:', error);
    } finally {
      setUpdating(false);
    }
  };

  const getPermissionColor = (permission: string): "error" | "warning" | "info" => {
    switch (permission) {
      case 'admin': return 'error';
      case 'write': return 'warning';
      case 'read': return 'info';
      default: return 'info';
    }
  };

  return (
    <div className="space-y-6">
      {/* Public Sharing */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-[var(--text-primary)]">
              Public Sharing
            </h3>
            <p className="text-sm text-[var(--text-muted)]">
              Make this note accessible to anyone with the link
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowPublicSettings(!showPublicSettings)}
          >
            {showPublicSettings ? 'Hide' : 'Configure'}
          </Button>
        </div>

        {isPublic && publicUrl && (
          <div className="mb-4 p-3 rounded-lg bg-[var(--success)]/10 border border-[var(--success)]/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--success)]">
                  This note is publicly accessible
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  {publicUrl}
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={copyPublicLink}>
                Copy Link
              </Button>
            </div>
          </div>
        )}

        {showPublicSettings && (
          <div className="space-y-4 pt-4 border-t border-[var(--border-subtle)]">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isPublic"
                checked={isPublic}
                onChange={(e) => handleUpdateSharing({ isPublic: e.target.checked })}
                className="w-4 h-4 rounded border-[var(--border-subtle)] text-[var(--electric-lime)] focus:ring-[var(--electric-lime)]"
              />
              <label htmlFor="isPublic" className="text-sm text-[var(--text-primary)]">
                Make this note public
              </label>
            </div>

            {isPublic && (
              <>
                <FormField label="Custom URL slug (optional)">
                  <Input
                    value={publicSlug || ''}
                    onChange={(e) => handleUpdateSharing({ publicSlug: e.target.value })}
                    placeholder="my-awesome-note"
                  />
                </FormField>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="allowComments"
                    checked={allowComments}
                    onChange={(e) => handleUpdateSharing({ allowComments: e.target.checked })}
                    className="w-4 h-4 rounded border-[var(--border-subtle)] text-[var(--electric-lime)] focus:ring-[var(--electric-lime)]"
                  />
                  <label htmlFor="allowComments" className="text-sm text-[var(--text-primary)]">
                    Allow comments on public page
                  </label>
                </div>
              </>
            )}
          </div>
        )}
      </Card>

      {/* Collaborators */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-[var(--text-primary)]">
              Collaborators
            </h3>
            <p className="text-sm text-[var(--text-muted)]">
              People who can access and edit this note
            </p>
          </div>
          <Button onClick={() => setShowInviteModal(true)}>
            Invite People
          </Button>
        </div>

        <div className="space-y-3">
          {/* Owner */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface-2)]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[var(--electric-lime)]/10 flex items-center justify-center">
                <span className="text-sm font-medium text-[var(--electric-lime)]">O</span>
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">You (Owner)</p>
                <p className="text-xs text-[var(--text-muted)]">Full access</p>
              </div>
            </div>
            <StatusBadge status="error">Owner</StatusBadge>
          </div>

          {/* Collaborators */}
          {collaborators.map((collaborator) => (
            <div key={collaborator.id} className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface-2)]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[var(--surface-3)] flex items-center justify-center">
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {(collaborator.user_name || collaborator.user_email || 'U')[0].toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {collaborator.user_name || 'Unknown User'}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {collaborator.user_email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {collaborator.accepted_at ? (
                  <>
                    <select
                      value={collaborator.permission}
                      onChange={(e) => onUpdateCollaborator(collaborator.id, e.target.value as "read" | "write")}
                      className="text-xs px-2 py-1 rounded border border-[var(--border-subtle)] bg-[var(--surface-1)]"
                    >
                      <option value="read">Can view</option>
                      <option value="write">Can edit</option>
                    </select>
                    <StatusBadge status={getPermissionColor(collaborator.permission)}>
                      {collaborator.permission}
                    </StatusBadge>
                  </>
                ) : (
                  <StatusBadge status="pending">Pending</StatusBadge>
                )}

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onRemoveCollaborator(collaborator.id)}
                  className="text-[var(--error)] hover:bg-[var(--error)]/10"
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}

          {collaborators.length === 0 && (
            <p className="text-sm text-[var(--text-muted)] text-center py-4">
              No collaborators yet. Invite people to start collaborating.
            </p>
          )}
        </div>
      </Card>

      {/* Invite Modal */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="Invite Collaborator"
        description="Share this note with someone else"
      >
        <div className="space-y-4">
          <FormField label="Email address">
            <Input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="colleague@example.com"
            />
          </FormField>

          <FormField label="Permission level">
            <select
              value={invitePermission}
              onChange={(e) => setInvitePermission(e.target.value as "read" | "write")}
              className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
            >
              <option value="read">Can view - Read-only access</option>
              <option value="write">Can edit - Full editing access</option>
            </select>
          </FormField>
        </div>

        <ModalActions>
          <Button variant="outline" onClick={() => setShowInviteModal(false)}>
            Cancel
          </Button>
          <Button onClick={handleInvite} disabled={updating || !inviteEmail.trim()}>
            {updating && <LoadingSpinner size="sm" className="mr-2" />}
            Send Invitation
          </Button>
        </ModalActions>
      </Modal>
    </div>
  );
}
