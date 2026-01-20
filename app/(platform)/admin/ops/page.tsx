import { permanentRedirect } from "next/navigation";

/* ═══════════════════════════════════════════════════════════════════════════
   Ops Worker - Legacy Route Redirect
   Permanently redirects to the new AI Team location
   ═══════════════════════════════════════════════════════════════════════════ */

export default function OpsWorkerLegacyPage() {
  permanentRedirect("/admin/ai/team/ops");
}
