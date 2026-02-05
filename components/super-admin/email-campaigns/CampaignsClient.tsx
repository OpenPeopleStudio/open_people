"use client";

import { useEffect, useMemo, useState } from "react";
import type { AiCompany, AiCompanyGroup, AiCompanyGroupSuggestion } from "@/types/ai-companies";
import type { EmailAccount, EmailCampaignDraft, EmailCampaignRecipient } from "@/types/email";
import { CompaniesPanel } from "./CompaniesPanel";
import { GroupsPanel } from "./GroupsPanel";
import { MessageBuilder } from "./MessageBuilder";
import { RecipientsReview } from "./RecipientsReview";
import { CampaignsList } from "./CampaignsList";
import { ComposeModal } from "@/components/email/ComposeModal";

type Mode = "thoughtful" | "meme" | "discount";

type DraftRecipient = EmailCampaignRecipient & { id: string };

const templates: Record<Mode, { subject: string; body: string }> = {
  thoughtful: {
    subject: "Quick hello from Open People",
    body: `Hey there,

I admire the work you're doing in AI. We're building an operator-first workspace and would love to share what we're seeing across teams like yours.

Would you be open to a quick chat or sharing any perks for early builders?`,
  },
  meme: {
    subject: "We made a meme about your API limits",
    body: `Hi team,

We made a meme about your product while debugging rate limits. Promise it's affectionate.

Mind if we share it and maybe snag a couple extra tokens while we're at it?`,
  },
  discount: {
    subject: "Any chance for a builders discount?",
    body: `Hello!

We're spinning up more experiments on your stack. Any chance for a temporary discount or trial extension while we build?

Happy to share feedback and shout you out in our release notes.`,
  },
};

export function CampaignsClient() {
  const [companies, setCompanies] = useState<AiCompany[]>([]);
  const [groups, setGroups] = useState<(AiCompanyGroup & { members?: any[]; memberCount?: number })[]>([]);
  const [campaigns, setCampaigns] = useState<(EmailCampaignDraft & { recipients?: EmailCampaignRecipient[] })[]>([]);
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);

  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [manualRecipients, setManualRecipients] = useState<DraftRecipient[]>([]);
  const [mode, setMode] = useState<Mode>("thoughtful");
  const [subject, setSubject] = useState(templates.thoughtful.subject);
  const [body, setBody] = useState(templates.thoughtful.body);
  const [audienceDescription, setAudienceDescription] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<"neutral" | "success" | "error">("neutral");
  const [savingDraft, setSavingDraft] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AiCompanyGroupSuggestion[]>([]);
  const [composeCampaign, setComposeCampaign] = useState<
    (EmailCampaignDraft & { recipients?: EmailCampaignRecipient[] }) | null
  >(null);
  const [showCompose, setShowCompose] = useState(false);

  const loadCompanies = async () => {
    const res = await fetch("/api/super-admin/email/companies");
    const data = await res.json();
    if (res.ok) setCompanies(data.companies || []);
  };

  const loadGroups = async () => {
    const res = await fetch("/api/super-admin/email/groups");
    const data = await res.json();
    if (res.ok) {
      const enriched =
        (data.groups || []).map((g: any) => ({
          ...g,
          memberCount: Array.isArray(g.members) ? g.members.length : 0,
        })) || [];
      setGroups(enriched);
    }
  };

  const loadCampaigns = async () => {
    const res = await fetch("/api/super-admin/email/campaigns");
    const data = await res.json();
    if (res.ok) setCampaigns(data.campaigns || []);
  };

  const loadAccounts = async () => {
    const res = await fetch("/api/email/accounts");
    const data = await res.json();
    if (res.ok) setAccounts(data.accounts || []);
  };

  const loadData = async () => {
    await Promise.all([loadCompanies(), loadGroups(), loadCampaigns(), loadAccounts()]);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    loadData();
  }, []);

  const createCompany = async (input: Partial<AiCompany> & { name: string }) => {
    const res = await fetch("/api/super-admin/email/companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (res.ok) {
      await loadCompanies();
    }
  };

  const createGroup = async (input: {
    name: string;
    tags?: string[];
    description?: string;
    strategy?: string;
    companyIds?: string[];
  }) => {
    const res = await fetch("/api/super-admin/email/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (res.ok) {
      await loadGroups();
    }
  };

  const suggestGroups = async (prompt: string) => {
    const res = await fetch("/api/super-admin/email/groups/suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, companies }),
    });
    const data = await res.json();
    if (res.ok) {
      setAiSuggestions(data.groups || []);
    }
  };

  const adoptSuggestion = async (suggestion: AiCompanyGroupSuggestion) => {
    // Map suggested companies to known IDs to prefill membership
    const companyIds = companies
      .filter((c) =>
        suggestion.companies?.some((s) => s.name.toLowerCase() === c.name.toLowerCase()),
      )
      .map((c) => c.id);

    await createGroup({
      name: suggestion.name,
      companyIds,
      ...(suggestion.description ? { description: suggestion.description } : {}),
      ...(suggestion.strategy ? { strategy: suggestion.strategy } : {}),
      ...(suggestion.tags ? { tags: suggestion.tags } : {}),
    });
  };

  const applyTemplate = (templateMode: Mode) => {
    setSubject(templates[templateMode].subject);
    setBody(templates[templateMode].body);
  };

  const handleSelectGroup = (groupId: string | null) => {
    setSelectedGroupId(groupId);
    if (!groupId) return;
    const group = groups.find((g) => g.id === groupId);
    const memberIds = (group?.members || []).map((m: any) => m.company_id);
    if (memberIds.length) {
      setSelectedCompanyIds(memberIds);
    }
  };

  const selectionRecipients = useMemo(() => {
    const emailMap = new Map<string, DraftRecipient>();

    const addRecipient = (rec: { email: string; name?: string; company_id?: string }) => {
      const key = rec.email.toLowerCase();
      if (emailMap.has(key)) return;
      emailMap.set(key, {
        id: `sel-${key}`,
        campaign_id: "",
        company_id: rec.company_id || null,
        to_email: rec.email,
        to_name: rec.name || null,
        status: "draft",
        created_at: new Date().toISOString(),
      });
    };

    companies
      .filter((c) => selectedCompanyIds.includes(c.id))
      .forEach((c) => {
        if (c.contact_email) {
          addRecipient({ email: c.contact_email, name: c.contact_name || c.name, company_id: c.id });
        }
      });

    return Array.from(emailMap.values());
  }, [companies, selectedCompanyIds]);

  const recipients = useMemo(() => {
    const map = new Map<string, DraftRecipient>();
    [...selectionRecipients, ...manualRecipients].forEach((r) => {
      map.set(r.to_email.toLowerCase(), r);
    });
    return Array.from(map.values());
  }, [selectionRecipients, manualRecipients]);

  const selectedGroup = groups.find((group) => group.id === selectedGroupId) || null;

  const addManualRecipient = (input: { email: string; name?: string }) => {
    setManualRecipients((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        campaign_id: "",
        company_id: null,
        to_email: input.email,
        to_name: input.name || null,
        status: "draft",
        created_at: new Date().toISOString(),
      },
    ]);
  };

  const removeRecipient = (id: string) => {
    setManualRecipients((prev) => prev.filter((r) => r.id !== id));
  };

  const saveDraft = async () => {
    if (!subject || !body) {
      setStatusMessage("Subject and body are required.");
      setStatusTone("error");
      return;
    }
    if (recipients.length === 0) {
      setStatusMessage("Select at least one recipient.");
      setStatusTone("error");
      return;
    }

    setSavingDraft(true);
    setStatusMessage(null);
    setStatusTone("neutral");

    const payload = {
      name: `Draft - ${new Date().toLocaleDateString()}`,
      subject,
      body_text: body,
      body_html: `<p>${body.replace(/\n/g, "<br>")}</p>`,
      audience_description: audienceDescription,
      generated_via_ai: mode !== "thoughtful" ? true : false,
      generation_prompt: mode,
      recipients: recipients.map((r) => ({
        company_id: r.company_id,
        to_email: r.to_email,
        to_name: r.to_name || undefined,
        status: "draft" as const,
      })),
    };

    const res = await fetch("/api/super-admin/email/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (res.ok) {
      setStatusMessage("Draft saved.");
      setStatusTone("success");
      setCampaigns((prev) => [data.campaign, ...prev]);
    } else {
      setStatusMessage(data.error || "Failed to save draft.");
      setStatusTone("error");
    }

    setSavingDraft(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Campaign builder</h2>
          <p className="text-xs text-[var(--text-muted)]">
            Build targeted outreach with curated companies and groups.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
          <span className="px-2.5 py-1 rounded-full border border-[var(--border-subtle)]">
            {selectedCompanyIds.length} companies
          </span>
          <span className="px-2.5 py-1 rounded-full border border-[var(--border-subtle)]">
            {recipients.length} recipients
          </span>
          {selectedGroup && (
            <span className="px-2.5 py-1 rounded-full border border-[var(--border-subtle)]">
              Group: {selectedGroup.name}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[320px_320px_1fr] gap-4">
        <div className="space-y-4">
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-3">
            <p className="text-xs text-[var(--text-muted)]">Step 1</p>
            <p className="text-sm font-medium text-[var(--text-primary)]">Define your audience</p>
          </div>
          <CompaniesPanel
            companies={companies}
            selectedCompanyIds={selectedCompanyIds}
            onSelectCompany={setSelectedCompanyIds}
            onCreateCompany={createCompany}
          />
          <GroupsPanel
            groups={groups}
            selectedGroupId={selectedGroupId}
            onSelectGroup={handleSelectGroup}
            onCreateGroup={createGroup}
            suggestions={aiSuggestions}
            onSuggestGroups={suggestGroups}
            onAdoptSuggestion={adoptSuggestion}
          />
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-3">
            <p className="text-xs text-[var(--text-muted)]">Step 2</p>
            <p className="text-sm font-medium text-[var(--text-primary)]">Craft the message</p>
          </div>
          <MessageBuilder
            mode={mode}
            subject={subject}
            body={body}
            onModeChange={setMode}
            onSubjectChange={setSubject}
            onBodyChange={setBody}
            onApplyTemplate={applyTemplate}
          />

          <div className="space-y-2">
            <label className="text-xs text-[var(--text-muted)]">Audience notes</label>
            <textarea
              className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm min-h-[80px]"
              value={audienceDescription}
              onChange={(e) => setAudienceDescription(e.target.value)}
              placeholder="eg. Early AI infra vendors we love; keep it playful."
            />
          </div>

          <button
            onClick={saveDraft}
            disabled={savingDraft}
            className="w-full px-4 py-2 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] text-sm font-semibold disabled:opacity-50"
          >
            {savingDraft ? "Saving..." : "Save draft (no sending)"}
          </button>
          {statusMessage && (
            <div
              className={`text-xs rounded-lg border px-3 py-2 ${
                statusTone === "success"
                  ? "border-[var(--success)]/30 text-[var(--success)] bg-[var(--success)]/10"
                  : statusTone === "error"
                    ? "border-[var(--error)]/30 text-[var(--error)] bg-[var(--error)]/10"
                    : "border-[var(--border-subtle)] text-[var(--text-muted)] bg-[var(--surface-1)]"
              }`}
            >
              {statusMessage}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-3">
            <p className="text-xs text-[var(--text-muted)]">Step 3</p>
            <p className="text-sm font-medium text-[var(--text-primary)]">Review & send</p>
          </div>
          <RecipientsReview
            recipients={recipients}
            onRemove={removeRecipient}
            onAddManual={addManualRecipient}
          />
          <CampaignsList
            campaigns={campaigns}
            {...(accounts.length > 0
              ? {
                  onOpenComposer: (campaign: EmailCampaignDraft) => {
                    setComposeCampaign(campaign);
                    setShowCompose(true);
                  },
                }
              : {})}
          />
        </div>
      </div>

      {showCompose && composeCampaign && (
        <ComposeModal
          accounts={accounts}
          selectedAccountId={accounts[0]?.id || null}
          replyTo={null}
          templates={[]}
          prefill={{
            to: composeCampaign.recipients?.map((r) => r.to_email) || [],
            accountId: accounts[0]?.id || null,
            ...(composeCampaign.subject ? { subject: composeCampaign.subject } : {}),
            ...(composeCampaign.body_text ? { body: composeCampaign.body_text } : {}),
          }}
          onClose={() => {
            setShowCompose(false);
            setComposeCampaign(null);
          }}
          onSent={() => {
            setStatusMessage("Sent via composer.");
            setStatusTone("success");
            setShowCompose(false);
            setComposeCampaign(null);
          }}
        />
      )}
    </div>
  );

}
