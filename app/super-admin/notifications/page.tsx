import { redirect } from "next/navigation";

/* ═══════════════════════════════════════════════════════════════════════════
   Super Admin - Notifications
   Moved into Analytics (tab)
   ═══════════════════════════════════════════════════════════════════════════ */

export default async function SuperAdminNotificationsPage() {
  redirect("/super-admin/analytics?tab=notifications");
}
