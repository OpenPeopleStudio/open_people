import { NextRequest, NextResponse } from "next/server";
import { withAuthAndAuthZ, UserRole } from "@/lib/auth/middleware";
import { getOpenAIClient } from "@/lib/ai/providers";
import type { AiCompanyGroupSuggestionResponse } from "@/types/ai-companies";

const requireSuperAdmin = withAuthAndAuthZ({ role: UserRole.SUPER_ADMIN });

const SYSTEM_PROMPT = `You are an ops lead organizing AI companies into small, useful outreach groups.
Return concise JSON with 3-6 groups. Keep names short and friendly.`;

export const POST = requireSuperAdmin(async (_auth, request: NextRequest) => {
  const body = (await request.json()) || {};
  const { prompt, companies = [], count = 4 } = body;

  if (!prompt && companies.length === 0) {
    return NextResponse.json({ error: "Provide a prompt or companies to cluster" }, { status: 400 });
  }

  try {
    const client = getOpenAIClient();
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_SUGGEST_MODEL || "gpt-4o-mini",
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            `Goal: draft thoughtful/meme/discount outreach to favorite AI companies.`,
            `Target group count: ${count}`,
            prompt ? `Prompt: ${prompt}` : "",
            companies.length
              ? `Companies: ${companies
                  .map((c: any) => `${c.name}${c.description ? ` - ${c.description}` : ""}`)
                  .join("; ")}`
              : "",
            `Return JSON: { "groups": [ { "name": "", "description": "", "tags": [], "strategy": "", "companies": [ { "name": "", "why": "" } ] } ] }`,
          ]
            .filter(Boolean)
            .join("\n"),
        },
      ],
    });

    const content = completion.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(content) as AiCompanyGroupSuggestionResponse;

    return NextResponse.json({
      groups: parsed?.groups || [],
      model: completion.model,
    });
  } catch (error) {
    console.error("[super-admin/email/groups/suggest] AI suggestion error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate suggestions",
        groups: [],
      },
      { status: 500 },
    );
  }
});
