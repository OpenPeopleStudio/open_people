/* ═══════════════════════════════════════════════════════════════════════════
   Compliance Evidence Packs
   Framework-specific evidence pack definitions for SOC2, GDPR, EU AI Act, HIPAA
   ═══════════════════════════════════════════════════════════════════════════ */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type ComplianceFramework = "SOC2" | "GDPR" | "EU_AI_ACT" | "HIPAA" | "ISO27001" | "NIST_AI_RMF";

export type EvidenceSourceType =
  | "audit_logs"
  | "rbac_snapshot"
  | "pii_config"
  | "incident_postmortems"
  | "approval_trails"
  | "policy_snapshot"
  | "encryption_config"
  | "access_logs"
  | "moderation_logs"
  | "data_retention_config"
  | "risk_assessments"
  | "training_records";

export type DateRange = {
  start: string; // ISO date string
  end: string;
};

export type AuditLogQuery = {
  action_categories?: string[];
  actions?: string[];
  resource_types?: string[];
  date_range?: DateRange;
  success_only?: boolean;
  include_metadata?: boolean;
};

export type EvidenceSource =
  | { type: "audit_logs"; query: AuditLogQuery }
  | { type: "rbac_snapshot"; scope: "all" | "admins" | "ai_access" }
  | { type: "pii_config"; include_detection_rules?: boolean }
  | { type: "incident_postmortems"; date_range?: DateRange; severity_min?: string }
  | { type: "approval_trails"; workflow_types?: string[]; date_range?: DateRange }
  | { type: "policy_snapshot"; policy_types?: string[] }
  | { type: "encryption_config"; scope: "all" | "pii" | "credentials" }
  | { type: "access_logs"; resource_types?: string[]; date_range?: DateRange }
  | { type: "moderation_logs"; include_flagged_only?: boolean; date_range?: DateRange }
  | { type: "data_retention_config" }
  | { type: "risk_assessments"; date_range?: DateRange }
  | { type: "training_records"; topic?: string };

export type EvidencePackTemplate = {
  framework: ComplianceFramework;
  control_id: string; // e.g., 'CC6.1', 'Article 13'
  control_name: string;
  description: string;
  evidence_sources: EvidenceSource[];
  // Optional: guidance on what the evidence should demonstrate
  evidence_guidance?: string;
};

export type EvidencePackCollection = {
  framework: ComplianceFramework;
  name: string;
  description: string;
  controls: EvidencePackTemplate[];
};

// ─────────────────────────────────────────────────────────────────────────────
// SOC2 Evidence Packs
// ─────────────────────────────────────────────────────────────────────────────

export const SOC2_EVIDENCE_PACKS: EvidencePackTemplate[] = [
  // CC6.1 - Logical and Physical Access Controls
  {
    framework: "SOC2",
    control_id: "CC6.1",
    control_name: "Logical and Physical Access Controls",
    description:
      "The entity implements logical access security measures to protect against threats from sources outside its system boundaries.",
    evidence_sources: [
      {
        type: "rbac_snapshot",
        scope: "all",
      },
      {
        type: "audit_logs",
        query: {
          action_categories: ["auth", "security"],
          actions: ["login", "logout", "failed_login", "password_reset", "mfa_enabled"],
        },
      },
      {
        type: "access_logs",
        resource_types: ["api_key", "gateway", "admin_panel"],
      },
    ],
    evidence_guidance:
      "Demonstrate that logical access controls are in place, including authentication mechanisms, role-based access, and audit trails of access attempts.",
  },

  // CC6.2 - Registration and Authorization
  {
    framework: "SOC2",
    control_id: "CC6.2",
    control_name: "Registration and Authorization",
    description:
      "Prior to issuing system credentials and granting access, the entity registers and authorizes new internal and external users.",
    evidence_sources: [
      {
        type: "audit_logs",
        query: {
          action_categories: ["admin"],
          actions: ["user_created", "user_invited", "role_assigned", "access_granted"],
        },
      },
      {
        type: "approval_trails",
        workflow_types: ["user_onboarding", "access_request"],
      },
    ],
    evidence_guidance:
      "Show the user registration and authorization process, including approval workflows and access provisioning.",
  },

  // CC6.3 - Removal of Access
  {
    framework: "SOC2",
    control_id: "CC6.3",
    control_name: "Removal of Access",
    description:
      "The entity removes credentials and access rights for users when no longer required.",
    evidence_sources: [
      {
        type: "audit_logs",
        query: {
          action_categories: ["admin"],
          actions: ["user_deactivated", "user_deleted", "access_revoked", "role_removed"],
        },
      },
      {
        type: "rbac_snapshot",
        scope: "all",
      },
    ],
    evidence_guidance:
      "Evidence of timely removal of access for departed employees and users who no longer require access.",
  },

  // CC6.6 - Data Encryption
  {
    framework: "SOC2",
    control_id: "CC6.6",
    control_name: "Logical Access Security - Encryption",
    description:
      "The entity implements controls to protect data at rest and in transit.",
    evidence_sources: [
      {
        type: "encryption_config",
        scope: "all",
      },
      {
        type: "policy_snapshot",
        policy_types: ["data"],
      },
    ],
    evidence_guidance:
      "Document encryption configurations for data at rest (database, files) and in transit (TLS, API security).",
  },

  // CC7.2 - Incident Response
  {
    framework: "SOC2",
    control_id: "CC7.2",
    control_name: "System Incident Monitoring and Response",
    description:
      "The entity monitors system components and the operation of those components for anomalies and responds to incidents.",
    evidence_sources: [
      {
        type: "incident_postmortems",
        severity_min: "medium",
      },
      {
        type: "audit_logs",
        query: {
          action_categories: ["security"],
          actions: ["incident_created", "incident_resolved", "alert_triggered"],
        },
      },
    ],
    evidence_guidance:
      "Incident response documentation including postmortems, resolution timelines, and lessons learned.",
  },

  // CC8.1 - Change Management
  {
    framework: "SOC2",
    control_id: "CC8.1",
    control_name: "Change Management",
    description:
      "The entity authorizes, designs, develops, configures, documents, tests, and implements changes to infrastructure and software.",
    evidence_sources: [
      {
        type: "audit_logs",
        query: {
          action_categories: ["admin"],
          actions: [
            "policy_created",
            "policy_updated",
            "config_changed",
            "prompt_updated",
            "model_changed",
          ],
        },
      },
      {
        type: "approval_trails",
        workflow_types: ["policy_approval", "config_change"],
      },
    ],
    evidence_guidance:
      "Change management records showing authorization and documentation of system changes.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// GDPR Evidence Packs
// ─────────────────────────────────────────────────────────────────────────────

export const GDPR_EVIDENCE_PACKS: EvidencePackTemplate[] = [
  // Article 5 - Principles
  {
    framework: "GDPR",
    control_id: "Article 5",
    control_name: "Principles Relating to Processing of Personal Data",
    description:
      "Personal data shall be processed lawfully, fairly, and in a transparent manner.",
    evidence_sources: [
      {
        type: "pii_config",
        include_detection_rules: true,
      },
      {
        type: "policy_snapshot",
        policy_types: ["data"],
      },
      {
        type: "audit_logs",
        query: {
          action_categories: ["data"],
          actions: ["pii_detected", "pii_redacted", "data_processed"],
        },
      },
    ],
    evidence_guidance:
      "PII detection and handling configurations, data processing policies, and logs of data handling activities.",
  },

  // Article 13 - Information to be Provided
  {
    framework: "GDPR",
    control_id: "Article 13",
    control_name: "Information to be Provided to Data Subject",
    description:
      "Where personal data are collected, the controller shall provide information about the processing.",
    evidence_sources: [
      {
        type: "pii_config",
        include_detection_rules: true,
      },
      {
        type: "audit_logs",
        query: {
          actions: ["consent_recorded", "privacy_notice_shown"],
        },
      },
    ],
    evidence_guidance:
      "Evidence of transparency measures including privacy notices and consent collection.",
  },

  // Article 17 - Right to Erasure
  {
    framework: "GDPR",
    control_id: "Article 17",
    control_name: "Right to Erasure (Right to be Forgotten)",
    description:
      "The data subject shall have the right to obtain erasure of personal data.",
    evidence_sources: [
      {
        type: "audit_logs",
        query: {
          actions: ["data_deletion_requested", "data_deleted", "erasure_completed"],
        },
      },
      {
        type: "data_retention_config",
      },
    ],
    evidence_guidance:
      "Records of data deletion requests, completion of erasure, and retention policies.",
  },

  // Article 25 - Data Protection by Design
  {
    framework: "GDPR",
    control_id: "Article 25",
    control_name: "Data Protection by Design and Default",
    description:
      "The controller shall implement appropriate technical and organizational measures for data protection.",
    evidence_sources: [
      {
        type: "encryption_config",
        scope: "pii",
      },
      {
        type: "pii_config",
        include_detection_rules: true,
      },
      {
        type: "policy_snapshot",
        policy_types: ["data", "content"],
      },
    ],
    evidence_guidance:
      "Technical measures for data protection including encryption, PII detection, and access controls.",
  },

  // Article 33 - Breach Notification
  {
    framework: "GDPR",
    control_id: "Article 33",
    control_name: "Notification of Personal Data Breach",
    description:
      "In case of a personal data breach, the controller shall notify the supervisory authority.",
    evidence_sources: [
      {
        type: "incident_postmortems",
        severity_min: "high",
      },
      {
        type: "audit_logs",
        query: {
          action_categories: ["security"],
          actions: ["breach_detected", "breach_reported", "breach_notification_sent"],
        },
      },
    ],
    evidence_guidance:
      "Incident records related to data breaches, notification procedures, and response timelines.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// EU AI Act Evidence Packs
// ─────────────────────────────────────────────────────────────────────────────

export const EU_AI_ACT_EVIDENCE_PACKS: EvidencePackTemplate[] = [
  // Article 9 - Risk Management System
  {
    framework: "EU_AI_ACT",
    control_id: "Article 9",
    control_name: "Risk Management System",
    description:
      "A risk management system shall be established, implemented, documented, and maintained for high-risk AI systems.",
    evidence_sources: [
      {
        type: "risk_assessments",
      },
      {
        type: "policy_snapshot",
        policy_types: ["access", "usage", "content"],
      },
      {
        type: "audit_logs",
        query: {
          actions: ["risk_evaluated", "risk_signal_detected"],
        },
      },
    ],
    evidence_guidance:
      "Risk assessment documentation, risk management policies, and risk signal monitoring logs.",
  },

  // Article 10 - Data Governance
  {
    framework: "EU_AI_ACT",
    control_id: "Article 10",
    control_name: "Data and Data Governance",
    description:
      "High-risk AI systems shall be developed with data governance and management practices.",
    evidence_sources: [
      {
        type: "pii_config",
        include_detection_rules: true,
      },
      {
        type: "data_retention_config",
      },
      {
        type: "audit_logs",
        query: {
          action_categories: ["data"],
        },
      },
    ],
    evidence_guidance:
      "Data governance configurations, data quality measures, and data handling practices.",
  },

  // Article 11 - Technical Documentation
  {
    framework: "EU_AI_ACT",
    control_id: "Article 11",
    control_name: "Technical Documentation",
    description:
      "Technical documentation shall be drawn up before an AI system is placed on the market.",
    evidence_sources: [
      {
        type: "policy_snapshot",
        policy_types: ["access", "usage", "data", "content"],
      },
      {
        type: "rbac_snapshot",
        scope: "ai_access",
      },
      {
        type: "encryption_config",
        scope: "all",
      },
    ],
    evidence_guidance:
      "Technical system documentation including AI model configurations, access controls, and security measures.",
  },

  // Article 12 - Record-keeping
  {
    framework: "EU_AI_ACT",
    control_id: "Article 12",
    control_name: "Record-keeping",
    description:
      "High-risk AI systems shall technically allow for automatic recording of events (logs).",
    evidence_sources: [
      {
        type: "audit_logs",
        query: {
          action_categories: ["ai"],
          include_metadata: true,
        },
      },
      {
        type: "moderation_logs",
        include_flagged_only: false,
      },
    ],
    evidence_guidance:
      "AI interaction logs, moderation results, and system event records demonstrating traceability.",
  },

  // Article 13 - Transparency
  {
    framework: "EU_AI_ACT",
    control_id: "Article 13",
    control_name: "Transparency and Provision of Information",
    description:
      "High-risk AI systems shall be designed to ensure their operation is sufficiently transparent.",
    evidence_sources: [
      {
        type: "audit_logs",
        query: {
          actions: ["policy_decision", "moderation_result", "risk_evaluated"],
          include_metadata: true,
        },
      },
      {
        type: "policy_snapshot",
        policy_types: ["access", "usage", "content"],
      },
    ],
    evidence_guidance:
      "Evidence of explainable AI decisions, policy tracing, and user-facing transparency measures.",
  },

  // Article 14 - Human Oversight
  {
    framework: "EU_AI_ACT",
    control_id: "Article 14",
    control_name: "Human Oversight",
    description:
      "High-risk AI systems shall be designed to be effectively overseen by natural persons.",
    evidence_sources: [
      {
        type: "approval_trails",
        workflow_types: ["hitl_review", "approval"],
      },
      {
        type: "audit_logs",
        query: {
          actions: [
            "approval_requested",
            "approval_granted",
            "approval_denied",
            "human_review_completed",
          ],
        },
      },
    ],
    evidence_guidance:
      "Human-in-the-loop review processes, approval workflows, and oversight documentation.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// HIPAA Evidence Packs
// ─────────────────────────────────────────────────────────────────────────────

export const HIPAA_EVIDENCE_PACKS: EvidencePackTemplate[] = [
  // 164.312(a)(1) - Access Control
  {
    framework: "HIPAA",
    control_id: "164.312(a)(1)",
    control_name: "Access Control",
    description:
      "Implement technical policies and procedures for electronic information systems that maintain PHI.",
    evidence_sources: [
      {
        type: "rbac_snapshot",
        scope: "all",
      },
      {
        type: "audit_logs",
        query: {
          action_categories: ["auth", "admin"],
          actions: ["login", "logout", "access_granted", "access_denied"],
        },
      },
      {
        type: "policy_snapshot",
        policy_types: ["access"],
      },
    ],
    evidence_guidance:
      "Access control configurations, role assignments, and access audit logs for systems handling PHI.",
  },

  // 164.312(b) - Audit Controls
  {
    framework: "HIPAA",
    control_id: "164.312(b)",
    control_name: "Audit Controls",
    description:
      "Implement hardware, software, and/or procedural mechanisms that record and examine activity.",
    evidence_sources: [
      {
        type: "audit_logs",
        query: {
          include_metadata: true,
        },
      },
      {
        type: "access_logs",
        resource_types: ["phi_data", "patient_records"],
      },
    ],
    evidence_guidance:
      "Comprehensive audit logs of system activity, particularly for PHI access and modifications.",
  },

  // 164.312(c)(1) - Integrity
  {
    framework: "HIPAA",
    control_id: "164.312(c)(1)",
    control_name: "Integrity",
    description:
      "Implement policies and procedures to protect PHI from improper alteration or destruction.",
    evidence_sources: [
      {
        type: "encryption_config",
        scope: "pii",
      },
      {
        type: "audit_logs",
        query: {
          action_categories: ["data"],
          actions: ["data_modified", "data_deleted", "backup_created"],
        },
      },
    ],
    evidence_guidance:
      "Data integrity controls including encryption, checksums, and modification audit trails.",
  },

  // 164.312(e)(1) - Transmission Security
  {
    framework: "HIPAA",
    control_id: "164.312(e)(1)",
    control_name: "Transmission Security",
    description:
      "Implement technical security measures to guard against unauthorized access to PHI transmitted over networks.",
    evidence_sources: [
      {
        type: "encryption_config",
        scope: "all",
      },
      {
        type: "policy_snapshot",
        policy_types: ["data"],
      },
    ],
    evidence_guidance:
      "Encryption configurations for data in transit, TLS certificates, and network security policies.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Framework Collections
// ─────────────────────────────────────────────────────────────────────────────

export const EVIDENCE_PACK_COLLECTIONS: Record<ComplianceFramework, EvidencePackCollection> = {
  SOC2: {
    framework: "SOC2",
    name: "SOC 2 Type II",
    description:
      "Service Organization Control 2 - Trust Services Criteria evidence packs",
    controls: SOC2_EVIDENCE_PACKS,
  },
  GDPR: {
    framework: "GDPR",
    name: "GDPR",
    description:
      "General Data Protection Regulation compliance evidence packs",
    controls: GDPR_EVIDENCE_PACKS,
  },
  EU_AI_ACT: {
    framework: "EU_AI_ACT",
    name: "EU AI Act",
    description:
      "European Union Artificial Intelligence Act evidence packs for high-risk AI systems",
    controls: EU_AI_ACT_EVIDENCE_PACKS,
  },
  HIPAA: {
    framework: "HIPAA",
    name: "HIPAA",
    description:
      "Health Insurance Portability and Accountability Act security rule evidence packs",
    controls: HIPAA_EVIDENCE_PACKS,
  },
  ISO27001: {
    framework: "ISO27001",
    name: "ISO 27001",
    description: "Information Security Management System evidence packs",
    controls: [], // To be expanded
  },
  NIST_AI_RMF: {
    framework: "NIST_AI_RMF",
    name: "NIST AI RMF",
    description: "NIST AI Risk Management Framework evidence packs",
    controls: [], // To be expanded
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

export function getEvidencePacksByFramework(
  framework: ComplianceFramework
): EvidencePackTemplate[] {
  return EVIDENCE_PACK_COLLECTIONS[framework]?.controls || [];
}

export function getEvidencePackByControlId(
  framework: ComplianceFramework,
  controlId: string
): EvidencePackTemplate | undefined {
  const packs = getEvidencePacksByFramework(framework);
  return packs.find((p) => p.control_id === controlId);
}

export function getAllEvidencePacks(): EvidencePackTemplate[] {
  return Object.values(EVIDENCE_PACK_COLLECTIONS).flatMap((c) => c.controls);
}
