import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { PUT } from "@/app/api/v1/tenants/[tenant_id]/route";
import { UserRole } from "@/lib/auth/authorization";

vi.mock("@/lib/auth/auth", () => ({
  authenticateUser: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseAdmin: vi.fn(),
}));

import { authenticateUser } from "@/lib/auth/auth";

const superAdminAuth = {
  user: {
    id: "user-1",
    profile: { role: UserRole.SUPER_ADMIN, tenant_id: "tenant-1" },
  },
};

describe("v1 tenants routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 for invalid JSON on PUT", async () => {
    (authenticateUser as any).mockResolvedValue(superAdminAuth);

    const request = new NextRequest("http://localhost/api/v1/tenants/tenant-1", {
      method: "PUT",
      body: "{",
      headers: { "content-type": "application/json" },
    });

    const response = await PUT(request, {
      params: Promise.resolve({ tenant_id: "tenant-1" }),
    });

    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.error?.code).toBe("INVALID_JSON");
  });

  it("returns 422 for empty body on PUT", async () => {
    (authenticateUser as any).mockResolvedValue(superAdminAuth);

    const request = new NextRequest("http://localhost/api/v1/tenants/tenant-1", {
      method: "PUT",
      body: JSON.stringify({}),
      headers: { "content-type": "application/json" },
    });

    const response = await PUT(request, {
      params: Promise.resolve({ tenant_id: "tenant-1" }),
    });

    expect(response.status).toBe(422);
    const payload = await response.json();
    expect(payload.error?.code).toBe("UNPROCESSABLE_ENTITY");
  });

  it("returns 401 when unauthenticated", async () => {
    (authenticateUser as any).mockResolvedValue(null);

    const request = new NextRequest("http://localhost/api/v1/tenants/tenant-1", {
      method: "PUT",
      body: JSON.stringify({ name: "Acme" }),
      headers: { "content-type": "application/json" },
    });

    const response = await PUT(request, {
      params: Promise.resolve({ tenant_id: "tenant-1" }),
    });

    expect(response.status).toBe(401);
  });
});
