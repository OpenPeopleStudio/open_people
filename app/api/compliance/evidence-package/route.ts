/* ═══════════════════════════════════════════════════════════════════════════
   Evidence Package API
   Generate compliance evidence packages for SOC2, GDPR, EU AI Act, etc.
   ═══════════════════════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import {
  generateEvidencePackage,
  generateControlEvidence,
} from "@/lib/compliance/evidence-collector";
import {
  EVIDENCE_PACK_COLLECTIONS,
  type ComplianceFramework,
} from "@/lib/compliance/evidence-packs";

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/compliance/evidence-package
// List available frameworks and controls
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const framework = searchParams.get("framework") as ComplianceFramework | null;

    if (framework) {
      // Return controls for specific framework
      const collection = EVIDENCE_PACK_COLLECTIONS[framework];
      if (!collection) {
        return NextResponse.json(
          { error: `Unknown framework: ${framework}` },
          { status: 400 }
        );
      }

      return NextResponse.json({
        framework: collection.framework,
        name: collection.name,
        description: collection.description,
        controls: collection.controls.map((c) => ({
          control_id: c.control_id,
          control_name: c.control_name,
          description: c.description,
          evidence_sources: c.evidence_sources.length,
          evidence_guidance: c.evidence_guidance,
        })),
      });
    }

    // Return all available frameworks
    const frameworks = Object.values(EVIDENCE_PACK_COLLECTIONS).map((c) => ({
      framework: c.framework,
      name: c.name,
      description: c.description,
      controls_count: c.controls.length,
    }));

    return NextResponse.json({ frameworks });
  } catch (error) {
    console.error("Error fetching evidence packs:", error);
    return NextResponse.json(
      { error: "Failed to fetch evidence packs" },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/compliance/evidence-package
// Generate evidence package for a framework
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's tenant
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id, role")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    // Check if user has admin access
    if (!["admin", "owner", "super_admin"].includes(profile.role)) {
      return NextResponse.json(
        { error: "Admin access required for evidence generation" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      framework,
      control_id,
      control_ids,
      date_range,
    }: {
      framework: ComplianceFramework;
      control_id?: string;
      control_ids?: string[];
      date_range?: { start: string; end: string };
    } = body;

    if (!framework) {
      return NextResponse.json(
        { error: "framework is required" },
        { status: 400 }
      );
    }

    // Validate framework
    if (!EVIDENCE_PACK_COLLECTIONS[framework]) {
      return NextResponse.json(
        { error: `Unknown framework: ${framework}` },
        { status: 400 }
      );
    }

    // Single control evidence
    if (control_id) {
      const evidence = await generateControlEvidence(
        profile.tenant_id,
        framework,
        control_id,
        date_range
      );

      if (!evidence) {
        return NextResponse.json(
          { error: `Control ${control_id} not found in ${framework}` },
          { status: 404 }
        );
      }

      return NextResponse.json(evidence);
    }

    // Full framework or multiple controls
    const evidencePackage = await generateEvidencePackage(
      profile.tenant_id,
      framework,
      date_range,
      control_ids
    );

    // Log the evidence generation
    await supabase.from("activity_ledger").insert({
      tenant_id: profile.tenant_id,
      actor_id: user.id,
      actor_type: "user",
      action: "evidence_package_generated",
      action_category: "compliance",
      resource_type: "compliance_evidence",
      resource_name: `${framework} Evidence Package`,
      context: {
        framework,
        control_count: evidencePackage.summary.total_controls,
        record_count: evidencePackage.summary.total_records,
        date_range: evidencePackage.date_range,
      },
      success: true,
    });

    return NextResponse.json(evidencePackage);
  } catch (error) {
    console.error("Error generating evidence package:", error);
    return NextResponse.json(
      { error: "Failed to generate evidence package" },
      { status: 500 }
    );
  }
}
