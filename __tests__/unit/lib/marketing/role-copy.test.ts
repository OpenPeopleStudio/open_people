import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

const PUBLIC_ROLE_FILES = [
  "app/(marketing)/brief/page.tsx",
  "app/(marketing)/coalition/page.tsx",
  "app/(marketing)/compute/page.tsx",
  "app/(marketing)/funding/page.tsx",
  "app/(marketing)/partnership/page.tsx",
  "app/(marketing)/feasibility/page.tsx",
  "app/(marketing)/about/page.tsx",
  "app/(marketing)/page.tsx",
  "app/(marketing)/engage/page.tsx",
  "app/(marketing)/build/page.tsx",
  "app/(marketing)/capital/page.tsx",
  "app/(marketing)/consent/page.tsx",
  "app/(marketing)/power/page.tsx",
  "components/marketing/SiteFooter.tsx",
  "lib/og/copy.ts",
  "lib/desk/compute.ts",
  "lib/desk/capital.ts",
  "lib/desk/consent.ts",
  "lib/desk/feasibility.ts",
  "lib/marketing/vision.ts",
  "lib/marketing/approach.ts",
  "lib/marketing/home.ts",
  "lib/board/entries.ts",
];

describe("Open People public role copy", () => {
  it("does not call Open People a catalyst or deny a deal seat", () => {
    for (const rel of PUBLIC_ROLE_FILES) {
      const blob = readFileSync(resolve(ROOT, rel), "utf8");
      expect(blob, rel).not.toMatch(/catalyst/i);
      expect(blob, rel).not.toMatch(/not a deal seat/i);
      expect(blob, rel).not.toMatch(/bankable offtake/i);
      expect(blob, rel).not.toMatch(/stays catalyst/i);
      expect(blob, rel).not.toMatch(/own any steel/i);
    }
  });

  it("keeps /brief as proponent of the proposed campus", () => {
    const brief = readFileSync(resolve(ROOT, "app/(marketing)/brief/page.tsx"), "utf8");
    expect(brief).toMatch(/Open People leads/i);
    expect(brief).toMatch(/proponent/i);
    expect(brief).toMatch(/Partnership, if any, will be on terms each nation sets/);
    expect(brief).toMatch(/No nation has been asked about this project/);
  });
});
