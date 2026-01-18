"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/* ═══════════════════════════════════════════════════════════════════════════
   Tenant Actions - Client Component
   Handles suspend/delete actions with confirmation
   ═══════════════════════════════════════════════════════════════════════════ */

type Props = {
  tenantId: string;
  tenantName: string;
};

export function TenantActions({ tenantId, tenantName }: Props) {
  const router = useRouter();
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  const handleSuspend = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/super-admin/tenants/${tenantId}/suspend`, {
        method: "POST",
      });
      if (res.ok) {
        router.refresh();
        setShowSuspendModal(false);
      }
    } catch (error) {
      console.error("Failed to suspend tenant:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmation !== tenantName) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/super-admin/tenants/${tenantId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/super-admin/tenants");
      }
    } catch (error) {
      console.error("Failed to delete tenant:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--error)]/30 p-6">
        <h2 className="text-lg font-semibold text-[var(--error)] mb-4">
          Danger Zone
        </h2>
        <div className="space-y-3">
          <button
            onClick={() => setShowSuspendModal(true)}
            className="w-full flex items-center justify-between p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] hover:border-[var(--warning)] transition-colors text-left"
          >
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">
                Suspend Tenant
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Temporarily disable access to this tenant
              </p>
            </div>
            <svg
              className="w-5 h-5 text-[var(--warning)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
          </button>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="w-full flex items-center justify-between p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] hover:border-[var(--error)] transition-colors text-left"
          >
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">
                Delete Tenant
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Permanently delete this tenant and all data
              </p>
            </div>
            <svg
              className="w-5 h-5 text-[var(--error)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Suspend Modal */}
      {showSuspendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-[var(--void)]/80 backdrop-blur-sm"
            onClick={() => setShowSuspendModal(false)}
          />
          <div className="relative bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              Suspend Tenant
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mb-6">
              Are you sure you want to suspend <strong>{tenantName}</strong>?
              Users will not be able to access their accounts until the tenant
              is reactivated.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowSuspendModal(false)}
                className="btn-secondary text-sm"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleSuspend}
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-[var(--warning)] text-[var(--void)] font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? "Suspending..." : "Suspend Tenant"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-[var(--void)]/80 backdrop-blur-sm"
            onClick={() => setShowDeleteModal(false)}
          />
          <div className="relative bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-[var(--error)] mb-2">
              Delete Tenant
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              This action is <strong>irreversible</strong>. All data associated
              with <strong>{tenantName}</strong> will be permanently deleted,
              including:
            </p>
            <ul className="text-sm text-[var(--text-secondary)] mb-4 list-disc list-inside space-y-1">
              <li>All user accounts</li>
              <li>All products and inventory</li>
              <li>All orders and transactions</li>
              <li>All custom domains</li>
              <li>All AI configurations</li>
            </ul>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              Type <strong>{tenantName}</strong> to confirm:
            </p>
            <input
              type="text"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder={tenantName}
              className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--error)] mb-6"
            />
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmation("");
                }}
                className="btn-secondary text-sm"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={loading || deleteConfirmation !== tenantName}
                className="px-4 py-2 rounded-lg bg-[var(--error)] text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Deleting..." : "Delete Tenant"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
