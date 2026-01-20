import { createSupabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { EMAIL_PLANS } from "@/types/email";
import { EmailTemplatesClient } from "./EmailTemplatesClient";

/* ═══════════════════════════════════════════════════════════════════════════
   Email Templates Page (Tenant Admin)
   Manage reusable email templates
   ═══════════════════════════════════════════════════════════════════════════ */

async function getTemplatesData(tenantId: string) {
  const supabase = await createSupabaseServer();

  // Get subscription for plan limits
  const { data: subscription } = await supabase
    .from("email_subscriptions")
    .select("tier, status")
    .eq("tenant_id", tenantId)
    .single();

  // Get templates
  const { data: templates } = await supabase
    .from("email_templates")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  return {
    subscription: subscription || { tier: "free", status: "active" },
    templates: templates || [],
  };
}

export default async function EmailTemplatesPage() {
  const supabase = await createSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("709_profiles")
    .select("tenant_id")
    .eq("id", user.id)
    .single();

  if (!profile?.tenant_id) {
    redirect("/login");
  }

  const data = await getTemplatesData(profile.tenant_id);
  const plan = EMAIL_PLANS[data.subscription.tier as keyof typeof EMAIL_PLANS] || EMAIL_PLANS.free;

  return (
    <EmailTemplatesClient
      templates={data.templates}
      plan={plan}
      tenantId={profile.tenant_id}
    />
  );
}
