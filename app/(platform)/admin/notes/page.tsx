"use client";

import { NotesListView } from "@/components/workspace/notes/NotesListView";

/* ═══════════════════════════════════════════════════════════════════════════
   Tenant Admin Notes Page
   ═══════════════════════════════════════════════════════════════════════════ */

export default function TenantNotesPage() {
  return <NotesListView basePath="/admin" />;
}
