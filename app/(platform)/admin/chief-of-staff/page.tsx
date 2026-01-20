import { permanentRedirect } from "next/navigation";

/* ═══════════════════════════════════════════════════════════════════════════
   Chief of Staff - Legacy Route Redirect
   Permanently redirects to the new AI Team location
   ═══════════════════════════════════════════════════════════════════════════ */

export default function ChiefOfStaffLegacyPage() {
  permanentRedirect("/admin/ai/team/chief-of-staff");
}
