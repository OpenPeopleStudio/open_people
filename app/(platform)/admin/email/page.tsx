import { createSupabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { EMAIL_PLANS, formatEmailCount } from "@/types/email";
import { EmailDashboard } from "./EmailDashboard";

/* ═══════════════════════════════════════════════════════════════════════════
   Tenant Email Dashboard
   Manage email sending, templates, and domains
   ═══════════════════════════════════════════════════════════════════════════ */

async function getEmailData(tenantId: string) {
  const supabase = await createSupabaseServer();

  // Get subscription
  const { data: subscription } = await supabase
    .from("email_subscriptions")
    .select("tier, status, current_period_end")
    .eq("tenant_id", tenantId)
    .single();

  // Get usage stats using RPC
  const { data: statsData } = await supabase.rpc("get_tenant_email_stats", {
    p_tenant_id: tenantId,
  });

  const stats = statsData?.[0] || {
    total_sent: 0,
    total_delivered: 0,
    total_opened: 0,
    total_clicked: 0,
    total_bounced: 0,
    delivery_rate: 0,
    open_rate: 0,
  };

  // Get current month usage for limit check
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data: usageData } = await supabase
    .from("email_usage")
    .select("emails_sent")
    .eq("tenant_id", tenantId)
    .eq("period_start", startOfMonth.toISOString().split("T")[0])
    .single();

  // Get templates
  const { data: templates } = await supabase
    .from("email_templates")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  // Get domains
  const { data: domains } = await supabase
    .from("email_domains")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  // Get recent logs
  const { data: recentLogs } = await supabase
    .from("email_logs")
    .select("*, template:email_templates(name)")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(10);

  return {
    subscription: subscription || { tier: "free", status: "active", current_period_end: null },
    stats: {
      total_sent: stats.total_sent || 0,
      total_delivered: stats.total_delivered || 0,
      total_opened: stats.total_opened || 0,
      total_clicked: stats.total_clicked || 0,
      total_bounced: stats.total_bounced || 0,
      delivery_rate: stats.delivery_rate || 0,
      open_rate: stats.open_rate || 0,
    },
    currentUsage: usageData?.emails_sent || 0,
    templates: templates || [],
    domains: domains || [],
    recentLogs: (recentLogs || []).map((log) => ({
      ...log,
      template: Array.isArray(log.template) ? log.template[0] : log.template,
    })),
  };
}

export default async function EmailPage() {
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

  // Get tenant slug for sender address
  const { data: tenant } = await supabase
    .from("tenants")
    .select("slug")
    .eq("id", profile.tenant_id)
    .single();

  const data = await getEmailData(profile.tenant_id);
  const plan = EMAIL_PLANS[data.subscription.tier as keyof typeof EMAIL_PLANS] || EMAIL_PLANS.free;

  const usagePercent = Math.min(
    (data.currentUsage / plan.emailsPerMonth) * 100,
    100
  );

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Email
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Send transactional emails and manage templates
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              data.subscription.status === "active"
                ? "bg-[var(--success)]/10 text-[var(--success)]"
                : "bg-[var(--warning)]/10 text-[var(--warning)]"
            }`}
          >
            {plan.name} Plan
          </span>
          <a href="/admin/email/upgrade" className="btn-primary text-sm">
            Upgrade Plan
          </a>
        </div>
      </div>

      {/* Usage & Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <UsageCard
          label="Emails Sent"
          current={data.currentUsage}
          limit={plan.emailsPerMonth}
          percent={usagePercent}
        />
        <StatCard
          label="Delivery Rate"
          value={`${data.stats.delivery_rate}%`}
          subtext={`${data.stats.total_delivered} delivered`}
          color={data.stats.delivery_rate >= 95 ? "var(--success)" : "var(--warning)"}
        />
        <StatCard
          label="Open Rate"
          value={`${data.stats.open_rate}%`}
          subtext={`${data.stats.total_opened} opened`}
          color="var(--electric-cyan)"
        />
        <StatCard
          label="Bounced"
          value={data.stats.total_bounced.toString()}
          subtext="This month"
          color={data.stats.total_bounced > 0 ? "var(--error)" : "var(--text-muted)"}
        />
      </div>

      {/* Main Dashboard (Client Component) */}
      <EmailDashboard
        templates={data.templates}
        domains={data.domains}
        recentLogs={data.recentLogs}
        plan={plan}
        tenantSlug={tenant?.slug || ""}
      />
    </div>
  );
}

function UsageCard({
  label,
  current,
  limit,
  percent,
}: {
  label: string;
  current: number;
  limit: number;
  percent: number;
}) {
  return (
    <div className="p-5 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
      <p className="text-sm text-[var(--text-muted)]">{label}</p>
      <p className="text-2xl font-semibold text-[var(--text-primary)] mt-2">
        {formatEmailCount(current)}
      </p>
      <p className="text-xs text-[var(--text-secondary)] mt-1">
        of {formatEmailCount(limit)} this month
      </p>
      <div className="mt-3 h-2 bg-[var(--surface-3)] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            percent > 90
              ? "bg-[var(--error)]"
              : percent > 70
              ? "bg-[var(--warning)]"
              : "bg-[var(--electric-lime)]"
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  subtext,
  color,
}: {
  label: string;
  value: string;
  subtext: string;
  color: string;
}) {
  return (
    <div className="p-5 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
      <p className="text-sm text-[var(--text-muted)]">{label}</p>
      <p className="text-2xl font-semibold mt-2" style={{ color }}>
        {value}
      </p>
      <p className="text-xs text-[var(--text-secondary)] mt-2">{subtext}</p>
    </div>
  );
}
