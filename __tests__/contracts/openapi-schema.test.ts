import { describe, it, expect } from "vitest";
import spec from "../../docs/api/openapi.json";

describe("OpenAPI spec", () => {
  it("has basic metadata", () => {
    expect(spec.openapi).toMatch(/^3\./);
    expect(spec.info?.title).toBe("OpenPeople API");
  });

  it("documents gateway and vault endpoints", () => {
    expect(spec.paths?.["/api/v1/chat/completions"]?.post).toBeDefined();
    expect(spec.paths?.["/api/vault/quick-upload"]?.post).toBeDefined();
    expect(spec.paths?.["/api/v1/vault/files"]?.get).toBeDefined();
    expect(spec.paths?.["/api/v1/tenants"]?.get).toBeDefined();
  });

  it("declares security schemes", () => {
    const schemes = spec.components?.securitySchemes || {};
    expect(schemes.GatewayKeyAuth).toBeDefined();
    expect(schemes.ServiceTokenAuth).toBeDefined();
    expect(schemes.UserAuth).toBeDefined();
    expect(schemes.VaultTokenAuth).toBeDefined();
  });

  it("includes shared error responses", () => {
    const responses = spec.components?.responses || {};
    expect(responses.Unauthorized).toBeDefined();
    expect(responses.Forbidden).toBeDefined();
    expect(responses.RateLimited).toBeDefined();
  });
});
