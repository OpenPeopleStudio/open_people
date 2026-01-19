"use client";

import { ChatView } from "@/components/workspace/chat/ChatView";

/* ═══════════════════════════════════════════════════════════════════════════
   Tenant Admin AI Chat Page
   ═══════════════════════════════════════════════════════════════════════════ */

export default function TenantChatPage() {
  return <ChatView basePath="/admin" />;
}
