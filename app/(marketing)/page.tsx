"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
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
    <section className="relative pt-24 pb-16 sm:pt-32 sm:pb-20 md:pt-40 md:pb-24 lg:pt-52 lg:pb-32">
      <div className="container relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex animate-fade-in">
            <span className="badge text-[10px] sm:text-xs">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[var(--electric-lime)] animate-pulse" />
              Now in public beta
            </span>
          </div>

          {/* Headline - Mobile-first sizing */}
          <h1 className="mt-6 sm:mt-8 text-[2rem] leading-[1.1] sm:text-4xl md:text-5xl lg:text-7xl xl:text-8xl font-display tracking-tight animate-slide-up">
            Human-centric AI{" "}
            <span className="text-gradient-lime italic block sm:inline">for your business</span>
          </h1>

          {/* Subhead - Better mobile readability */}
          <p className="mt-5 sm:mt-6 md:mt-8 text-base sm:text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed animate-slide-up delay-100 px-2 sm:px-0">
            We&apos;re here to help you and your business prepare for the future. 
            Your data stays safe, useful, and—most importantly—yours.
          </p>

          {/* CTAs - Full width on mobile */}
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 animate-slide-up delay-200">
            <Link href="/signup" className="btn-primary w-full sm:w-auto justify-center">
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
            <Link href="#demo" className="btn-secondary w-full sm:w-auto justify-center">
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

          {/* Social proof - Responsive */}
          <div className="mt-12 sm:mt-16 pt-6 sm:pt-8 border-t border-[var(--border-subtle)] animate-fade-in delay-300">
            <p className="text-xs sm:text-sm text-[var(--text-muted)] mb-3 sm:mb-4">
              Trusted by businesses preparing for tomorrow
            </p>
            <div className="flex items-center justify-center gap-6 sm:gap-12 md:gap-16 opacity-60">
              {["709exclusive", "snōw white laundry"].map((name) => (
                <span
                  key={name}
                  className="text-sm sm:text-lg font-semibold text-[var(--text-muted)]"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Hero visual - Responsive aspect ratio */}
        <div className="mt-12 sm:mt-16 md:mt-20 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--void)] via-transparent to-transparent z-10 pointer-events-none" />
          <div className="glass-card p-0.5 sm:p-1 rounded-xl sm:rounded-2xl overflow-hidden">
            <div className="relative aspect-[4/3] sm:aspect-[16/10] md:aspect-[16/9] rounded-lg sm:rounded-xl bg-[var(--surface-1)] overflow-hidden">
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
   Reflects actual OpenPeople.ai platform features
   ═══════════════════════════════════════════════════════════════════════════ */

function DashboardMockup() {
  return (
    <div className="absolute inset-0 p-4 md:p-6">
      {/* Top bar - macOS style */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
          <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
          <div className="w-3 h-3 rounded-full bg-[#28c840]" />
          <span className="ml-4 text-xs text-[var(--text-muted)] hidden sm:block">
            mars.openpeople.ai/admin
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--surface-2)] text-xs text-[var(--text-muted)]">
            <span className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse" />
            AI Team Online
          </div>
        </div>
      </div>

      {/* Dashboard grid */}
      <div className="grid grid-cols-12 gap-3 h-[calc(100%-48px)]">
        {/* Sidebar */}
        <div className="col-span-2 hidden md:flex flex-col gap-1">
          {[
            { name: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", active: true },
            { name: "AI Team", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
            { name: "Notes", icon: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" },
            { name: "Workflows", icon: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
            { name: "Email", icon: "M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75", badge: "3" },
            { name: "Vault", icon: "M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" },
          ].map((item) => (
            <div
              key={item.name}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${
                item.active
                  ? "bg-[var(--electric-lime)] text-[var(--void)] font-medium"
                  : "text-[var(--text-muted)] hover:bg-[var(--surface-2)]"
              }`}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
              <span className="truncate">{item.name}</span>
              {item.badge && (
                <span className="ml-auto px-1.5 py-0.5 rounded-full bg-[var(--error)] text-[8px] text-white font-medium">
                  {item.badge}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className="col-span-12 md:col-span-7 space-y-3 overflow-hidden">
          {/* Stats row */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Active Tasks", value: "12", icon: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z", color: "var(--electric-lime)" },
              { label: "Notes", value: "847", icon: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5", color: "var(--electric-cyan)" },
              { label: "Vault Files", value: "156", icon: "M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75", color: "var(--warning)" },
              { label: "AI Chats", value: "23", icon: "M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375", color: "#8B5CF6" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border-subtle)]"
              >
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-3.5 h-3.5" style={{ color: stat.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={stat.icon} />
                  </svg>
                  <p className="text-[10px] text-[var(--text-muted)] truncate">{stat.label}</p>
                </div>
                <p className="text-lg font-semibold">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* AI Team section */}
          <div className="rounded-xl bg-[var(--surface-2)] border border-[var(--border-subtle)] p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-[var(--electric-cyan)] to-[var(--electric-lime)] flex items-center justify-center">
                  <svg className="w-3 h-3 text-[var(--void)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="text-sm font-medium">AI Team</p>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--success)]/10 text-[var(--success)]">
                2 active, 2 beta
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { name: "Chief of Staff", status: "Ready", statusColor: "var(--success)", desc: "Weekly planning" },
                { name: "Ops Worker", status: "Working", statusColor: "var(--electric-lime)", desc: "3 tasks queued" },
                { name: "Researcher", status: "Beta", statusColor: "var(--warning)", desc: "Knowledge capture" },
              ].map((worker) => (
                <div key={worker.name} className="p-2.5 rounded-lg bg-[var(--surface-3)] border border-[var(--border-subtle)]">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-medium truncate">{worker.name}</p>
                    <span 
                      className="w-1.5 h-1.5 rounded-full" 
                      style={{ backgroundColor: worker.statusColor }}
                    />
                  </div>
                  <p className="text-[10px] text-[var(--text-muted)]">{worker.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent activity / tasks */}
          <div className="rounded-xl bg-[var(--surface-2)] border border-[var(--border-subtle)] p-4 flex-1">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium">This Week&apos;s Focus</p>
              <span className="text-[10px] text-[var(--text-muted)]">Generated by Chief of Staff</span>
            </div>
            <div className="space-y-2">
              {[
                { task: "Ship onboarding flow improvements", due: "Wed", priority: "high", done: false },
                { task: "Review Q1 analytics dashboard", due: "Thu", priority: "medium", done: false },
                { task: "Investor update email draft", due: "Fri", priority: "high", done: false },
                { task: "Set up email domain verification", due: "Today", priority: "medium", done: true },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--surface-3)] transition-colors">
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                    item.done 
                      ? "bg-[var(--electric-lime)] border-[var(--electric-lime)]" 
                      : "border-[var(--border-medium)]"
                  }`}>
                    {item.done && (
                      <svg className="w-2.5 h-2.5 text-[var(--void)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className={`flex-1 text-xs ${item.done ? "text-[var(--text-muted)] line-through" : ""}`}>
                    {item.task}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    item.priority === "high" 
                      ? "bg-[var(--error)]/10 text-[var(--error)]" 
                      : "bg-[var(--surface-3)] text-[var(--text-muted)]"
                  }`}>
                    {item.due}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right sidebar - AI Chat */}
        <div className="col-span-12 md:col-span-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border-subtle)] p-3 flex flex-col">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[var(--border-subtle)]">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#EC4899] flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium">AI Chat</p>
              <p className="text-[10px] text-[var(--text-muted)]">Context-aware assistant</p>
            </div>
          </div>
          <div className="flex-1 space-y-2 overflow-hidden text-xs">
            <div className="p-2.5 rounded-lg bg-[var(--surface-3)] text-[var(--text-secondary)]">
              <p className="text-[10px] text-[var(--text-muted)] mb-1">You</p>
              What&apos;s the status on the onboarding improvements?
            </div>
            <div className="p-2.5 rounded-lg bg-gradient-to-br from-[var(--electric-lime)]/10 to-[var(--electric-cyan)]/5 border border-[var(--electric-lime)]/20">
              <p className="text-[10px] text-[var(--electric-lime)] mb-1">AI</p>
              <p className="text-[var(--text-primary)]">
                Based on your notes from yesterday, the onboarding flow is 80% complete. The Ops Worker created 3 follow-up tasks for the remaining work.
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-[var(--surface-3)] text-[var(--text-secondary)]">
              <p className="text-[10px] text-[var(--text-muted)] mb-1">You</p>
              Add those to my focus for this week
            </div>
            <div className="p-2.5 rounded-lg bg-gradient-to-br from-[var(--electric-lime)]/10 to-[var(--electric-cyan)]/5 border border-[var(--electric-lime)]/20">
              <p className="text-[10px] text-[var(--electric-lime)] mb-1">AI</p>
              <p className="text-[var(--text-primary)]">
                Done. I&apos;ve added the 3 onboarding tasks to your weekly focus and notified Chief of Staff to update the plan.
              </p>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-[var(--border-subtle)]">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ask about your work..."
                className="flex-1 px-3 py-2 rounded-lg bg-[var(--surface-3)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] border-0 outline-none"
              />
              <button className="p-2 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] hover:opacity-90 transition-opacity">
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
                    d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                  />
                </svg>
              </button>
            </div>
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
    <section id="features" className="py-16 sm:py-20 md:py-24 lg:py-32 relative">
      <div className="container">
        {/* Section header */}
        <div className="max-w-3xl mx-auto text-center mb-10 sm:mb-12 md:mb-16">
          <span className="badge mb-3 sm:mb-4 text-[10px] sm:text-xs">Why OpenPeople</span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display leading-tight">
            AI that works{" "}
            <span className="text-gradient-lime italic">for people</span>
          </h2>
          <p className="mt-4 sm:mt-6 text-sm sm:text-base md:text-lg text-[var(--text-secondary)] px-2 sm:px-0">
            We believe technology should empower humans, not replace them. 
            Our tools are designed with your success—and your values—in mind.
          </p>
        </div>

        {/* Features grid - Mobile: 1 col, Tablet: 2 col, Desktop: 3 col */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="feature-card group"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Icon */}
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-[var(--surface-2)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--electric-lime)] mb-4 sm:mb-5 group-hover:bg-[var(--electric-lime)] group-hover:text-[var(--void)] transition-all duration-300">
                <div className="w-5 h-5 sm:w-6 sm:h-6">{feature.icon}</div>
              </div>

              {/* Content */}
              <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">{feature.title}</h3>
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-3 sm:mb-4">
                {feature.description}
              </p>

              {/* Highlight badge */}
              <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-medium text-[var(--electric-lime)]">
                <svg
                  className="w-3 h-3 sm:w-3.5 sm:h-3.5"
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
      className="py-16 sm:py-20 md:py-24 lg:py-32 relative bg-[var(--surface-1)]"
    >
      {/* Background accent */}
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--void)] via-transparent to-[var(--void)] pointer-events-none" />

      <div className="container relative z-10">
        {/* Section header */}
        <div className="max-w-3xl mx-auto text-center mb-10 sm:mb-12 md:mb-16">
          <span className="badge mb-3 sm:mb-4 text-[10px] sm:text-xs">How it works</span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display leading-tight">
            Your pace, your{" "}
            <span className="text-gradient-violet italic">terms</span>
          </h2>
        </div>

        {/* Steps - Mobile optimized */}
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {/* Connecting line - visible on larger screens */}
            <div className="absolute left-6 sm:left-7 md:left-8 top-0 bottom-0 w-px bg-gradient-to-b from-[var(--electric-lime)] via-[var(--electric-cyan)] to-[var(--electric-violet)] hidden sm:block" />

            {/* Step items */}
            <div className="space-y-8 sm:space-y-10 md:space-y-12">
              {steps.map((step, index) => (
                <div key={step.number} className="flex gap-4 sm:gap-6 md:gap-8 items-start">
                  {/* Number */}
                  <div className="relative z-10 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl bg-[var(--surface-2)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0">
                    <span className="text-lg sm:text-xl md:text-2xl font-display text-gradient-lime">
                      {step.number}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="pt-1 sm:pt-2 flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl md:text-2xl font-semibold mb-2 sm:mb-3">{step.title}</h3>
                    <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed">
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
    <section id="pricing" className="py-16 sm:py-20 md:py-24 lg:py-32 relative">
      <div className="container">
        {/* Section header */}
        <div className="max-w-3xl mx-auto text-center mb-10 sm:mb-12 md:mb-16">
          <span className="badge mb-3 sm:mb-4 text-[10px] sm:text-xs">Pricing</span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display leading-tight">
            Honest, transparent{" "}
            <span className="text-gradient-lime italic">pricing</span>
          </h2>
          <p className="mt-4 sm:mt-6 text-sm sm:text-base md:text-lg text-[var(--text-secondary)] px-2 sm:px-0">
            No hidden fees, no surprise costs. Start free for 14 days and cancel anytime.
          </p>
        </div>

        {/* Pricing cards - Swipeable on mobile */}
        <div className="max-w-5xl mx-auto">
          {/* Mobile: horizontal scroll, Tablet+: grid */}
          <div className="flex md:grid md:grid-cols-3 gap-4 sm:gap-5 md:gap-6 overflow-x-auto md:overflow-visible snap-x snap-mandatory md:snap-none pb-4 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
            {plans.map((plan, index) => (
              <div
                key={plan.name}
                className={`relative rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-8 snap-center shrink-0 w-[85vw] sm:w-[70vw] md:w-auto ${
                  plan.highlighted
                    ? "bg-gradient-to-b from-[var(--electric-lime)]/10 to-transparent border-2 border-[var(--electric-lime)]/30"
                    : "bg-[var(--surface-1)] border border-[var(--border-subtle)]"
                }`}
              >
                {/* Popular badge */}
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 rounded-full bg-[var(--electric-lime)] text-[var(--void)] text-[10px] sm:text-xs font-bold whitespace-nowrap">
                      Most popular
                    </span>
                  </div>
                )}

                {/* Plan name */}
                <h3 className="text-lg sm:text-xl font-semibold">{plan.name}</h3>

                {/* Price */}
                <div className="mt-3 sm:mt-4 flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-bold">{plan.price}</span>
                  <span className="text-sm sm:text-base text-[var(--text-muted)]">{plan.period}</span>
                </div>

                {/* Description */}
                <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-[var(--text-secondary)]">
                  {plan.description}
                </p>

                {/* Features */}
                <ul className="mt-5 sm:mt-6 space-y-2 sm:space-y-3">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm text-[var(--text-secondary)]"
                    >
                      <svg
                        className="w-4 h-4 text-[var(--electric-lime)] shrink-0 mt-0.5"
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
                  className={`mt-6 sm:mt-8 w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-sm sm:text-base transition-all active:scale-[0.98] ${
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
          
          {/* Mobile scroll indicator */}
          <div className="flex justify-center gap-2 mt-4 md:hidden">
            {plans.map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full bg-[var(--surface-3)]" />
            ))}
          </div>
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
    <section className="py-16 sm:py-20 md:py-24 lg:py-32 relative overflow-x-visible overflow-y-hidden">
      <div className="container relative z-10">
        <div className="max-w-3xl mx-auto text-center px-2 sm:px-0">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-display leading-tight">
            Ready to prepare your business{" "}
            <span className="text-gradient-lime italic block sm:inline">for the future?</span>
          </h2>
          <p className="mt-4 sm:mt-6 text-sm sm:text-base md:text-lg text-[var(--text-secondary)] max-w-xl mx-auto">
            Join a community of forward-thinking businesses who believe AI should serve people, not the other way around.
          </p>
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4">
            <Link href="/signup" className="btn-primary w-full sm:w-auto justify-center">
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
            <Link href="/contact" className="btn-secondary w-full sm:w-auto justify-center">
              Talk to us
            </Link>
          </div>
          <p className="mt-5 sm:mt-6 text-xs sm:text-sm text-[var(--text-muted)]">
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
    <footer className="py-10 sm:py-12 md:py-16 border-t border-[var(--border-subtle)] relative z-10 pb-[max(2.5rem,env(safe-area-inset-bottom))]">
      <div className="container">
        {/* Mobile: stacked, Desktop: grid */}
        <div className="space-y-8 sm:space-y-0 sm:grid sm:grid-cols-2 md:grid-cols-5 sm:gap-8">
          {/* Brand */}
          <div className="sm:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2">
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
              <span className="text-base sm:text-lg font-semibold">
                OpenPeople<span className="text-[var(--electric-lime)]">.ai</span>
              </span>
            </Link>
            <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-[var(--text-muted)] max-w-xs">
              Human-centric AI solutions. Your data stays safe, useful, and yours.
              <span className="block mt-2">
                Based in St. John&apos;s, Newfoundland.
              </span>
            </p>
          </div>

          {/* Links - 2x2 grid on mobile, 3 columns on tablet+ */}
          <div className="grid grid-cols-2 sm:grid-cols-1 md:contents gap-6 sm:gap-8">
            <div>
              <h4 className="font-semibold mb-3 sm:mb-4 text-xs sm:text-sm">Product</h4>
              <ul className="space-y-2 sm:space-y-2">
                {[
                  { label: "Features", href: "/#features" },
                  { label: "Pricing", href: "/pricing" },
                  { label: "Integrations", href: "/integrations" },
                  { label: "Changelog", href: "/changelog" },
                ].map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-xs sm:text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors py-1 inline-block"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3 sm:mb-4 text-xs sm:text-sm">Resources</h4>
              <ul className="space-y-2 sm:space-y-2">
                {["Documentation", "API Reference", "Blog", "Support"].map(
                  (link) => (
                    <li key={link}>
                      <Link
                        href={`/${link.toLowerCase().replace(" ", "-")}`}
                        className="text-xs sm:text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors py-1 inline-block"
                      >
                        {link}
                      </Link>
                    </li>
                  )
                )}
              </ul>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <h4 className="font-semibold mb-3 sm:mb-4 text-xs sm:text-sm">Company</h4>
              <ul className="flex flex-wrap sm:block gap-x-4 sm:gap-0 sm:space-y-2">
                {["Careers", "About", "Privacy", "Terms"].map((link) => (
                  <li key={link}>
                    <Link
                      href={`/${link.toLowerCase()}`}
                      className="text-xs sm:text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors py-1 inline-block"
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 sm:mt-10 md:mt-12 pt-6 sm:pt-8 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs sm:text-sm text-[var(--text-muted)] text-center sm:text-left">
            © {new Date().getFullYear()} OpenPeople.ai. All rights reserved.
          </p>
          <div className="flex items-center gap-5 sm:gap-4">
            {/* Social links - larger touch targets on mobile */}
            {[
              {
                name: "GitHub",
                href: "https://github.com/OpenPeopleStudio/open_people",
                icon: "M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z",
              },
            ].map((social) => (
              <Link
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 -m-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
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
  const [stars, setStars] = useState<Array<{
    id: number;
    angle: number;
    distance: number;
    size: number;
    opacity: number;
    twinkleDuration: number;
    delay: number;
  }>>([]);

  const [bgStars, setBgStars] = useState<Array<{
    id: number;
    cx: number;
    cy: number;
    r: number;
    opacity: number;
  }>>([]);

  const [reducedMotion, setReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check for reduced motion preference
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(motionQuery.matches);
    const handleMotionChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    motionQuery.addEventListener("change", handleMotionChange);

    // Check for mobile viewport
    const mobileQuery = window.matchMedia("(max-width: 768px)");
    setIsMobile(mobileQuery.matches);
    const handleMobileChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mobileQuery.addEventListener("change", handleMobileChange);

    return () => {
      motionQuery.removeEventListener("change", handleMotionChange);
      mobileQuery.removeEventListener("change", handleMobileChange);
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      // Reduce star count on mobile for performance
      const starCount = isMobile ? 80 : 250;
      const bgStarCount = isMobile ? 30 : 100;

      // Generate distant stars - smaller sizes for depth
      const newStars = Array.from({ length: starCount }, (_, i) => ({
        id: i,
        // Position stars in a circular pattern from center
        angle: Math.random() * 360,
        distance: Math.random() * 60 + 20, // 20-80% from center
        size: Math.random() * 1 + 0.3,
        opacity: Math.random() * 0.5 + 0.2,
        twinkleDuration: Math.random() * 4 + 2,
        delay: Math.random() * 3,
      }));
      setStars(newStars);

      const newBgStars = Array.from({ length: bgStarCount }, (_, i) => ({
        id: i,
        cx: Math.random() * 100,
        cy: Math.random() * 100,
        r: Math.random() * 0.5 + 0.2,
        opacity: Math.random() * 0.3 + 0.1,
      }));
      setBgStars(newBgStars);
    }, 0);
    return () => clearTimeout(timer);
  }, [isMobile]);

  // Skip animations entirely if user prefers reduced motion
  if (reducedMotion) {
    return (
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#050508] via-[var(--void)] to-[#050508]" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Base dark gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#050508] via-[var(--void)] to-[#050508]" />
      
      {/* Orbiting star container - slower on mobile */}
      <div 
        className="absolute inset-0 animate-orbit"
        style={{ 
          animationDuration: isMobile ? '400s' : '300s',
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
                className={isMobile ? "" : "animate-twinkle"}
                style={isMobile ? undefined : {
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
        {bgStars.map((star) => (
          <circle
            key={`bg-${star.id}`}
            cx={`${star.cx}%`}
            cy={`${star.cy}%`}
            r={star.r}
            fill="white"
            opacity={star.opacity}
          />
        ))}
      </svg>
    </div>
  );
}
