"use client";

import { ChatView } from "@/components/workspace/chat/ChatView";

/* ═══════════════════════════════════════════════════════════════════════════
   Super Admin AI Chat Page
   Now uses the shared ChatView component for unified functionality
   ═══════════════════════════════════════════════════════════════════════════ */

export default function SuperAdminChatPage() {
  return <ChatView basePath="/super-admin" />;
}
