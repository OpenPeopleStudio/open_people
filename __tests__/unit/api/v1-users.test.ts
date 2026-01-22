import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/v1/users/route";
import { UserRole } from "@/lib/auth/authorization";

vi.mock("@/lib/auth/auth", () => ({
  authenticateUser: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseAdmin: vi.fn(),
  createSupabaseServer: vi.fn().mockResolvedValue({
    from: () => ({
      select: () => ({}),
    }),
  }),
}));

import { authenticateUser } from "@/lib/auth/auth";

const memberAuth = {
  user: {
    id: "user-1",
    profile: { role: UserRole.MEMBER, tenant_id: null },
  },
};

const adminAuth = {
  user: {
    id: "user-2",
    profile: { role: UserRole.ADMIN, tenant_id: "tenant-1" },
  },
};

describe("v1 users routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when tenant context missing for non-super admin GET", async () => {
    (authenticateUser as any).mockResolvedValue(memberAuth);

    const request = new NextRequest("http://localhost/api/v1/users", {
      method: "GET",
    });

    const response = await GET(request);

    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.error?.code).toBe("BAD_REQUEST");
  });

  it("returns 400 for invalid JSON on POST", async () => {
    (authenticateUser as any).mockResolvedValue(adminAuth);

    const request = new NextRequest("http://localhost/api/v1/users", {
      method: "POST",
      body: "{",
      headers: { "content-type": "application/json" },
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.error?.code).toBe("INVALID_JSON");
  });

  it("returns 422 for missing required fields on POST", async () => {
    (authenticateUser as any).mockResolvedValue(adminAuth);

    const request = new NextRequest("http://localhost/api/v1/users", {
      method: "POST",
      body: JSON.stringify({ role: "member" }),
      headers: { "content-type": "application/json" },
    });

    const response = await POST(request);

    expect(response.status).toBe(422);
    const payload = await response.json();
    expect(payload.error?.code).toBe("UNPROCESSABLE_ENTITY");
  });
});
