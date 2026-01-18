import Link from "next/link";
import NavBar from "@/components/NavBar";

/* ═══════════════════════════════════════════════════════════════════════════
   OpenPeople.ai Landing Page
   A distinctive, bold design showcasing AI-powered commerce infrastructure
   ═══════════════════════════════════════════════════════════════════════════ */

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--void)] relative overflow-hidden">
      {/* Starfield background */}
      <Starfield />

      {/* Navigation */}
      <Navigation />

      {/* Hero Section */}
      <HeroSection />

      {/* Features Section */}
      <FeaturesSection />

      {/* How It Works */}
      <HowItWorksSection />

      {/* Pricing Section */}
      <PricingSection />

      {/* CTA Section */}
      <CTASection />

      {/* Footer */}
      <Footer />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Navigation
   ═══════════════════════════════════════════════════════════════════════════ */

function Navigation() {
  return <NavBar />;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Hero Section
   ═══════════════════════════════════════════════════════════════════════════ */

function HeroSection() {
  return (
    <section className="relative pt-40 pb-24 md:pt-52 md:pb-32">
      <div className="container relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex animate-fade-in">
            <span className="badge">
              <span className="w-2 h-2 rounded-full bg-[var(--electric-lime)] animate-pulse" />
              Now in public beta
            </span>
          </div>

          {/* Headline */}
          <h1 className="mt-8 text-5xl md:text-7xl lg:text-8xl font-display leading-[0.95] tracking-tight animate-slide-up">
            Human-centric AI{" "}
            <span className="text-gradient-lime italic">for your business</span>
          </h1>

          {/* Subhead */}
          <p className="mt-8 text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed animate-slide-up delay-100">
            We&apos;re here to help you and your business prepare for the future. 
            Your data stays safe, useful, and—most importantly—yours. Customizable 
            AI tools built around people, not the other way around.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up delay-200">
            <Link href="/signup" className="btn-primary">
              Start free trial
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
            <Link href="#demo" className="btn-secondary">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Watch demo
            </Link>
          </div>

          {/* Social proof */}
          <div className="mt-16 pt-8 border-t border-[var(--border-subtle)] animate-fade-in delay-300">
            <p className="text-sm text-[var(--text-muted)] mb-4">
              Trusted by businesses preparing for tomorrow
            </p>
            <div className="flex items-center justify-center gap-12 md:gap-16 opacity-60">
              {["709exclusive", "snōw white laundry"].map((name) => (
                <span
                  key={name}
                  className="text-lg font-semibold text-[var(--text-muted)]"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Hero visual - Abstract 3D element */}
        <div className="mt-20 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--void)] via-transparent to-transparent z-10 pointer-events-none" />
          <div className="glass-card p-1 rounded-2xl overflow-hidden">
            <div className="relative aspect-[16/9] rounded-xl bg-[var(--surface-1)] overflow-hidden">
              {/* Dashboard preview mockup */}
              <DashboardMockup />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Dashboard Mockup Component
   ═══════════════════════════════════════════════════════════════════════════ */

function DashboardMockup() {
  return (
    <div className="absolute inset-0 p-6 md:p-8">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-[var(--error)]" />
          <div className="w-3 h-3 rounded-full bg-[var(--warning)]" />
          <div className="w-3 h-3 rounded-full bg-[var(--success)]" />
        </div>
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--surface-2)] text-xs text-[var(--text-muted)]">
          <span className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse" />
          AI Active
        </div>
      </div>

      {/* Dashboard grid */}
      <div className="grid grid-cols-12 gap-4 h-[calc(100%-60px)]">
        {/* Sidebar */}
        <div className="col-span-2 hidden md:flex flex-col gap-2">
          {["Dashboard", "Inventory", "Orders", "Chat", "Analytics"].map(
            (item, i) => (
              <div
                key={item}
                className={`px-3 py-2 rounded-lg text-sm ${
                  i === 0
                    ? "bg-[var(--electric-lime)] text-[var(--void)] font-medium"
                    : "text-[var(--text-muted)]"
                }`}
              >
                {item}
              </div>
            )
          )}
        </div>

        {/* Main content */}
        <div className="col-span-12 md:col-span-7 space-y-4">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Revenue", value: "$24,892", change: "+12.5%" },
              { label: "Orders", value: "1,284", change: "+8.2%" },
              { label: "Conversion", value: "3.42%", change: "+0.8%" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border-subtle)]"
              >
                <p className="text-xs text-[var(--text-muted)]">{stat.label}</p>
                <p className="text-xl font-semibold mt-1">{stat.value}</p>
                <p className="text-xs text-[var(--success)] mt-1">
                  {stat.change}
                </p>
              </div>
            ))}
          </div>

          {/* Chart placeholder */}
          <div className="flex-1 rounded-xl bg-[var(--surface-2)] border border-[var(--border-subtle)] p-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium">Revenue Overview</p>
              <div className="flex gap-2">
                {["7d", "30d", "90d"].map((period, i) => (
                  <button
                    key={period}
                    className={`px-2 py-1 rounded text-xs ${
                      i === 1
                        ? "bg-[var(--surface-3)] text-[var(--text-primary)]"
                        : "text-[var(--text-muted)]"
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>
            {/* Fake chart bars */}
            <div className="flex items-end gap-2 h-32">
              {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t bg-gradient-to-t from-[var(--electric-lime)] to-[var(--electric-cyan)] opacity-80"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right sidebar - AI Chat */}
        <div className="col-span-12 md:col-span-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border-subtle)] p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[var(--electric-lime)] to-[var(--electric-cyan)]" />
            <p className="text-sm font-medium">AI Assistant</p>
          </div>
          <div className="flex-1 space-y-3 overflow-hidden">
            <div className="p-3 rounded-lg bg-[var(--surface-3)] text-xs text-[var(--text-secondary)]">
              Your Jordan 4 Bred stock is running low. Based on current demand,
              I recommend restocking 24 units.
            </div>
            <div className="p-3 rounded-lg bg-[var(--electric-lime)]/10 border border-[var(--electric-lime)]/20 text-xs text-[var(--text-primary)]">
              3 customers are waiting for size 10. Should I notify them when
              restocked?
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <input
              type="text"
              placeholder="Ask anything..."
              className="flex-1 px-3 py-2 rounded-lg bg-[var(--surface-3)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] border-0 outline-none"
            />
            <button className="p-2 rounded-lg bg-[var(--electric-lime)] text-[var(--void)]">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Features Section
   ═══════════════════════════════════════════════════════════════════════════ */

function FeaturesSection() {
  const features = [
    {
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
          />
        </svg>
      ),
      title: "Your Data, Your Control",
      description:
        "We keep your data safe, useful, and most importantly—yours. Full ownership, transparent practices, and no hidden data harvesting. Your business intelligence stays with you.",
      highlight: "100% data ownership",
    },
    {
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"
          />
        </svg>
      ),
      title: "Customizable AI Tools",
      description:
        "No one-size-fits-all solutions here. Configure AI modules to match your specific workflow, industry, and goals. From inventory to analytics—it adapts to you, not the other way around.",
      highlight: "Built for your needs",
    },
    {
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
          />
        </svg>
      ),
      title: "Collective Strength",
      description:
        "Businesses with shared goals can pool resources to amplify their impact. Join a network of like-minded operators who lift each other up while maintaining independence.",
      highlight: "Stronger together",
    },
    {
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
          />
        </svg>
      ),
      title: "Human-Centric Design",
      description:
        "AI should serve people, not replace them. Our tools augment human decision-making, preserve jobs, and keep you in control. Technology that respects your expertise.",
      highlight: "People first",
    },
    {
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
          />
        </svg>
      ),
      title: "Future-Ready Operations",
      description:
        "Prepare your business for what's next. We help you adopt AI thoughtfully and sustainably—no hype, no disruption for disruption's sake. Just practical tools for real challenges.",
      highlight: "Built for tomorrow",
    },
    {
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z"
          />
        </svg>
      ),
      title: "Transparent & Ethical",
      description:
        "No black boxes. Understand how our AI makes recommendations, why it suggests what it does, and maintain full audit trails. Ethical AI you can trust and explain.",
      highlight: "No hidden agendas",
    },
  ];

  return (
    <section id="features" className="py-24 md:py-32 relative">
      <div className="container">
        {/* Section header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="badge mb-4">Why OpenPeople</span>
          <h2 className="text-4xl md:text-5xl font-display leading-tight">
            AI that works{" "}
            <span className="text-gradient-lime italic">for people</span>
          </h2>
          <p className="mt-6 text-lg text-[var(--text-secondary)]">
            We believe technology should empower humans, not replace them. 
            Our tools are designed with your success—and your values—in mind.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="feature-card group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Icon */}
              <div className="w-12 h-12 rounded-xl bg-[var(--surface-2)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--electric-lime)] mb-5 group-hover:bg-[var(--electric-lime)] group-hover:text-[var(--void)] transition-all duration-300">
                {feature.icon}
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-4">
                {feature.description}
              </p>

              {/* Highlight badge */}
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--electric-lime)]">
                <svg
                  className="w-3.5 h-3.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                {feature.highlight}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   How It Works Section
   ═══════════════════════════════════════════════════════════════════════════ */

function HowItWorksSection() {
  const steps = [
    {
      number: "01",
      title: "Tell us about your business",
      description:
        "Share your goals, challenges, and how you work today. We listen first—understanding your needs before recommending any solutions.",
    },
    {
      number: "02",
      title: "Customize your AI toolkit",
      description:
        "Choose the modules that make sense for you. Every feature is optional, configurable, and designed to complement—not complicate—your existing workflow.",
    },
    {
      number: "03",
      title: "Grow with confidence",
      description:
        "Launch when you're ready. Your data stays yours, your team stays empowered, and you're prepared for whatever comes next.",
    },
  ];

  return (
    <section
      id="how-it-works"
      className="py-24 md:py-32 relative bg-[var(--surface-1)]"
    >
      {/* Background accent */}
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--void)] via-transparent to-[var(--void)] pointer-events-none" />

      <div className="container relative z-10">
        {/* Section header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="badge mb-4">How it works</span>
          <h2 className="text-4xl md:text-5xl font-display leading-tight">
            Your pace, your{" "}
            <span className="text-gradient-violet italic">terms</span>
          </h2>
        </div>

        {/* Steps */}
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {/* Connecting line */}
            <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-[var(--electric-lime)] via-[var(--electric-cyan)] to-[var(--electric-violet)] hidden md:block" />

            {/* Step items */}
            <div className="space-y-12">
              {steps.map((step, index) => (
                <div key={step.number} className="flex gap-8 items-start">
                  {/* Number */}
                  <div className="relative z-10 w-16 h-16 rounded-2xl bg-[var(--surface-2)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0">
                    <span className="text-2xl font-display text-gradient-lime">
                      {step.number}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="pt-2">
                    <h3 className="text-2xl font-semibold mb-3">{step.title}</h3>
                    <p className="text-[var(--text-secondary)] leading-relaxed max-w-xl">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Pricing Section
   ═══════════════════════════════════════════════════════════════════════════ */

function PricingSection() {
  const plans = [
    {
      name: "Starter",
      price: "$99",
      period: "/month",
      description: "For businesses taking their first step into AI",
      features: [
        "Core AI tools",
        "Full data ownership",
        "Basic customization",
        "Community access",
        "Email support",
      ],
      cta: "Start free trial",
      highlighted: false,
    },
    {
      name: "Pro",
      price: "$199",
      period: "/month",
      description: "For teams ready to fully embrace the future",
      features: [
        "Complete AI toolkit",
        "Advanced customization",
        "Resource pooling access",
        "Priority support",
        "Custom integrations",
        "Team collaboration",
        "Dedicated onboarding",
      ],
      cta: "Start free trial",
      highlighted: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      description: "For organizations with unique requirements",
      features: [
        "Everything in Pro",
        "Custom AI training",
        "On-premise options",
        "Dedicated success partner",
        "SLA guarantee",
        "White-label solutions",
        "Coalition leadership",
      ],
      cta: "Contact sales",
      highlighted: false,
    },
  ];

  return (
    <section id="pricing" className="py-24 md:py-32 relative">
      <div className="container">
        {/* Section header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="badge mb-4">Pricing</span>
          <h2 className="text-4xl md:text-5xl font-display leading-tight">
            Honest, transparent{" "}
            <span className="text-gradient-lime italic">pricing</span>
          </h2>
          <p className="mt-6 text-lg text-[var(--text-secondary)]">
            No hidden fees, no surprise costs. Start free for 14 days and cancel anytime.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-8 ${
                plan.highlighted
                  ? "bg-gradient-to-b from-[var(--electric-lime)]/10 to-transparent border-2 border-[var(--electric-lime)]/30"
                  : "bg-[var(--surface-1)] border border-[var(--border-subtle)]"
              }`}
            >
              {/* Popular badge */}
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 rounded-full bg-[var(--electric-lime)] text-[var(--void)] text-xs font-bold">
                    Most popular
                  </span>
                </div>
              )}

              {/* Plan name */}
              <h3 className="text-xl font-semibold">{plan.name}</h3>

              {/* Price */}
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-[var(--text-muted)]">{plan.period}</span>
              </div>

              {/* Description */}
              <p className="mt-3 text-sm text-[var(--text-secondary)]">
                {plan.description}
              </p>

              {/* Features */}
              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-3 text-sm text-[var(--text-secondary)]"
                  >
                    <svg
                      className="w-4 h-4 text-[var(--electric-lime)] shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href="/signup"
                className={`mt-8 w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-all ${
                  plan.highlighted
                    ? "bg-[var(--electric-lime)] text-[var(--void)] hover:opacity-90"
                    : "bg-[var(--surface-2)] text-[var(--text-primary)] border border-[var(--border-subtle)] hover:border-[var(--electric-lime)] hover:text-[var(--electric-lime)]"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   CTA Section
   ═══════════════════════════════════════════════════════════════════════════ */

function CTASection() {
  return (
    <section className="py-24 md:py-32 relative overflow-hidden">

      <div className="container relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-display leading-tight">
            Ready to prepare your business{" "}
            <span className="text-gradient-lime italic">for the future?</span>
          </h2>
          <p className="mt-6 text-lg text-[var(--text-secondary)] max-w-xl mx-auto">
            Join a community of forward-thinking businesses who believe AI should serve people, not the other way around.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup" className="btn-primary">
              Start your free trial
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
            <Link href="/contact" className="btn-secondary">
              Talk to us
            </Link>
          </div>
          <p className="mt-6 text-sm text-[var(--text-muted)]">
            14-day free trial · No credit card required · Your data stays yours
          </p>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Footer
   ═══════════════════════════════════════════════════════════════════════════ */

function Footer() {
  return (
    <footer className="py-16 border-t border-[var(--border-subtle)] relative z-10">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[var(--electric-lime)] flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-[var(--void)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <span className="text-lg font-semibold">
                OpenPeople<span className="text-[var(--electric-lime)]">.ai</span>
              </span>
            </Link>
            <p className="mt-4 text-sm text-[var(--text-muted)] max-w-xs">
              Human-centric AI solutions. Your data stays safe, useful, and yours.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-4 text-sm">Product</h4>
            <ul className="space-y-2">
              {["Features", "Pricing", "Integrations", "Changelog"].map(
                (link) => (
                  <li key={link}>
                    <Link
                      href={`/${link.toLowerCase()}`}
                      className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      {link}
                    </Link>
                  </li>
                )
              )}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sm">Resources</h4>
            <ul className="space-y-2">
              {["Documentation", "API Reference", "Blog", "Support"].map(
                (link) => (
                  <li key={link}>
                    <Link
                      href={`/${link.toLowerCase().replace(" ", "-")}`}
                      className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      {link}
                    </Link>
                  </li>
                )
              )}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sm">Company</h4>
            <ul className="space-y-2">
              {["About", "Careers", "Privacy", "Terms"].map((link) => (
                <li key={link}>
                  <Link
                    href={`/${link.toLowerCase()}`}
                    className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-[var(--border-subtle)] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-[var(--text-muted)]">
            © {new Date().getFullYear()} OpenPeople.ai. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {/* Social links */}
            {[
              {
                name: "Twitter",
                icon: "M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84",
              },
              {
                name: "GitHub",
                icon: "M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z",
              },
            ].map((social) => (
              <Link
                key={social.name}
                href="#"
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                <span className="sr-only">{social.name}</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d={social.icon} />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Starfield Background
   ═══════════════════════════════════════════════════════════════════════════ */

function Starfield() {
  // Generate distant stars - smaller sizes for depth
  const stars = Array.from({ length: 250 }, (_, i) => ({
    id: i,
    // Position stars in a circular pattern from center
    angle: Math.random() * 360,
    distance: Math.random() * 60 + 20, // 20-80% from center
    size: Math.random() * 1 + 0.3,
    opacity: Math.random() * 0.5 + 0.2,
    twinkleDuration: Math.random() * 4 + 2,
    delay: Math.random() * 3,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Base dark gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#050508] via-[var(--void)] to-[#050508]" />
      
      {/* Orbiting star container */}
      <div 
        className="absolute inset-0 animate-orbit"
        style={{ 
          animationDuration: '300s',
          transformOrigin: '50% 50%',
        }}
      >
        <svg className="absolute inset-0 w-full h-full">
          {stars.map((star) => {
            // Convert polar to cartesian coordinates
            const x = 50 + star.distance * Math.cos((star.angle * Math.PI) / 180);
            const y = 50 + star.distance * Math.sin((star.angle * Math.PI) / 180);
            return (
              <circle
                key={star.id}
                cx={`${x}%`}
                cy={`${y}%`}
                r={star.size}
                fill="white"
                opacity={star.opacity}
                className="animate-twinkle"
                style={{
                  animationDuration: `${star.twinkleDuration}s`,
                  animationDelay: `${star.delay}s`,
                }}
              />
            );
          })}
        </svg>
      </div>

      {/* Static background stars (very distant, don't orbit) */}
      <svg className="absolute inset-0 w-full h-full opacity-30">
        {Array.from({ length: 100 }, (_, i) => (
          <circle
            key={`bg-${i}`}
            cx={`${Math.random() * 100}%`}
            cy={`${Math.random() * 100}%`}
            r={Math.random() * 0.5 + 0.2}
            fill="white"
            opacity={Math.random() * 0.3 + 0.1}
          />
        ))}
      </svg>
    </div>
  );
}
