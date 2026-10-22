import { timingSafeEqual } from "node:crypto";

export function askAdminToken(): string {
  return process.env.ASK_ADMIN_TOKEN?.trim() ?? "";
}

export function askAdminConfigured(): boolean {
  return askAdminToken().length > 0;
}

function bearerToken(req: Request): string {
  const header = req.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(\S+)/i.exec(header);
  return match?.[1] ?? "";
}

export function authorizeAskAdmin(req: Request): boolean {
  const expected = askAdminToken();
  if (!expected) return false;
  const got = bearerToken(req);
  const a = Buffer.from(got);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
