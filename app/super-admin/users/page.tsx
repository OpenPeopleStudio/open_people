"use client";

import { UserManagement } from "@/components/super-admin/UserManagement";

/* ═══════════════════════════════════════════════════════════════════════════
   Super Admin - User Management Page
   ═══════════════════════════════════════════════════════════════════════════ */

export default function UsersPage() {
  return (
    <div className="p-8">
      <UserManagement />
    </div>
  );
}