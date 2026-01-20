/* ═══════════════════════════════════════════════════════════════════════════
   Tenant Onboarding Types
   Shared DTOs for onboarding intake flow
   ═══════════════════════════════════════════════════════════════════════════ */

// Status enum matching DB
export type OnboardingStatus = "not_started" | "in_progress" | "completed" | "skipped";

// Customer segment structure
export type CustomerSegment = {
  name: string;
  description?: string;
};

// Success metric structure
export type SuccessMetric = {
  metric: string;
  target?: string;
  timeframe?: string;
};

// Full onboarding record (matches DB schema)
export type TenantOnboarding = {
  id: string;
  tenant_id: string;
  created_by: string | null;
  
  // Status
  status: OnboardingStatus;
  current_step: number;
  completed_at: string | null;
  
  // Step 1: Business Basics
  industry: string | null;
  industry_other: string | null;
  business_stage: BusinessStage | null;
  company_size: CompanySize | null;
  
  // Step 2: Offerings
  offerings_description: string | null;
  offerings_type: OfferingsType | null;
  primary_value_prop: string | null;
  
  // Step 3: Audience
  target_audience: string | null;
  customer_segments: CustomerSegment[];
  geographic_focus: GeographicFocus | null;
  
  // Step 4: Goals
  primary_goals: string[];
  success_metrics: SuccessMetric[];
  timeline: string | null;
  
  // Step 5: Challenges
  pain_points: string[];
  biggest_challenge: string | null;
  
  // Step 6: Tools & Data
  current_tools: string[];
  data_sources: string[];
  integration_needs: string | null;
  
  // Step 7: AI Interests
  ai_use_cases: string[];
  automation_priorities: string[];
  ai_comfort_level: AIComfortLevel | null;
  
  // Step 8: Budget
  budget_range: string | null;
  team_involvement: string | null;
  decision_timeline: string | null;
  
  // Step 9: Additional
  how_did_you_hear: string | null;
  additional_notes: string | null;
  
  // Timestamps
  created_at: string;
  updated_at: string;
};

// Enums for form options
export type BusinessStage = "idea" | "early" | "growing" | "established" | "scaling";
export type CompanySize = "1" | "2-10" | "11-50" | "51-200" | "201-500" | "500+";
export type OfferingsType = "physical_products" | "digital_products" | "services" | "saas" | "marketplace" | "mixed";
export type GeographicFocus = "local" | "regional" | "national" | "international" | "global";
export type AIComfortLevel = "beginner" | "intermediate" | "advanced";

// Option lists for form dropdowns
export const INDUSTRY_OPTIONS = [
  { value: "retail", label: "Retail & E-commerce" },
  { value: "technology", label: "Technology & Software" },
  { value: "healthcare", label: "Healthcare & Medical" },
  { value: "finance", label: "Finance & Banking" },
  { value: "education", label: "Education & Training" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "professional_services", label: "Professional Services" },
  { value: "hospitality", label: "Hospitality & Tourism" },
  { value: "real_estate", label: "Real Estate" },
  { value: "media", label: "Media & Entertainment" },
  { value: "nonprofit", label: "Nonprofit & Social Impact" },
  { value: "construction", label: "Construction & Engineering" },
  { value: "logistics", label: "Logistics & Transportation" },
  { value: "agriculture", label: "Agriculture & Food" },
  { value: "energy", label: "Energy & Utilities" },
  { value: "other", label: "Other" },
] as const;

export const BUSINESS_STAGE_OPTIONS = [
  { value: "idea", label: "Idea Stage", description: "Still validating the concept" },
  { value: "early", label: "Early Stage", description: "Just getting started, under 1 year" },
  { value: "growing", label: "Growing", description: "Gaining traction, 1-3 years" },
  { value: "established", label: "Established", description: "Stable operations, 3+ years" },
  { value: "scaling", label: "Scaling", description: "Rapid expansion phase" },
] as const;

export const COMPANY_SIZE_OPTIONS = [
  { value: "1", label: "Just me" },
  { value: "2-10", label: "2-10 people" },
  { value: "11-50", label: "11-50 people" },
  { value: "51-200", label: "51-200 people" },
  { value: "201-500", label: "201-500 people" },
  { value: "500+", label: "500+ people" },
] as const;

export const OFFERINGS_TYPE_OPTIONS = [
  { value: "physical_products", label: "Physical Products", description: "Tangible goods you ship" },
  { value: "digital_products", label: "Digital Products", description: "Downloads, courses, media" },
  { value: "services", label: "Services", description: "Consulting, freelance, agency" },
  { value: "saas", label: "SaaS / Software", description: "Subscription software" },
  { value: "marketplace", label: "Marketplace", description: "Connecting buyers and sellers" },
  { value: "mixed", label: "Mixed / Multiple", description: "Combination of the above" },
] as const;

export const GEOGRAPHIC_FOCUS_OPTIONS = [
  { value: "local", label: "Local", description: "City or neighborhood" },
  { value: "regional", label: "Regional", description: "State or multi-state" },
  { value: "national", label: "National", description: "Entire country" },
  { value: "international", label: "International", description: "Multiple countries" },
  { value: "global", label: "Global", description: "Worldwide presence" },
] as const;

export const AI_COMFORT_OPTIONS = [
  { value: "beginner", label: "Beginner", description: "New to AI, need guidance" },
  { value: "intermediate", label: "Intermediate", description: "Some experience with AI tools" },
  { value: "advanced", label: "Advanced", description: "Very comfortable, looking for power features" },
] as const;

export const GOAL_SUGGESTIONS = [
  "Increase sales/revenue",
  "Improve customer experience",
  "Automate repetitive tasks",
  "Better understand my customers",
  "Streamline operations",
  "Launch new products/services",
  "Expand to new markets",
  "Reduce costs",
  "Improve team productivity",
  "Build a stronger brand",
] as const;

export const PAIN_POINT_SUGGESTIONS = [
  "Too many manual tasks",
  "Data scattered across tools",
  "Hard to get insights from data",
  "Customer support is overwhelming",
  "Inventory management challenges",
  "Marketing is time-consuming",
  "Hiring and team management",
  "Cash flow management",
  "Keeping up with competition",
  "Technical debt / legacy systems",
] as const;

export const AI_USE_CASE_SUGGESTIONS = [
  "Automated customer support",
  "Content generation",
  "Data analysis and insights",
  "Email automation",
  "Inventory forecasting",
  "Lead scoring and qualification",
  "Personalized recommendations",
  "Document processing",
  "Meeting summaries",
  "Code assistance",
] as const;

export const TOOL_SUGGESTIONS = [
  "Spreadsheets (Excel, Google Sheets)",
  "CRM (Salesforce, HubSpot)",
  "Accounting (QuickBooks, Xero)",
  "E-commerce (Shopify, WooCommerce)",
  "Marketing (Mailchimp, Klaviyo)",
  "Project Management (Asana, Monday)",
  "Communication (Slack, Teams)",
  "Analytics (Google Analytics)",
  "Social Media Tools",
  "Custom/Internal Systems",
] as const;

export const BUDGET_OPTIONS = [
  { value: "exploring", label: "Just exploring", description: "Not ready to commit" },
  { value: "under_100", label: "Under $100/month" },
  { value: "100_500", label: "$100-500/month" },
  { value: "500_2000", label: "$500-2,000/month" },
  { value: "2000_10000", label: "$2,000-10,000/month" },
  { value: "10000_plus", label: "$10,000+/month" },
  { value: "custom", label: "Need custom pricing" },
] as const;

export const REFERRAL_OPTIONS = [
  { value: "search", label: "Search engine (Google, etc.)" },
  { value: "social", label: "Social media" },
  { value: "referral", label: "Friend or colleague" },
  { value: "blog", label: "Blog or article" },
  { value: "podcast", label: "Podcast" },
  { value: "event", label: "Conference or event" },
  { value: "ad", label: "Online advertisement" },
  { value: "other", label: "Other" },
] as const;

// API request/response types
export type OnboardingUpdateRequest = Partial<Omit<TenantOnboarding, "id" | "tenant_id" | "created_at" | "updated_at">>;

export type OnboardingResponse = {
  onboarding: TenantOnboarding | null;
  isNew: boolean;
};

// Step definition for the wizard UI
export type OnboardingStep = {
  id: number;
  key: string;
  title: string;
  description: string;
};

export const ONBOARDING_STEPS: OnboardingStep[] = [
  { id: 1, key: "basics", title: "Business Basics", description: "Tell us about your business" },
  { id: 2, key: "offerings", title: "What You Offer", description: "Your products or services" },
  { id: 3, key: "audience", title: "Target Audience", description: "Who you serve" },
  { id: 4, key: "goals", title: "Goals & Objectives", description: "What you want to achieve" },
  { id: 5, key: "challenges", title: "Current Challenges", description: "Pain points we can help with" },
  { id: 6, key: "tools", title: "Tools & Data", description: "Your current setup" },
  { id: 7, key: "ai", title: "AI & Automation", description: "How AI can help you" },
  { id: 8, key: "budget", title: "Budget & Resources", description: "Planning your investment" },
  { id: 9, key: "additional", title: "Anything Else", description: "Final thoughts" },
];
