import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";

/* ═══════════════════════════════════════════════════════════════════════════
   Self-Service Signup API
   
   Creates:
   1. Supabase auth user
   2. Tenant record
   3. Tenant billing record
   4. User profile linked to tenant
   
   All in a single transaction-like flow with rollback on failure.
   ═══════════════════════════════════════════════════════════════════════════ */

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "openpeople.ai";

// Validation
const SLUG_REGEX = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;
const RESERVED_SLUGS = new Set([
  "www",
  "app",
  "api",
  "admin",
  "super",
  "super-admin",
  "mail",
  "email",
  "ftp",
  "ssh",
  "support",
  "help",
  "docs",
  "blog",
  "status",
  "cdn",
  "static",
  "assets",
  "images",
  "img",
  "js",
  "css",
  "fonts",
  "media",
]);

type SignupRequest = {
  plan: "starter" | "pro";
  businessName: string;
  slug: string;
  email: string;
  password: string;
  fullName: string;
};

function validateRequest(body: SignupRequest): string | null {
  if (!body.plan || !["starter", "pro"].includes(body.plan)) {
    return "Invalid plan selected";
  }

  if (!body.businessName || body.businessName.trim().length < 2) {
    return "Business name must be at least 2 characters";
  }

  if (!body.slug || body.slug.length < 2) {
    return "Store URL must be at least 2 characters";
  }

  if (body.slug.length > 63) {
    return "Store URL must be 63 characters or less";
  }

  if (!SLUG_REGEX.test(body.slug)) {
    return "Store URL can only contain lowercase letters, numbers, and hyphens";
  }

  if (RESERVED_SLUGS.has(body.slug)) {
    return "This store URL is reserved. Please choose another.";
  }

  if (!body.email || !body.email.includes("@")) {
    return "Please enter a valid email address";
  }

  if (!body.password || body.password.length < 8) {
    return "Password must be at least 8 characters";
  }

  if (!body.fullName || body.fullName.trim().length < 2) {
    return "Please enter your full name";
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body: SignupRequest = await request.json();

    // Validate input
    const validationError = validateRequest(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const supabase = await createSupabaseAdmin();

    // Check if slug is already taken
    const { data: existingTenant } = await supabase
      .from("tenants")
      .select("id")
      .eq("slug", body.slug)
      .single();

    if (existingTenant) {
      return NextResponse.json(
        { error: "This store URL is already taken. Please choose another." },
        { status: 400 }
      );
    }

    // Check if email is already registered
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const emailExists = existingUsers?.users?.some(
      (u) => u.email?.toLowerCase() === body.email.toLowerCase()
    );

    if (emailExists) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please sign in." },
        { status: 400 }
      );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Create resources (with manual rollback on failure)
    // ─────────────────────────────────────────────────────────────────────────

    let createdUserId: string | null = null;
    let createdTenantId: string | null = null;

    try {
      // 1. Create auth user
      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email: body.email,
          password: body.password,
          email_confirm: true, // Auto-confirm for self-signup
          user_metadata: {
            full_name: body.fullName,
          },
        });

      if (authError || !authData.user) {
        throw new Error(authError?.message || "Failed to create user account");
      }

      createdUserId = authData.user.id;

      // 2. Create tenant
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 14); // 14-day trial

      const { data: tenant, error: tenantError } = await supabase
        .from("tenants")
        .insert({
          name: body.businessName.trim(),
          slug: body.slug,
          status: "active",
          settings: {
            theme: {
              brand_name: body.businessName.trim(),
            },
            features: {
              admin: true,
              // Enable AI features based on plan
              ai_inventory: true,
              ai_chat: body.plan === "pro",
              ai_analytics: body.plan === "pro",
            },
            integrations: {
              payments: { provider: "stripe" },
              ai: { provider: "openai" },
            },
            commerce: {
              currency: "USD",
            },
          },
        })
        .select("id")
        .single();

      if (tenantError || !tenant) {
        throw new Error(tenantError?.message || "Failed to create store");
      }

      createdTenantId = tenant.id;

      // 3. Create tenant billing record
      const { error: billingError } = await supabase
        .from("tenant_billing")
        .insert({
          tenant_id: tenant.id,
          plan: body.plan,
          status: "trialing",
          billing_email: body.email,
          trial_ends_at: trialEndsAt.toISOString(),
        });

      if (billingError) {
        throw new Error(billingError.message || "Failed to set up billing");
      }

      // 4. Create user profile linked to tenant
      // Uses profiles table from the existing schema
      const { error: profileError } = await supabase.from("profiles").insert({
        id: authData.user.id,
        tenant_id: tenant.id,
        full_name: body.fullName.trim(),
        role: "owner", // First user is owner
      });

      if (profileError) {
        // Profile might be auto-created by trigger - check if it exists
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", authData.user.id)
          .single();
        
        if (!existingProfile) {
          console.warn("Profile creation failed:", profileError.message);
        } else {
          // Update existing profile with tenant_id and role
          await supabase
            .from("profiles")
            .update({ tenant_id: tenant.id, role: "owner" })
            .eq("id", authData.user.id);
        }
      }

      // ─────────────────────────────────────────────────────────────────────────
      // Success! Return redirect URL
      // Redirect to pending page which will poll for domain readiness
      // ─────────────────────────────────────────────────────────────────────────

      const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
      const marketingDomain =
        ROOT_DOMAIN === "localhost"
          ? "localhost:3000"
          : ROOT_DOMAIN;

      // Redirect to the pending page with slug and business name
      const pendingUrl = new URL(`${protocol}://${marketingDomain}/onboarding/pending`);
      pendingUrl.searchParams.set("slug", body.slug);
      pendingUrl.searchParams.set("name", body.businessName.trim());

      return NextResponse.json({
        success: true,
        tenant: {
          id: tenant.id,
          slug: body.slug,
          name: body.businessName,
        },
        redirectUrl: pendingUrl.toString(),
      });
    } catch (innerError) {
      // ─────────────────────────────────────────────────────────────────────────
      // Rollback: Clean up any created resources
      // ─────────────────────────────────────────────────────────────────────────

      console.error("Signup failed, rolling back:", innerError);

      if (createdTenantId) {
        // Delete tenant (cascades to billing)
        await supabase.from("tenants").delete().eq("id", createdTenantId);
      }

      if (createdUserId) {
        // Delete auth user
        await supabase.auth.admin.deleteUser(createdUserId);
      }

      throw innerError;
    }
  } catch (error) {
    console.error("Signup error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to create account";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
