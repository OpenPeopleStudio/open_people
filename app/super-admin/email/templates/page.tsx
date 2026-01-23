import { createSupabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { EMAIL_PLANS } from "@/types/email";
import { SuperAdminEmailTemplatesClient } from "./SuperAdminEmailTemplatesClient";

/* ═══════════════════════════════════════════════════════════════════════════
   Email Templates Page (Super Admin)
   Platform-wide template management
   ═══════════════════════════════════════════════════════════════════════════ */

async function getTemplatesData() {
  const supabase = await createSupabaseServer();

  // Get all templates across tenants
  const { data: templates } = await supabase
    .from("email_templates")
    .select("*")
    .order("created_at", { ascending: false });

  // Get tenants
  const { data: tenants } = await supabase
    .from("tenants")
    .select("id, name, slug")
    .eq("status", "active")
    .order("name");

  return {
    templates: templates || [],
    tenants: tenants || [],
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

  // Verify super admin access
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "super_admin") {
    redirect("/login");
  }

  const data = await getTemplatesData();
  const plan = EMAIL_PLANS.enterprise; // Super admin gets enterprise features

  return (
    <SuperAdminEmailTemplatesClient
      templates={data.templates}
      tenants={data.tenants}
      plan={plan}
    />
  );
}
