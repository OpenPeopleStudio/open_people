import { createSupabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { NOTIFICATION_PLANS, formatNotificationCount } from "@/types/notifications";
import { NotificationsDashboard } from "./NotificationsDashboard";

/* ═══════════════════════════════════════════════════════════════════════════
   Tenant Notifications Dashboard
   Manage SMS, in-app, and push notifications
   ═══════════════════════════════════════════════════════════════════════════ */

async function getNotificationsData(tenantId: string) {
  const supabase = await createSupabaseServer();

  // Get subscription
  const { data: subscription } = await supabase
    .from("notification_subscriptions")
    .select("*")
    .eq("tenant_id", tenantId)
    .single();

  // Get stats
  const { data: statsData } = await supabase.rpc("get_notification_stats", {
    p_tenant_id: tenantId,
  });

  const stats = statsData?.[0] || {
    sms_sent: 0,
    sms_delivered: 0,
    sms_failed: 0,
    sms_delivery_rate: 0,
    in_app_sent: 0,
    in_app_read: 0,
    in_app_read_rate: 0,
    push_sent: 0,
    push_delivered: 0,
  };

  // Get templates
  const { data: templates } = await supabase
    .from("notification_templates")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  // Get recent deliveries
  const { data: recentDeliveries } = await supabase
    .from("notification_deliveries")
    .select("*, template:notification_templates(name)")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(10);

  return {
    subscription: subscription || {
      tier: "free",
      status: "active",
      twilio_from_number: null,
    },
    stats: {
      sms_sent: stats.sms_sent || 0,
      sms_delivered: stats.sms_delivered || 0,
      sms_failed: stats.sms_failed || 0,
      sms_delivery_rate: stats.sms_delivery_rate || 0,
      in_app_sent: stats.in_app_sent || 0,
      in_app_read: stats.in_app_read || 0,
      in_app_read_rate: stats.in_app_read_rate || 0,
      push_sent: stats.push_sent || 0,
      push_delivered: stats.push_delivered || 0,
    },
    templates: templates || [],
    recentDeliveries: (recentDeliveries || []).map((d) => ({
      ...d,
      template: Array.isArray(d.template) ? d.template[0] : d.template,
    })),
  };
}

export default async function NotificationsPage() {
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

  const data = await getNotificationsData(profile.tenant_id);
  const plan =
    NOTIFICATION_PLANS[data.subscription.tier as keyof typeof NOTIFICATION_PLANS] ||
    NOTIFICATION_PLANS.free;

  const smsUsagePercent =
    plan.smsPerMonth === -1
      ? 0
      : Math.min((data.stats.sms_sent / plan.smsPerMonth) * 100, 100);

  const inAppUsagePercent =
    plan.inAppPerMonth === -1
      ? 0
      : Math.min((data.stats.in_app_sent / plan.inAppPerMonth) * 100, 100);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Notifications
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Send SMS, in-app, and push notifications
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
          <a href="/admin/notifications/upgrade" className="btn-primary text-sm">
            Upgrade Plan
          </a>
        </div>
      </div>

      {/* Usage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <UsageCard
          label="SMS Sent"
          current={data.stats.sms_sent}
          limit={plan.smsPerMonth}
          percent={smsUsagePercent}
          subtext={`${data.stats.sms_delivery_rate}% delivered`}
        />
        <UsageCard
          label="In-App Sent"
          current={data.stats.in_app_sent}
          limit={plan.inAppPerMonth}
          percent={inAppUsagePercent}
          subtext={`${data.stats.in_app_read_rate}% read`}
        />
        <StatCard
          label="SMS Delivery Rate"
          value={`${data.stats.sms_delivery_rate}%`}
          subtext={`${data.stats.sms_delivered} delivered`}
          color={data.stats.sms_delivery_rate >= 95 ? "var(--success)" : "var(--warning)"}
        />
        <StatCard
          label="In-App Read Rate"
          value={`${data.stats.in_app_read_rate}%`}
          subtext={`${data.stats.in_app_read} read`}
          color="var(--electric-cyan)"
        />
      </div>

      {/* Main Dashboard */}
      <NotificationsDashboard
        templates={data.templates}
        recentDeliveries={data.recentDeliveries}
        fromNumber={data.subscription.twilio_from_number}
      />
    </div>
  );
}

function UsageCard({
  label,
  current,
  limit,
  percent,
  subtext,
}: {
  label: string;
  current: number;
  limit: number;
  percent: number;
  subtext: string;
}) {
  return (
    <div className="p-5 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
      <p className="text-sm text-[var(--text-muted)]">{label}</p>
      <p className="text-2xl font-semibold text-[var(--text-primary)] mt-2">
        {formatNotificationCount(current)}
      </p>
      <p className="text-xs text-[var(--text-secondary)] mt-1">
        of {limit === -1 ? "∞" : formatNotificationCount(limit)} this month
      </p>
      {limit !== -1 && (
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
      )}
      <p className="text-xs text-[var(--text-muted)] mt-2">{subtext}</p>
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
