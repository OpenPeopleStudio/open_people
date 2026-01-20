import { NextResponse } from "next/server";
import { createSupabaseAdmin, createSupabaseServer } from "@/lib/supabase/server";

/* ═══════════════════════════════════════════════════════════════════════════
   Super Admin Demo Seed API (dev-only)
   POST /api/super-admin/demo/seed
   Seeds demo tenants + notification metrics so Analytics feels real.
   ═══════════════════════════════════════════════════════════════════════════ */

const DEMO_TENANTS: { slug: string; name: string; status: "active" | "trialing"; tier: "free" | "starter" | "pro" | "enterprise" }[] =
  [
    { slug: "acme", name: "Acme Capital", status: "active", tier: "pro" },
    { slug: "northwind", name: "Northwind Labs", status: "trialing", tier: "starter" },
    { slug: "helios", name: "Helios Ops", status: "active", tier: "enterprise" },
    { slug: "juniper", name: "Juniper & Co", status: "active", tier: "starter" },
    { slug: "keystone", name: "Keystone Ventures", status: "trialing", tier: "pro" },
  ];

function monthStartDateString(d = new Date()): string {
  const start = new Date(d);
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  return start.toISOString().split("T")[0];
}

export async function POST() {
  try {
    if (process.env.NODE_ENV !== "development") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("709_profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "super_admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const admin = await createSupabaseAdmin();

    // 1) Ensure demo tenants exist
    const slugs = DEMO_TENANTS.map((t) => t.slug);
    const { data: existingTenants } = await admin
      .from("tenants")
      .select("id, slug")
      .in("slug", slugs);

    const existingBySlug = new Map((existingTenants || []).map((t) => [t.slug, t.id] as const));
    const missing = DEMO_TENANTS.filter((t) => !existingBySlug.has(t.slug));

    if (missing.length > 0) {
      await admin.from("tenants").insert(
        missing.map((t) => ({
          name: t.name,
          slug: t.slug,
          status: t.status,
          settings: {
            theme: { brand_name: t.name },
            features: {
              admin: true,
              notes: true,
              workflows: true,
              knowledge: true,
              api_keys: true,
              vault: true,
              email: true,
              notifications: true,
              storage: true,
              ai_chat: true,
            },
          },
        }))
      );
    }

    const { data: tenantsAfter } = await admin
      .from("tenants")
      .select("id, slug, name")
      .in("slug", slugs);

    const tenantsBySlug = new Map((tenantsAfter || []).map((t) => [t.slug, t] as const));

    // 2) Seed notification subscriptions + usage + templates
    const periodStart = monthStartDateString();

    for (const t of DEMO_TENANTS) {
      const tenant = tenantsBySlug.get(t.slug);
      if (!tenant) continue;

      // Subscription (unique on tenant_id)
      await admin
        .from("notification_subscriptions")
        .upsert(
          {
            tenant_id: tenant.id,
            tier: t.tier,
            status: t.status === "trialing" ? "trialing" : "active",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "tenant_id" }
        );

      // Usage (primary key tenant_id, period_start)
      const base = t.tier === "enterprise" ? 900 : t.tier === "pro" ? 520 : t.tier === "starter" ? 180 : 40;
      const smsSent = Math.floor(base * 0.6);
      const smsDelivered = Math.floor(smsSent * 0.96);
      const smsFailed = Math.max(0, smsSent - smsDelivered);
      const inAppSent = Math.floor(base * 0.9);
      const inAppRead = Math.floor(inAppSent * 0.62);
      const pushSent = Math.floor(base * 0.2);
      const pushDelivered = Math.floor(pushSent * 0.85);

      await admin.from("notification_usage").upsert(
        {
          tenant_id: tenant.id,
          period_start: periodStart,
          sms_sent: smsSent,
          sms_delivered: smsDelivered,
          sms_failed: smsFailed,
          in_app_sent: inAppSent,
          in_app_read: inAppRead,
          push_sent: pushSent,
          push_delivered: pushDelivered,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "tenant_id,period_start" }
      );

      // Templates (unique tenant_id, slug)
      await admin.from("notification_templates").upsert(
        [
          {
            tenant_id: tenant.id,
            name: "Demo: Welcome",
            slug: "demo-welcome",
            channel: "in_app",
            subject: "Welcome to {{company_name}}",
            body: "Hi {{name}} — your workspace is ready. Start with onboarding, then invite your team.",
            variables: ["name", "company_name"],
            is_active: true,
          },
          {
            tenant_id: tenant.id,
            name: "Demo: Usage warning",
            slug: "demo-usage-warning",
            channel: "sms",
            subject: null,
            body: "{{name}}, heads up: {{resource}} is at {{percent}}%. Review usage in your dashboard.",
            variables: ["name", "resource", "percent"],
            is_active: true,
          },
        ],
        { onConflict: "tenant_id,slug" }
      );
    }

    return NextResponse.json({
      success: true,
      seededTenants: DEMO_TENANTS.length,
      periodStart,
    });
  } catch (error) {
    console.error("Super-admin demo seed error:", error);
    return NextResponse.json({ error: "Failed to seed demo data" }, { status: 500 });
  }
}

