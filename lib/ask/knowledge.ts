import { readFileSync } from "node:fs";
import { join } from "node:path";

const KNOWLEDGE_REL = "content/ask/proposal-knowledge.md";

export function knowledgePath(): string {
  return join(process.cwd(), KNOWLEDGE_REL);
}

export function loadProposalKnowledge(): string {
  return readFileSync(knowledgePath(), "utf8");
}

export function knowledgeIsPlaceholder(text: string = loadProposalKnowledge()): boolean {
  return /\*\*Status:\*\*\s*empty/i.test(text) || /Status:\s*empty/i.test(text);
}
