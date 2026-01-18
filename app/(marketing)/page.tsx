import Link from "next/link";

/* ═══════════════════════════════════════════════════════════════════════════
   OpenPeople.ai Landing Page
   A distinctive, bold design showcasing AI-powered commerce infrastructure
   ═══════════════════════════════════════════════════════════════════════════ */

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--void)] relative overflow-hidden">
      {/* Background grid */}
      <div className="fixed inset-0 bg-grid pointer-events-none" />

      {/* Ambient glows */}
      <div className="glow-lime top-[-200px] left-[-200px] opacity-30 animate-pulse-glow" />
      <div className="glow-cyan top-[40%] right-[-300px] opacity-20 animate-pulse-glow delay-200" />
      <div className="glow-lime bottom-[-200px] left-[30%] opacity-20 animate-pulse-glow delay-400" />

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
  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div className="container">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-lg bg-[var(--electric-lime)] flex items-center justify-center transition-transform group-hover:scale-105">
              <svg
                className="w-5 h-5 text-[var(--void)]"
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
            <span className="text-xl font-semibold text-[var(--text-primary)]">
              OpenPeople<span className="text-[var(--electric-lime)]">.ai</span>
            </span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="#features"
              className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              How it works
            </Link>
            <Link
              href="#pricing"
              className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/docs"
              className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Docs
            </Link>
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden sm:inline-flex text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors px-4 py-2"
            >
              Sign in
            </Link>
            <Link href="/signup" className="btn-primary text-sm">
              Get started
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
          </div>
        </div>
      </div>
    </nav>
  );
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
            Commerce infrastructure{" "}
            <span className="text-gradient-lime italic">powered by AI</span>
          </h1>

          {/* Subhead */}
          <p className="mt-8 text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed animate-slide-up delay-100">
            Tailored AI solutions for businesses across every industry. We help
            you align your operations with intelligent automation, so you can
            focus on what matters most—growing your business.
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
              Trusted by forward-thinking businesses
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
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
      ),
      title: "AI Inventory Intelligence",
      description:
        "Predictive stock management that learns from your sales patterns. Get restock alerts before you run out, optimize pricing automatically, and reduce dead stock by 40%.",
      highlight: "40% less dead stock",
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
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      ),
      title: "Intelligent Customer Chat",
      description:
        "AI-powered conversations that understand product queries, check inventory in real-time, and close sales 24/7. Seamless handoff to human agents when needed.",
      highlight: "24/7 sales automation",
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
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
      title: "Predictive Analytics",
      description:
        "See the future of your business. Demand forecasting, trend detection, and customer behavior insights powered by machine learning trained on millions of transactions.",
      highlight: "ML-powered forecasting",
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
            d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      title: "Multi-Tenant Platform",
      description:
        "Launch unlimited storefronts from one dashboard. Each tenant gets isolated data, custom domains, white-label branding, and their own AI configuration.",
      highlight: "Unlimited storefronts",
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
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
      ),
      title: "Flexible Payments",
      description:
        "Accept cards via Stripe, crypto via NOWPayments, and local payment methods. Split payments, subscriptions, and automated payouts built in.",
      highlight: "Cards + Crypto",
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
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
      title: "Real-Time Operations",
      description:
        "Live inventory sync, instant order notifications, real-time staff tracking, and presence indicators. Built on Supabase for sub-100ms updates.",
      highlight: "<100ms latency",
    },
  ];

  return (
    <section id="features" className="py-24 md:py-32 relative">
      <div className="container">
        {/* Section header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="badge mb-4">Features</span>
          <h2 className="text-4xl md:text-5xl font-display leading-tight">
            Everything you need to{" "}
            <span className="text-gradient-lime italic">scale commerce</span>
          </h2>
          <p className="mt-6 text-lg text-[var(--text-secondary)]">
            A complete platform that grows with your business. From solo
            operators to enterprise retailers.
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
      title: "Connect your store",
      description:
        "Import existing inventory or start fresh. Connect Shopify, WooCommerce, or use our API. Setup takes under 10 minutes.",
    },
    {
      number: "02",
      title: "Configure AI features",
      description:
        "Enable the AI modules you need. Set pricing rules, chat personality, and analytics dashboards. Everything is customizable.",
    },
    {
      number: "03",
      title: "Launch & scale",
      description:
        "Go live with your custom domain. Add team members, create additional storefronts, and watch your AI assistant learn and improve.",
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
            From zero to AI-powered{" "}
            <span className="text-gradient-violet italic">in minutes</span>
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
      description: "Perfect for solo operators and small shops",
      features: [
        "1 storefront",
        "Up to 500 products",
        "AI inventory alerts",
        "Basic analytics",
        "Email support",
      ],
      cta: "Start free trial",
      highlighted: false,
    },
    {
      name: "Pro",
      price: "$199",
      period: "/month",
      description: "For growing businesses ready to scale",
      features: [
        "5 storefronts",
        "Unlimited products",
        "Full AI suite",
        "Advanced analytics",
        "AI chat assistant",
        "Priority support",
        "Custom domain",
      ],
      cta: "Start free trial",
      highlighted: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      description: "For large operations with custom needs",
      features: [
        "Unlimited storefronts",
        "Unlimited everything",
        "Custom AI training",
        "Dedicated success manager",
        "SLA guarantee",
        "On-premise option",
        "Custom integrations",
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
            Simple, transparent{" "}
            <span className="text-gradient-lime italic">pricing</span>
          </h2>
          <p className="mt-6 text-lg text-[var(--text-secondary)]">
            Start free for 14 days. No credit card required. Cancel anytime.
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
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--electric-lime)]/5 via-[var(--electric-cyan)]/5 to-[var(--electric-violet)]/5" />
      <div className="glow-lime top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20" />

      <div className="container relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-display leading-tight">
            Ready to transform your{" "}
            <span className="text-gradient-lime italic">business?</span>
          </h2>
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
              Talk to sales
            </Link>
          </div>
          <p className="mt-6 text-sm text-[var(--text-muted)]">
            14-day free trial · No credit card required · Cancel anytime
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
    <footer className="py-16 border-t border-[var(--border-subtle)]">
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
              AI-powered commerce infrastructure for ambitious retail brands.
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
