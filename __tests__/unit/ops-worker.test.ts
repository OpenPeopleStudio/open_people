/**
 * Ops Worker Unit Tests
 *
 * Tests for the Ops Worker prompt parsing, service functions, and type contracts.
 */

import { describe, it, expect } from "vitest";
import {
  parseOpsProposal,
  buildOpsWorkerSystemPrompt,
  buildOpsWorkerUserMessage,
  OPS_WORKER_TAG,
  SOURCE_TAGS,
  type OpsProposal,
  type DecisionSource,
} from "@/lib/ai/prompts/opsWorker";
import {
  checkForDuplicates,
  mapProposalToTaskCreate,
  selectModel,
  createDecisionFromEmail,
  createDecisionFromMeeting,
  createManualDecision,
  type OpsContext,
  type BudgetStatus,
} from "@/lib/ops/service";

// ════════════════════════════════════════════════════════════════════════════
// FIXTURES
// ════════════════════════════════════════════════════════════════════════════

const SAMPLE_MEETING_NOTES = `
Team Sync - January 15, 2024

Attendees: John, Sarah, Mike

Discussion:
- Q1 goals review
- New feature timeline

Action Items:
- John: Schedule design review by Friday
- Sarah: Draft product requirements doc
- Mike: Research competitor pricing
- All: Review Q1 targets by EOW
`;

const SAMPLE_EMAIL = `
From: client@example.com
Subject: Project Kickoff Follow-up

Hi team,

Following up on our kickoff meeting. Please ensure:
1. Contract is signed by Jan 20
2. Technical specs are finalized this week
3. Schedule onboarding call with their team

Thanks,
Client
`;

const VALID_PROPOSAL_JSON = JSON.stringify({
  decision_id: "test-decision-id",
  decision_summary: "Team sync with 4 action items identified",
  tasks_to_create: [
    {
      id: "task-1",
      title: "Schedule design review meeting",
      description: "Set up design review session with stakeholders",
      priority: "high",
      due_date: "2024-01-19",
      checklist: [
        { title: "Find available time slot", estimated_minutes: 10 },
        { title: "Send calendar invite", estimated_minutes: 5 },
      ],
      rationale: "John mentioned as action item with Friday deadline",
      confidence: 0.95,
      source_excerpt: "John: Schedule design review by Friday",
    },
    {
      id: "task-2",
      title: "Draft product requirements document",
      priority: "normal",
      rationale: "Assigned to Sarah",
      confidence: 0.9,
    },
  ],
  tasks_to_update: [
    {
      task_id: "existing-task-1",
      current_title: "Review Q1 targets",
      new_priority: "high",
      new_due_date: "2024-01-19",
      rationale: "Made urgent due to EOW deadline",
    },
  ],
  questions: [],
  reasoning: "Found 4 clear action items from the meeting notes.",
  themes: ["planning", "design", "research"],
});

const MOCK_EXISTING_TASKS: OpsContext["existingTasks"] = [
  {
    id: "existing-1",
    title: "Review Q1 targets",
    status: "todo",
    priority: "normal",
    due_date: null,
  },
  {
    id: "existing-2",
    title: "Schedule team meeting",
    status: "in_progress",
    priority: "normal",
    due_date: "2024-01-20",
  },
];

const MOCK_DECISION = {
  id: "test-decision-id",
  owner_id: "test-user-id",
  tenant_id: null,
  raw_text: SAMPLE_MEETING_NOTES,
  summary: null,
  source: { type: "meeting_notes" as const, label: "Team sync" },
  context_assembly_id: null,
  status: "draft" as const,
  ops_run_id: null,
  created_task_ids: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// ════════════════════════════════════════════════════════════════════════════
// PROPOSAL PARSING TESTS
// ════════════════════════════════════════════════════════════════════════════

describe("parseOpsProposal", () => {
  it("parses valid JSON proposal", () => {
    const result = parseOpsProposal(VALID_PROPOSAL_JSON);

    expect(result).not.toBeNull();
    expect(result?.decision_id).toBe("test-decision-id");
    expect(result?.decision_summary).toBe("Team sync with 4 action items identified");
    expect(result?.tasks_to_create).toHaveLength(2);
    expect(result?.tasks_to_update).toHaveLength(1);
    expect(result?.themes).toContain("planning");
  });

  it("parses JSON wrapped in markdown code blocks", () => {
    const wrapped = `Here is the proposal:

\`\`\`json
${VALID_PROPOSAL_JSON}
\`\`\`

That's the analysis.`;

    const result = parseOpsProposal(wrapped);
    expect(result).not.toBeNull();
    expect(result?.tasks_to_create).toHaveLength(2);
  });

  it("returns null for invalid JSON", () => {
    const result = parseOpsProposal("this is not json");
    expect(result).toBeNull();
  });

  it("returns null for missing required fields", () => {
    const incomplete = JSON.stringify({
      reasoning: "incomplete",
    });
    const result = parseOpsProposal(incomplete);
    expect(result).toBeNull();
  });

  it("provides default values for missing optional fields", () => {
    const minimal = JSON.stringify({
      decision_id: "test",
      tasks_to_create: [
        {
          id: "t1",
          title: "Test task",
          priority: "normal",
          rationale: "test",
        },
      ],
    });

    const result = parseOpsProposal(minimal);
    expect(result).not.toBeNull();
    expect(result?.tasks_to_update).toEqual([]);
    expect(result?.questions).toEqual([]);
    expect(result?.tasks_to_create[0].confidence).toBe(0.5); // Default
    expect(result?.tasks_to_create[0].tags).toEqual([]);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// PROMPT BUILDING TESTS
// ════════════════════════════════════════════════════════════════════════════

describe("buildOpsWorkerSystemPrompt", () => {
  it("builds basic system prompt", () => {
    const prompt = buildOpsWorkerSystemPrompt();
    expect(prompt).toContain("Ops Worker AI assistant");
    expect(prompt).toContain("Decision Analysis");
    expect(prompt).toContain("OpsProposal");
    expect(prompt).toContain("NEVER auto-apply");
  });

  it("includes user name when provided", () => {
    const prompt = buildOpsWorkerSystemPrompt("John");
    expect(prompt).toContain("Ops Worker assistant for John");
  });

  it("includes user context when provided", () => {
    const prompt = buildOpsWorkerSystemPrompt(null, "Focus on Q1 planning");
    expect(prompt).toContain("Additional Context");
    expect(prompt).toContain("Focus on Q1 planning");
  });
});

describe("buildOpsWorkerUserMessage", () => {
  it("builds user message with all context", () => {
    const message = buildOpsWorkerUserMessage({
      decisionId: "test-id",
      rawText: SAMPLE_MEETING_NOTES,
      source: { type: "meeting_notes", label: "Team sync" },
      goals: [{ id: "g1", title: "Increase revenue", status: "active" }],
      projects: [{ id: "p1", name: "Q1 Launch", status: "active" }],
      existingTasks: MOCK_EXISTING_TASKS,
      today: "2024-01-15",
    });

    expect(message).toContain("Decision to Process");
    expect(message).toContain("test-id");
    expect(message).toContain("meeting_notes");
    expect(message).toContain("Team sync");
    expect(message).toContain("Increase revenue");
    expect(message).toContain("Q1 Launch");
    expect(message).toContain("Review Q1 targets");
    expect(message).toContain("2024-01-15");
  });

  it("handles missing optional context", () => {
    const message = buildOpsWorkerUserMessage({
      decisionId: "test-id",
      rawText: "Simple note",
      source: { type: "manual" },
      today: "2024-01-15",
    });

    expect(message).toContain("Decision to Process");
    expect(message).toContain("Simple note");
    expect(message).not.toContain("Active Goals");
  });
});

// ════════════════════════════════════════════════════════════════════════════
// SERVICE FUNCTION TESTS
// ════════════════════════════════════════════════════════════════════════════

describe("checkForDuplicates", () => {
  it("detects similar task titles", () => {
    const proposed = [
      {
        id: "p1",
        title: "Schedule team meeting",
        priority: "normal" as const,
        rationale: "test",
        confidence: 0.9,
      },
      {
        id: "p2",
        title: "Complete totally different task",
        priority: "normal" as const,
        rationale: "test",
        confidence: 0.9,
      },
    ];

    const results = checkForDuplicates(proposed, MOCK_EXISTING_TASKS);

    expect(results).toHaveLength(2);
    expect(results[0].potentialDuplicate).toBeDefined();
    expect(results[0].potentialDuplicate?.taskTitle).toBe("Schedule team meeting");
    expect(results[1].potentialDuplicate).toBeUndefined();
  });

  it("returns empty duplicates for unique tasks", () => {
    const proposed = [
      {
        id: "p1",
        title: "Completely new unique task",
        priority: "normal" as const,
        rationale: "test",
        confidence: 0.9,
      },
    ];

    const results = checkForDuplicates(proposed, MOCK_EXISTING_TASKS);
    expect(results[0].potentialDuplicate).toBeUndefined();
  });
});

describe("mapProposalToTaskCreate", () => {
  it("maps proposal to task create payload", () => {
    const proposal = {
      id: "p1",
      title: "Test Task",
      description: "Task description",
      priority: "high" as const,
      due_date: "2024-01-20",
      tags: ["custom-tag"],
      checklist: [{ title: "Step 1" }, { title: "Step 2" }],
      estimated_minutes: 60,
      rationale: "Test rationale",
      aligned_goal_ids: ["g1"],
      source_excerpt: "Original text",
      confidence: 0.9,
    };

    const payload = mapProposalToTaskCreate(proposal, "user-id", MOCK_DECISION, 0);

    expect(payload.owner_id).toBe("user-id");
    expect(payload.title).toBe("Test Task");
    expect(payload.description).toBe("Task description");
    expect(payload.priority).toBe("high");
    expect(payload.due_date).toBe("2024-01-20");
    expect(payload.tags).toContain(OPS_WORKER_TAG);
    expect(payload.tags).toContain(SOURCE_TAGS.meeting_notes);
    expect(payload.tags).toContain("custom-tag");
    expect(payload.checklist).toHaveLength(2);
    expect(payload.checklist[0].done).toBe(false);
    expect(payload.metadata.ops_worker).toBe(true);
    expect(payload.metadata.confidence).toBe(0.9);
  });
});

describe("selectModel", () => {
  const normalBudget: BudgetStatus = {
    hasLimit: true,
    budgetCents: 1000,
    usedCents: 500,
    remainingCents: 500,
    canProceed: true,
    onExceed: "warn",
  };

  const lowBudget: BudgetStatus = {
    hasLimit: true,
    budgetCents: 100,
    usedCents: 90,
    remainingCents: 10,
    canProceed: true,
    onExceed: "downgrade_model",
  };

  it("returns default model normally", () => {
    const result = selectModel(normalBudget, false);
    expect(result.model).toBe("gpt-4o");
    expect(result.reason).toBe("Default model");
  });

  it("returns cheap model when requested", () => {
    const result = selectModel(normalBudget, true);
    expect(result.model).toBe("gpt-4o-mini");
    expect(result.reason).toBe("Cheap mode enabled");
  });

  it("downgrades model on low budget", () => {
    const result = selectModel(lowBudget, false);
    expect(result.model).toBe("gpt-4o-mini");
    expect(result.reason).toContain("Low budget");
  });

  it("respects user preference", () => {
    const result = selectModel(normalBudget, false, "gpt-4-turbo");
    expect(result.model).toBe("gpt-4-turbo");
    expect(result.reason).toBe("User preference");
  });
});

// ════════════════════════════════════════════════════════════════════════════
// DECISION HELPER TESTS
// ════════════════════════════════════════════════════════════════════════════

describe("createDecisionFromEmail", () => {
  it("formats email into decision", () => {
    const result = createDecisionFromEmail(
      "email-123",
      "Project Update",
      "Email body content here",
      "sender@example.com"
    );

    expect(result.raw_text).toContain("Email from: sender@example.com");
    expect(result.raw_text).toContain("Subject: Project Update");
    expect(result.raw_text).toContain("Email body content here");
    expect(result.source.type).toBe("email");
    expect(result.source.reference_id).toBe("email-123");
    expect(result.source.label).toBe("Project Update");
  });
});

describe("createDecisionFromMeeting", () => {
  it("formats meeting notes into decision", () => {
    const result = createDecisionFromMeeting("note-123", "Weekly Sync", "Meeting content");

    expect(result.raw_text).toContain("Meeting: Weekly Sync");
    expect(result.raw_text).toContain("Meeting content");
    expect(result.source.type).toBe("meeting_notes");
    expect(result.source.reference_id).toBe("note-123");
  });
});

describe("createManualDecision", () => {
  it("creates manual decision", () => {
    const result = createManualDecision("Quick capture text", "My label");

    expect(result.raw_text).toBe("Quick capture text");
    expect(result.source.type).toBe("manual");
    expect(result.source.label).toBe("My label");
  });

  it("uses default label when not provided", () => {
    const result = createManualDecision("Text only");
    expect(result.source.label).toBe("Manual entry");
  });
});

// ════════════════════════════════════════════════════════════════════════════
// TYPE CONTRACT TESTS
// ════════════════════════════════════════════════════════════════════════════

describe("Type contracts", () => {
  it("OPS_WORKER_TAG is defined", () => {
    expect(OPS_WORKER_TAG).toBe("ops-worker");
  });

  it("SOURCE_TAGS covers all source types", () => {
    expect(SOURCE_TAGS.email).toBe("from-email");
    expect(SOURCE_TAGS.meeting_notes).toBe("from-meeting");
    expect(SOURCE_TAGS.note).toBe("from-note");
    expect(SOURCE_TAGS.manual).toBe("manual-entry");
    expect(SOURCE_TAGS.inbox).toBe("from-inbox");
  });
});
