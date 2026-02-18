/**
 * @open-people/migrate
 *
 * Convert between .marsbot v1 and .opkg formats.
 * See docs/reference/marsbot-mapping.md for the field-by-field mapping.
 *
 * Not yet implemented. See TODO.md M2 milestone.
 */

export interface MarsbotExport {
  version: 1;
  exportedAt: string;
  agent: {
    identity: { name: string; color: string; expressiveState: string };
    personality: {
      verbosity: number;
      formality: number;
      carefulness: number;
      curiosity: number;
      tone: string;
      vibeWords: string[];
      roleModel?: string;
    };
    origin: { trigger: string; need: string; bornAt: string };
    model: { provider: string; model: string; temperature: number; maxTokens: number };
    systemPromptAdditions: string[];
    guardrails: {
      blockedTopics: string[];
      requireApprovalFor: string[];
      maxTokensPerTurn: number;
    };
  };
  memory?: {
    reflections: Array<{ content: string; confidence: number; source: string; createdAt: string }>;
    keyValueStore: Record<string, unknown>;
  };
  skills?: string[];
}

// TODO: Implement in M2
// export function marsbotToOpkg(marsbot: MarsbotExport, ownerKeypair: Keypair, agentKeypair: Keypair): { agent: PackageEnvelope; memory?: PackageEnvelope; bundle: PackageEnvelope }
// export function opkgToMarsbot(agentPkg: PackageEnvelope, memoryPkg?: PackageEnvelope): MarsbotExport
