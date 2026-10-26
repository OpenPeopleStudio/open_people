import { existsSync, readdirSync, readFileSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

const TEXT_EXT = new Set([
  ".cjs",
  ".css",
  ".csv",
  ".html",
  ".js",
  ".json",
  ".jsx",
  ".md",
  ".mjs",
  ".svg",
  ".ts",
  ".tsx",
  ".txt",
  ".xml",
]);

const BANNED = [
  { label: "Water Street", re: /Water Street/i },
  { label: "281 Water", re: /281 Water/i },
  { label: "685-8584", re: /685-8584/ },
  { label: "6858584", re: /6858584/ },
  { label: "auth@", re: /auth@/i },
] as const;

/** Public pages, the components they render, and the data/copy those pages read. */
const SCAN_ROOTS = [
  "app/(marketing)",
  "components/marketing",
  "lib/desk",
  "lib/marketing",
  "lib/og",
  "lib/board",
  "lib/voice-mode",
  "content",
  "public",
];

function walk(dir: string, files: string[] = []): string[] {
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next") continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, files);
      continue;
    }
    if (TEXT_EXT.has(extname(entry.name).toLowerCase())) files.push(full);
  }
  return files;
}

describe("public marketing PII ban", () => {
  it("keeps Water Street, 281 Water, 685-8584, 6858584, and auth@ off public pages", () => {
    const hits: string[] = [];
    for (const rel of SCAN_ROOTS) {
      for (const file of walk(resolve(ROOT, rel))) {
        const text = readFileSync(file, "utf8");
        for (const { label, re } of BANNED) {
          if (re.test(text)) hits.push(`${relative(ROOT, file)}: ${label}`);
        }
      }
    }
    expect(hits).toEqual([]);
  });

  it("keeps /letter sender, opening, and signature at city only", () => {
    const letter = readFileSync(resolve(ROOT, "app/(marketing)/letter/page.tsx"), "utf8");
    expect(letter).toContain('lines: ["Tom Lane", "St. John’s, Newfoundland and Labrador"]');
    expect(letter).toMatch(/I am Tom Lane\. I live in St\. John['’]s\./);
    expect(letter).toMatch(
      /<p className="mt-6 font-display[\s\S]*Tom Lane[\s\S]*St\. John['’]s, NL/,
    );
    expect(letter).toMatch(/home street address has been removed/);
    expect(letter).not.toMatch(/281 Water/i);
    expect(letter).not.toMatch(/Water Street/i);
  });
});
