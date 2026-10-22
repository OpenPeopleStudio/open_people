import { createSupabaseAdmin } from "@/lib/supabase/server";

export type AskFollowUpStatus = "open" | "answered" | "all";

export type AskFollowUpRow = {
  id: string;
  name: string | null;
  email: string;
  question: string;
  covered: boolean;
  created_at: string;
  answered_at: string | null;
  status: "open" | "answered";
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function parseFollowupsStatus(value: string | null): AskFollowUpStatus {
  if (value === "answered" || value === "all") return value;
  return "open";
}

export function parseMarkAnswered(body: unknown): { ok: true; ids: string[] } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Send { id } or { ids }." };
  }
  const record = body as Record<string, unknown>;
  const ids: string[] = [];
  if (typeof record.id === "string") ids.push(record.id.trim());
  if (Array.isArray(record.ids)) {
    for (const item of record.ids) {
      if (typeof item === "string") ids.push(item.trim());
    }
  }
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) {
    return { ok: false, error: "Send { id } or { ids } of follow-ups to mark answered." };
  }
  if (unique.some((id) => !UUID_RE.test(id))) {
    return { ok: false, error: "Each id must be a UUID." };
  }
  return { ok: true, ids: unique };
}

function withStatus(row: {
  id: string;
  name: string | null;
  email: string;
  question: string;
  covered: boolean;
  created_at: string;
  answered_at: string | null;
}): AskFollowUpRow {
  return {
    ...row,
    status: row.answered_at ? "answered" : "open",
  };
}

export async function insertAskFollowUp(input: {
  name: string;
  email: string;
  question: string;
}): Promise<{ id: string }> {
  const db = createSupabaseAdmin();
  const { data, error } = await db
    .from("ask_followups")
    .insert({
      name: input.name || null,
      email: input.email,
      question: input.question,
      covered: false,
    })
    .select("id")
    .single();
  if (error || !data?.id) {
    throw new Error(error?.message || "Could not store follow-up.");
  }
  return { id: data.id as string };
}

export async function listAskFollowUps(status: AskFollowUpStatus): Promise<AskFollowUpRow[]> {
  const db = createSupabaseAdmin();
  let query = db
    .from("ask_followups")
    .select("id, name, email, question, covered, created_at, answered_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (status === "open") query = query.is("answered_at", null);
  if (status === "answered") query = query.not("answered_at", "is", null);
  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []).map(withStatus);
}

export async function markAskFollowUpsAnswered(ids: string[]): Promise<AskFollowUpRow[]> {
  const db = createSupabaseAdmin();
  const { data, error } = await db
    .from("ask_followups")
    .update({ answered_at: new Date().toISOString() })
    .in("id", ids)
    .is("answered_at", null)
    .select("id, name, email, question, covered, created_at, answered_at");
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []).map(withStatus);
}
