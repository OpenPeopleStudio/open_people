import { NextRequest, NextResponse } from "next/server";
import { withAuthAndAuthZ, UserRole } from "@/lib/auth/middleware";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import type {
  EmailCampaignDraft,
  EmailCampaignRecipient,
  CreateCampaignDraftInput,
} from "@/types/email";
import { mapCampaignRow } from "@/lib/email/campaigns";

const requireSuperAdmin = withAuthAndAuthZ({ role: UserRole.SUPER_ADMIN });

export const GET = requireSuperAdmin(async (_auth, request: NextRequest) => {
  const supabase = await createSupabaseAdmin();
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit") || 50);

  const { data, error } = await supabase
    .from("email_campaigns")
    .select("*, recipients:email_campaign_recipients(*)")
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 200));

  if (error) {
    console.error("[super-admin/email/campaigns] list error:", error);
    return NextResponse.json({ error: "Failed to load campaigns" }, { status: 500 });
  }

  return NextResponse.json({
    campaigns: (data || []).map(mapCampaignRow),
  });
});

export const POST = requireSuperAdmin(async (_auth, request: NextRequest) => {
  const supabase = await createSupabaseAdmin();
  const payload = (await request.json()) as CreateCampaignDraftInput;

  if (!payload?.name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const recipients = Array.isArray(payload?.recipients) ? payload.recipients : [];

  if (recipients.length === 0) {
    return NextResponse.json({ error: "At least one recipient is required" }, { status: 400 });
  }

  const { data: campaign, error: createError } = await supabase
    .from("email_campaigns")
    .insert({
      name: payload.name,
      subject: payload.subject || null,
      body_text: payload.body_text || null,
      body_html: payload.body_html || null,
      audience_description: payload.audience_description || null,
      generated_via_ai: payload.generated_via_ai ?? false,
      generation_prompt: payload.generation_prompt || null,
      sender_account_id: payload.sender_account_id || null,
      status: "draft",
      total_recipients: recipients.length,
    })
    .select("*")
    .single();

  if (createError || !campaign) {
    console.error("[super-admin/email/campaigns] create error:", createError);
    return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 });
  }

  const recipientRows = recipients.map((r) => ({
    campaign_id: campaign.id,
    company_id: r.company_id || null,
    to_email: r.to_email,
    to_name: r.to_name || null,
    status: r.status || "draft",
    reason: r.reason || null,
  }));

  const { data: insertedRecipients, error: recipientError } = await supabase
    .from("email_campaign_recipients")
    .insert(recipientRows)
    .select("*");

  if (recipientError) {
    console.error("[super-admin/email/campaigns] recipient insert error:", recipientError);
    return NextResponse.json({ error: "Campaign created but recipients failed" }, { status: 500 });
  }

  return NextResponse.json(
    {
      campaign: mapCampaignRow({ ...campaign, recipients: insertedRecipients }),
    },
    { status: 201 },
  );
});

import { NextRequest, NextResponse } from "next/server";
import { withAuthAndAuthZ, UserRole } from "@/lib/auth/middleware";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import type {
  EmailCampaignDraft,
  EmailCampaignRecipient,
  CreateCampaignDraftInput,
} from "@/types/email";
import { mapCampaignRow } from "@/lib/email/campaigns";

const requireSuperAdmin = withAuthAndAuthZ({ role: UserRole.SUPER_ADMIN });

export const GET = requireSuperAdmin(async (_auth, request: NextRequest) => {
  const supabase = await createSupabaseAdmin();
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit") || 50);

  const { data, error } = await supabase
    .from("email_campaigns")
    .select("*, recipients:email_campaign_recipients(*)")
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 200));

  if (error) {
    console.error("[super-admin/email/campaigns] list error:", error);
    return NextResponse.json({ error: "Failed to load campaigns" }, { status: 500 });
  }

  return NextResponse.json({
    campaigns: (data || []).map(mapCampaignRow),
  });
});

export const POST = requireSuperAdmin(async (_auth, request: NextRequest) => {
  const supabase = await createSupabaseAdmin();
  const payload = (await request.json()) as CreateCampaignDraftInput;

  if (!payload?.name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const recipients = Array.isArray(payload?.recipients) ? payload.recipients : [];

  if (recipients.length === 0) {
    return NextResponse.json({ error: "At least one recipient is required" }, { status: 400 });
  }

  const { data: campaign, error: createError } = await supabase
    .from("email_campaigns")
    .insert({
      name: payload.name,
      subject: payload.subject || null,
      body_text: payload.body_text || null,
      body_html: payload.body_html || null,
      audience_description: payload.audience_description || null,
      generated_via_ai: payload.generated_via_ai ?? false,
      generation_prompt: payload.generation_prompt || null,
      sender_account_id: payload.sender_account_id || null,
      status: "draft",
      total_recipients: recipients.length,
    })
    .select("*")
    .single();

  if (createError || !campaign) {
    console.error("[super-admin/email/campaigns] create error:", createError);
    return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 });
  }

  const recipientRows = recipients.map((r) => ({
    campaign_id: campaign.id,
    company_id: r.company_id || null,
    to_email: r.to_email,
    to_name: r.to_name || null,
    status: r.status || "draft",
    reason: r.reason || null,
  }));

  const { data: insertedRecipients, error: recipientError } = await supabase
    .from("email_campaign_recipients")
    .insert(recipientRows)
    .select("*");

  if (recipientError) {
    console.error("[super-admin/email/campaigns] recipient insert error:", recipientError);
    return NextResponse.json({ error: "Campaign created but recipients failed" }, { status: 500 });
  }

  return NextResponse.json(
    {
      campaign: mapCampaignRow({ ...campaign, recipients: insertedRecipients }),
    },
    { status: 201 },
  );
});

