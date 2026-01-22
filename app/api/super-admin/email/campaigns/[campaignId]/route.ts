import { NextRequest, NextResponse } from "next/server";
import { withAuthAndAuthZ, UserRole } from "@/lib/auth/middleware";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import type { CreateCampaignDraftInput, EmailCampaignRecipient } from "@/types/email";
import { mapCampaignRow } from "@/lib/email/campaigns";

const requireSuperAdmin = withAuthAndAuthZ({ role: UserRole.SUPER_ADMIN });

export const GET = requireSuperAdmin(async (_auth, request: NextRequest) => {
  const supabase = await createSupabaseAdmin();
  const campaignId = request.nextUrl.pathname.split("/").pop();

  if (!campaignId) {
    return NextResponse.json({ error: "Campaign ID is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("email_campaigns")
    .select("*, recipients:email_campaign_recipients(*)")
    .eq("id", campaignId)
    .maybeSingle();

  if (error) {
    console.error("[super-admin/email/campaigns/:id] fetch error:", error);
    return NextResponse.json({ error: "Failed to load campaign" }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ campaign: mapCampaignRow(data) });
});

export const PUT = requireSuperAdmin(async (_auth, request: NextRequest) => {
  const supabase = await createSupabaseAdmin();
  const campaignId = request.nextUrl.pathname.split("/").pop();

  if (!campaignId) {
    return NextResponse.json({ error: "Campaign ID is required" }, { status: 400 });
  }

  const payload = (await request.json()) as Partial<CreateCampaignDraftInput>;
  const { recipients } = payload;

  const { data: campaign, error } = await supabase
    .from("email_campaigns")
    .update({
      name: payload.name,
      subject: payload.subject,
      body_text: payload.body_text,
      body_html: payload.body_html,
      audience_description: payload.audience_description,
      generated_via_ai: payload.generated_via_ai,
      generation_prompt: payload.generation_prompt,
      sender_account_id: payload.sender_account_id,
      status: "draft", // lock to draft
      updated_at: new Date().toISOString(),
    })
    .eq("id", campaignId)
    .select("*")
    .single();

  if (error || !campaign) {
    console.error("[super-admin/email/campaigns/:id] update error:", error);
    return NextResponse.json({ error: "Failed to update campaign" }, { status: 500 });
  }

  let updatedRecipients: EmailCampaignRecipient[] | undefined = undefined;

  if (Array.isArray(recipients)) {
    // Replace recipients
    const { error: deleteErr } = await supabase
      .from("email_campaign_recipients")
      .delete()
      .eq("campaign_id", campaignId);

    if (deleteErr) {
      console.error("[super-admin/email/campaigns/:id] clear recipients error:", deleteErr);
      return NextResponse.json({ error: "Campaign updated but recipient reset failed" }, { status: 500 });
    }

    if (recipients.length > 0) {
      const { data: inserted, error: insertErr } = await supabase
        .from("email_campaign_recipients")
        .insert(
          recipients.map((r) => ({
            campaign_id: campaignId,
            company_id: r.company_id || null,
            to_email: r.to_email,
            to_name: r.to_name || null,
            status: r.status || "draft",
            reason: r.reason || null,
          })),
        )
        .select("*");

      if (insertErr) {
        console.error("[super-admin/email/campaigns/:id] recipient insert error:", insertErr);
        return NextResponse.json({ error: "Campaign updated but recipient insert failed" }, { status: 500 });
      }

      updatedRecipients = inserted || [];

      // Keep total_recipients in sync
      await supabase
        .from("email_campaigns")
        .update({ total_recipients: updatedRecipients.length })
        .eq("id", campaignId);
    } else {
      updatedRecipients = [];
      await supabase.from("email_campaigns").update({ total_recipients: 0 }).eq("id", campaignId);
    }
  }

  return NextResponse.json({
    campaign: mapCampaignRow({
      ...campaign,
      recipients: updatedRecipients,
    }),
  });
});

export const DELETE = requireSuperAdmin(async (_auth, request: NextRequest) => {
  const supabase = await createSupabaseAdmin();
  const campaignId = request.nextUrl.pathname.split("/").pop();

  if (!campaignId) {
    return NextResponse.json({ error: "Campaign ID is required" }, { status: 400 });
  }

  const { error } = await supabase.from("email_campaigns").delete().eq("id", campaignId);

  if (error) {
    console.error("[super-admin/email/campaigns/:id] delete error:", error);
    return NextResponse.json({ error: "Failed to delete campaign" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
});
