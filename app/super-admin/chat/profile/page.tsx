"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { 
  AIUserProfile, 
  AIUserGoal, 
  AIConversationStyle,
  CoreValue,
  Strength,
  GrowthArea,
  Passion,
} from "@/types/ai-profile";

/* ═══════════════════════════════════════════════════════════════════════════
   AI Profile Settings Page
   Customize how AI understands and communicates with you
   ═══════════════════════════════════════════════════════════════════════════ */

export default function ProfilePage() {
  const [profile, setProfile] = useState<AIUserProfile | null>(null);
  const [goals, setGoals] = useState<AIUserGoal[]>([]);
  const [styles, setStyles] = useState<{
    system_styles: AIConversationStyle[];
    custom_styles: AIConversationStyle[];
  }>({ system_styles: [], custom_styles: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"identity" | "purpose" | "strengths" | "communication" | "goals">("identity");
  
  useEffect(() => {
    loadData();
  }, []);
  
  async function loadData() {
    try {
      setLoading(true);
      
      // Load profile and goals
      const profileRes = await fetch("/api/profile");
      if (profileRes.ok) {
        const data = await profileRes.json();
        setProfile(data.profile);
        setGoals(data.goals || []);
      }
      
      // Load styles
      const stylesRes = await fetch("/api/profile/styles");
      if (stylesRes.ok) {
        const data = await stylesRes.json();
        setStyles(data);
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
    } finally {
      setLoading(false);
    }
  }
  
  async function saveProfile(updates: Partial<AIUserProfile>) {
    if (!profile) return;
    
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
      }
    } catch (err) {
      console.error("Failed to save profile:", err);
    } finally {
      setSaving(false);
    }
  }
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[var(--text-muted)]">Loading profile...</div>
      </div>
    );
  }
  
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[var(--text-muted)]">Failed to load profile</div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[var(--void)]">
      {/* Header */}
      <div className="border-b border-[var(--border-subtle)] bg-[var(--surface-1)]">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <Link
                  href="/super-admin/chat"
                  className="p-2 rounded-lg hover:bg-[var(--surface-2)] text-[var(--text-muted)]"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                  </svg>
                </Link>
                <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
                  Your AI Profile
                </h1>
              </div>
              <p className="text-sm text-[var(--text-muted)] mt-1 ml-11">
                Help the AI understand who you are and how to best serve you
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm text-[var(--text-secondary)]">Profile completeness</p>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 rounded-full bg-[var(--surface-2)]">
                    <div
                      className="h-full rounded-full bg-[var(--electric-lime)]"
                      style={{ width: `${profile.profile_completeness}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-[var(--electric-lime)]">
                    {profile.profile_completeness}%
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-1 mt-6 -mb-px">
            {[
              { id: "identity", label: "Identity", icon: "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" },
              { id: "purpose", label: "Purpose & Values", icon: "M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" },
              { id: "strengths", label: "Strengths & Growth", icon: "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" },
              { id: "communication", label: "Communication", icon: "M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" },
              { id: "goals", label: "Goals", icon: "M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-[var(--void)] text-[var(--electric-lime)] border-t border-x border-[var(--border-subtle)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
                </svg>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {saving && (
          <div className="fixed top-4 right-4 px-4 py-2 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] text-sm font-medium">
            Saving...
          </div>
        )}
        
        {activeTab === "identity" && (
          <IdentitySection profile={profile} onSave={saveProfile} />
        )}
        
        {activeTab === "purpose" && (
          <PurposeSection profile={profile} onSave={saveProfile} />
        )}
        
        {activeTab === "strengths" && (
          <StrengthsSection profile={profile} onSave={saveProfile} />
        )}
        
        {activeTab === "communication" && (
          <CommunicationSection profile={profile} styles={styles} onSave={saveProfile} />
        )}
        
        {activeTab === "goals" && (
          <GoalsSection goals={goals} onUpdate={setGoals} />
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Identity Section
   ═══════════════════════════════════════════════════════════════════════════ */

function IdentitySection({
  profile,
  onSave,
}: {
  profile: AIUserProfile;
  onSave: (updates: Partial<AIUserProfile>) => void;
}) {
  const [name, setName] = useState(profile.preferred_name || "");
  const [description, setDescription] = useState(profile.self_description || "");
  const [roles, setRoles] = useState<string[]>(profile.roles || []);
  const [lifeStage, setLifeStage] = useState(profile.life_stage || "");
  const [context, setContext] = useState(profile.important_context || "");
  
  const roleOptions = [
    "Entrepreneur", "Executive", "Developer", "Designer", "Parent", 
    "Partner", "Artist", "Writer", "Mentor", "Student", "Caregiver", 
    "Leader", "Creator", "Consultant", "Manager", "Founder"
  ];
  
  const lifeStageOptions = [
    "Just starting out",
    "Building momentum",
    "Scaling up",
    "Established and growing",
    "Transitioning",
    "Reinventing myself",
    "Mentoring others",
  ];
  
  return (
    <div className="space-y-8">
      <div className="p-6 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
          Who Are You?
        </h2>
        <p className="text-sm text-[var(--text-muted)] mb-6">
          Help the AI understand your identity so it can communicate meaningfully with you.
        </p>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              What should I call you?
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => onSave({ preferred_name: name || null })}
              placeholder="Your preferred name"
              className="w-full max-w-md px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              How would you describe yourself?
            </label>
            <p className="text-xs text-[var(--text-muted)] mb-2">
              Think about how you&apos;d introduce yourself to someone who wants to truly understand you.
            </p>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => onSave({ self_description: description || null })}
              placeholder="I'm someone who..."
              rows={4}
              className="w-full px-4 py-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              What roles do you play in life?
            </label>
            <div className="flex flex-wrap gap-2">
              {roleOptions.map(role => (
                <button
                  key={role}
                  onClick={() => {
                    const newRoles = roles.includes(role)
                      ? roles.filter(r => r !== role)
                      : [...roles, role];
                    setRoles(newRoles);
                    onSave({ roles: newRoles });
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    roles.includes(role)
                      ? "bg-[var(--electric-lime)] text-[var(--void)]"
                      : "bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Where are you in your journey?
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {lifeStageOptions.map(stage => (
                <button
                  key={stage}
                  onClick={() => {
                    setLifeStage(stage);
                    onSave({ life_stage: stage });
                  }}
                  className={`px-4 py-2.5 rounded-lg text-sm text-left transition-colors ${
                    lifeStage === stage
                      ? "bg-[var(--electric-lime)]/10 border-[var(--electric-lime)] text-[var(--electric-lime)]"
                      : "bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  } border border-[var(--border-subtle)]`}
                >
                  {stage}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Important context I should always know
            </label>
            <p className="text-xs text-[var(--text-muted)] mb-2">
              Anything that shapes how I should understand and help you.
            </p>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              onBlur={() => onSave({ important_context: context || null })}
              placeholder="E.g., I'm building a startup while raising two kids, I'm based in Australia so timezone matters..."
              rows={3}
              className="w-full px-4 py-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Purpose Section
   ═══════════════════════════════════════════════════════════════════════════ */

function PurposeSection({
  profile,
  onSave,
}: {
  profile: AIUserProfile;
  onSave: (updates: Partial<AIUserProfile>) => void;
}) {
  const [coreWhy, setCoreWhy] = useState(profile.core_why || "");
  const [mission, setMission] = useState(profile.mission_statement || "");
  const [vision, setVision] = useState(profile.long_term_vision || "");
  const [values, setValues] = useState<CoreValue[]>(profile.core_values || []);
  
  const valueOptions = [
    "Integrity", "Growth", "Freedom", "Family", "Impact", "Creativity",
    "Excellence", "Authenticity", "Courage", "Compassion", "Adventure",
    "Security", "Knowledge", "Balance", "Leadership", "Service",
    "Innovation", "Health", "Relationships", "Joy"
  ];
  
  function toggleValue(value: string) {
    const existing = values.find(v => v.value === value);
    let newValues: CoreValue[];
    
    if (existing) {
      newValues = values.filter(v => v.value !== value);
    } else {
      newValues = [...values, { value, rank: values.length + 1 }];
    }
    
    // Re-rank
    newValues = newValues.map((v, i) => ({ ...v, rank: i + 1 }));
    setValues(newValues);
    onSave({ core_values: newValues });
  }
  
  return (
    <div className="space-y-8">
      <div className="p-6 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
          Your Why
        </h2>
        <p className="text-sm text-[var(--text-muted)] mb-6">
          Understanding your purpose helps me connect our conversations to what truly matters to you.
        </p>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              What is your &quot;Why&quot;?
            </label>
            <p className="text-xs text-[var(--text-muted)] mb-2">
              What drives you at your core? What gets you out of bed in the morning?
            </p>
            <textarea
              value={coreWhy}
              onChange={(e) => setCoreWhy(e.target.value)}
              onBlur={() => onSave({ core_why: coreWhy || null })}
              placeholder="I believe that... / I'm driven by..."
              rows={4}
              className="w-full px-4 py-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              What are you trying to accomplish?
            </label>
            <textarea
              value={mission}
              onChange={(e) => setMission(e.target.value)}
              onBlur={() => onSave({ mission_statement: mission || null })}
              placeholder="My mission is to..."
              rows={3}
              className="w-full px-4 py-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Where do you see yourself in 5-10 years?
            </label>
            <textarea
              value={vision}
              onChange={(e) => setVision(e.target.value)}
              onBlur={() => onSave({ long_term_vision: vision || null })}
              placeholder="In 5-10 years, I will have..."
              rows={3}
              className="w-full px-4 py-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
            />
          </div>
        </div>
      </div>
      
      <div className="p-6 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
          Core Values
        </h2>
        <p className="text-sm text-[var(--text-muted)] mb-6">
          Select your most important values (in order of importance).
        </p>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {valueOptions.map(value => {
            const selected = values.find(v => v.value === value);
            return (
              <button
                key={value}
                onClick={() => toggleValue(value)}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  selected
                    ? "bg-[var(--electric-lime)] text-[var(--void)]"
                    : "bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {selected && <span className="mr-1">{selected.rank}.</span>}
                {value}
              </button>
            );
          })}
        </div>
        
        {values.length > 0 && (
          <p className="text-xs text-[var(--text-muted)]">
            Click values again to remove. Order reflects priority.
          </p>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Strengths Section
   ═══════════════════════════════════════════════════════════════════════════ */

function StrengthsSection({
  profile,
  onSave,
}: {
  profile: AIUserProfile;
  onSave: (updates: Partial<AIUserProfile>) => void;
}) {
  const [strengths, setStrengths] = useState<Strength[]>(profile.strengths || []);
  const [growthAreas, setGrowthAreas] = useState<GrowthArea[]>(profile.growth_areas || []);
  const [passions, setPassions] = useState<Passion[]>(profile.passions || []);
  const [newStrength, setNewStrength] = useState("");
  const [newGrowth, setNewGrowth] = useState("");
  const [newPassion, setNewPassion] = useState("");
  
  function addStrength() {
    if (!newStrength.trim()) return;
    const updated = [...strengths, { strength: newStrength.trim() }];
    setStrengths(updated);
    setNewStrength("");
    onSave({ strengths: updated });
  }
  
  function removeStrength(index: number) {
    const updated = strengths.filter((_, i) => i !== index);
    setStrengths(updated);
    onSave({ strengths: updated });
  }
  
  function addGrowth() {
    if (!newGrowth.trim()) return;
    const updated = [...growthAreas, { area: newGrowth.trim(), working_on: true }];
    setGrowthAreas(updated);
    setNewGrowth("");
    onSave({ growth_areas: updated });
  }
  
  function removeGrowth(index: number) {
    const updated = growthAreas.filter((_, i) => i !== index);
    setGrowthAreas(updated);
    onSave({ growth_areas: updated });
  }
  
  function addPassion() {
    if (!newPassion.trim()) return;
    const updated = [...passions, { passion: newPassion.trim() }];
    setPassions(updated);
    setNewPassion("");
    onSave({ passions: updated });
  }
  
  function removePassion(index: number) {
    const updated = passions.filter((_, i) => i !== index);
    setPassions(updated);
    onSave({ passions: updated });
  }
  
  return (
    <div className="space-y-8">
      <div className="p-6 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
          Your Strengths
        </h2>
        <p className="text-sm text-[var(--text-muted)] mb-6">
          Your superpowers - skills and abilities that come naturally.
        </p>
        
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newStrength}
            onChange={(e) => setNewStrength(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addStrength()}
            placeholder="e.g., Strategic thinking, Problem solving..."
            className="flex-1 px-4 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
          />
          <button
            onClick={addStrength}
            className="px-4 py-2 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] font-medium hover:brightness-110"
          >
            Add
          </button>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {strengths.map((s, i) => (
            <span
              key={i}
              className="px-3 py-1.5 rounded-full bg-[var(--electric-lime)]/10 text-[var(--electric-lime)] text-sm flex items-center gap-2"
            >
              {s.strength}
              <button
                onClick={() => removeStrength(i)}
                className="hover:text-white"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>
      
      <div className="p-6 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
          Growth Areas
        </h2>
        <p className="text-sm text-[var(--text-muted)] mb-6">
          Areas where you&apos;re actively working to improve.
        </p>
        
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newGrowth}
            onChange={(e) => setNewGrowth(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addGrowth()}
            placeholder="e.g., Patience, Public speaking..."
            className="flex-1 px-4 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
          />
          <button
            onClick={addGrowth}
            className="px-4 py-2 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] font-medium hover:brightness-110"
          >
            Add
          </button>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {growthAreas.map((g, i) => (
            <span
              key={i}
              className="px-3 py-1.5 rounded-full bg-[var(--warning)]/10 text-[var(--warning)] text-sm flex items-center gap-2"
            >
              {g.area}
              <button
                onClick={() => removeGrowth(i)}
                className="hover:text-white"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>
      
      <div className="p-6 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
          Passions
        </h2>
        <p className="text-sm text-[var(--text-muted)] mb-6">
          Things that light you up, even if they&apos;re not your job.
        </p>
        
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newPassion}
            onChange={(e) => setNewPassion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addPassion()}
            placeholder="e.g., Building products, Teaching, Music..."
            className="flex-1 px-4 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
          />
          <button
            onClick={addPassion}
            className="px-4 py-2 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] font-medium hover:brightness-110"
          >
            Add
          </button>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {passions.map((p, i) => (
            <span
              key={i}
              className="px-3 py-1.5 rounded-full bg-[var(--electric-cyan)]/10 text-[var(--electric-cyan)] text-sm flex items-center gap-2"
            >
              {p.passion}
              <button
                onClick={() => removePassion(i)}
                className="hover:text-white"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Communication Section
   ═══════════════════════════════════════════════════════════════════════════ */

function CommunicationSection({
  profile,
  styles,
  onSave,
}: {
  profile: AIUserProfile;
  styles: { system_styles: AIConversationStyle[]; custom_styles: AIConversationStyle[] };
  onSave: (updates: Partial<AIUserProfile>) => void;
}) {
  const [showCreateStyle, setShowCreateStyle] = useState(false);
  const [newStyleName, setNewStyleName] = useState("");
  const [newStyleDescription, setNewStyleDescription] = useState("");
  const [savingStyle, setSavingStyle] = useState(false);
  const [customStyles, setCustomStyles] = useState(styles.custom_styles);
  
  // Check if current settings match a preset
  function matchesPreset(style: AIConversationStyle): boolean {
    const checks = [
      style.communication_style === null || style.communication_style === profile.communication_style,
      style.formality_level === null || style.formality_level === profile.formality_level,
      style.detail_preference === null || style.detail_preference === profile.detail_preference,
      style.emotional_support_level === null || style.emotional_support_level === profile.emotional_support_level,
      style.challenge_me === null || style.challenge_me === profile.challenge_me,
      style.use_analogies === null || style.use_analogies === profile.use_analogies,
      style.use_humor === null || style.use_humor === profile.use_humor,
      style.be_philosophical === null || style.be_philosophical === profile.be_philosophical,
      style.action_oriented === null || style.action_oriented === profile.action_oriented,
    ];
    // At least 5 settings must match for it to be considered a match
    const matchCount = checks.filter(Boolean).length;
    return matchCount >= 7;
  }

  function buildStylePayload(style: AIConversationStyle): Partial<AIUserProfile> {
    return {
      ...(style.communication_style !== null
        ? { communication_style: style.communication_style }
        : {}),
      ...(style.formality_level !== null ? { formality_level: style.formality_level } : {}),
      ...(style.detail_preference !== null
        ? { detail_preference: style.detail_preference }
        : {}),
      ...(style.emotional_support_level !== null
        ? { emotional_support_level: style.emotional_support_level }
        : {}),
      ...(style.challenge_me !== null ? { challenge_me: style.challenge_me } : {}),
      ...(style.use_analogies !== null ? { use_analogies: style.use_analogies } : {}),
      ...(style.use_humor !== null ? { use_humor: style.use_humor } : {}),
      ...(style.be_philosophical !== null ? { be_philosophical: style.be_philosophical } : {}),
      ...(style.action_oriented !== null ? { action_oriented: style.action_oriented } : {}),
    };
  }
  
  async function saveCustomStyle() {
    if (!newStyleName.trim()) return;
    
    setSavingStyle(true);
    try {
      const res = await fetch("/api/profile/styles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newStyleName.trim(),
          description: newStyleDescription.trim() || null,
          communication_style: profile.communication_style,
          formality_level: profile.formality_level,
          detail_preference: profile.detail_preference,
          emotional_support_level: profile.emotional_support_level,
          challenge_me: profile.challenge_me,
          use_analogies: profile.use_analogies,
          use_humor: profile.use_humor,
          be_philosophical: profile.be_philosophical,
          action_oriented: profile.action_oriented,
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setCustomStyles([...customStyles, data.style]);
        setNewStyleName("");
        setNewStyleDescription("");
        setShowCreateStyle(false);
      }
    } catch (err) {
      console.error("Failed to create style:", err);
    } finally {
      setSavingStyle(false);
    }
  }
  
  async function deleteCustomStyle(styleId: string) {
    try {
      const res = await fetch(`/api/profile/styles/${styleId}`, {
        method: "DELETE",
      });
      
      if (res.ok) {
        setCustomStyles(customStyles.filter(s => s.id !== styleId));
      }
    } catch (err) {
      console.error("Failed to delete style:", err);
    }
  }
  
  return (
    <div className="space-y-8">
      {/* Quick styles */}
      <div className="p-6 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
          Communication Presets
        </h2>
        <p className="text-sm text-[var(--text-muted)] mb-6">
          Quick ways to configure how I communicate with you.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {styles.system_styles.map(style => {
            const isActive = matchesPreset(style);
            return (
              <button
                key={style.id}
                onClick={() => onSave(buildStylePayload(style))}
                className={`p-4 rounded-xl border text-left transition-colors ${
                  isActive
                    ? "bg-[var(--electric-lime)]/10 border-[var(--electric-lime)]"
                    : "bg-[var(--surface-2)] border-[var(--border-subtle)] hover:border-[var(--electric-lime)]"
                }`}
              >
                <div className="flex items-start justify-between">
                  <h3 className={`font-medium ${isActive ? "text-[var(--electric-lime)]" : "text-[var(--text-primary)]"}`}>
                    {style.name}
                  </h3>
                  {isActive && (
                    <svg className="w-5 h-5 text-[var(--electric-lime)]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <p className="text-sm text-[var(--text-muted)] mt-1">{style.description}</p>
              </button>
            );
          })}
        </div>
        
        {/* Custom styles */}
        {customStyles.length > 0 && (
          <div className="mt-6 pt-6 border-t border-[var(--border-subtle)]">
            <h3 className="text-sm font-medium text-[var(--text-primary)] mb-4">Your Custom Styles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customStyles.map(style => {
                const isActive = matchesPreset(style);
                return (
                  <div
                    key={style.id}
                    className={`p-4 rounded-xl border transition-colors ${
                      isActive
                        ? "bg-[var(--electric-cyan)]/10 border-[var(--electric-cyan)]"
                        : "bg-[var(--surface-2)] border-[var(--border-subtle)]"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className={`font-medium ${isActive ? "text-[var(--electric-cyan)]" : "text-[var(--text-primary)]"}`}>
                        {style.name}
                      </h3>
                      <button
                        onClick={() => deleteCustomStyle(style.id)}
                        className="text-[var(--text-muted)] hover:text-[var(--error)] transition-colors"
                        title="Delete style"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    </div>
                    {style.description && (
                      <p className="text-sm text-[var(--text-muted)] mb-3">{style.description}</p>
                    )}
                    <button
                      onClick={() => onSave(buildStylePayload(style))}
                      className="text-sm text-[var(--electric-cyan)] hover:underline"
                    >
                      Apply this style
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Save current as custom style */}
        <div className="mt-6 pt-6 border-t border-[var(--border-subtle)]">
          {!showCreateStyle ? (
            <button
              onClick={() => setShowCreateStyle(true)}
              className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--electric-lime)] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Save current settings as a custom style
            </button>
          ) : (
            <div className="space-y-3">
              <input
                type="text"
                value={newStyleName}
                onChange={(e) => setNewStyleName(e.target.value)}
                placeholder="Style name (e.g., 'My Work Mode')"
                className="w-full max-w-md px-4 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--electric-lime)]"
              />
              <input
                type="text"
                value={newStyleDescription}
                onChange={(e) => setNewStyleDescription(e.target.value)}
                placeholder="Short description (optional)"
                className="w-full max-w-md px-4 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--electric-lime)]"
              />
              <div className="flex gap-2">
                <button
                  onClick={saveCustomStyle}
                  disabled={!newStyleName.trim() || savingStyle}
                  className="px-4 py-2 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] text-sm font-medium hover:brightness-110 disabled:opacity-50"
                >
                  {savingStyle ? "Saving..." : "Save Style"}
                </button>
                <button
                  onClick={() => {
                    setShowCreateStyle(false);
                    setNewStyleName("");
                    setNewStyleDescription("");
                  }}
                  className="px-4 py-2 rounded-lg bg-[var(--surface-2)] text-[var(--text-secondary)] text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Custom settings */}
      <div className="p-6 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
          Fine-tune Communication
        </h2>
        <p className="text-sm text-[var(--text-muted)] mb-6">
          Customize exactly how you want me to communicate.
        </p>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-3">
              Communication Style
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {([
                { value: "direct", label: "Direct", desc: "No fluff, straight talk" },
                { value: "nurturing", label: "Nurturing", desc: "Warm and supportive" },
                { value: "analytical", label: "Analytical", desc: "Data and logic" },
                { value: "creative", label: "Creative", desc: "Imaginative" },
                { value: "balanced", label: "Balanced", desc: "Mix of all" },
              ] as const).map(opt => (
                <button
                  key={opt.value}
                  onClick={() => onSave({ communication_style: opt.value })}
                  className={`p-3 rounded-lg text-left transition-colors ${
                    profile.communication_style === opt.value
                      ? "bg-[var(--electric-lime)]/10 border-[var(--electric-lime)] text-[var(--electric-lime)]"
                      : "bg-[var(--surface-2)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]"
                  } border border-[var(--border-subtle)]`}
                >
                  <span className="block text-sm font-medium">{opt.label}</span>
                  <span className="block text-xs opacity-70">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-3">
              Formality Level
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {([
                { value: "formal", label: "Formal", desc: "Professional and structured" },
                { value: "professional", label: "Professional", desc: "Business appropriate" },
                { value: "casual", label: "Casual", desc: "Relaxed and easy" },
                { value: "friendly", label: "Friendly", desc: "Warm and personable" },
              ] as const).map(opt => (
                <button
                  key={opt.value}
                  onClick={() => onSave({ formality_level: opt.value })}
                  className={`p-3 rounded-lg text-left transition-colors ${
                    profile.formality_level === opt.value
                      ? "bg-[var(--electric-lime)]/10 border-[var(--electric-lime)] text-[var(--electric-lime)]"
                      : "bg-[var(--surface-2)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]"
                  } border border-[var(--border-subtle)]`}
                >
                  <span className="block text-sm font-medium">{opt.label}</span>
                  <span className="block text-xs opacity-70">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-3">
              Detail Level
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {([
                { value: "brief", label: "Brief", desc: "Just essentials" },
                { value: "moderate", label: "Moderate", desc: "Enough context" },
                { value: "detailed", label: "Detailed", desc: "Thorough" },
                { value: "comprehensive", label: "Comprehensive", desc: "Full deep-dives" },
              ] as const).map(opt => (
                <button
                  key={opt.value}
                  onClick={() => onSave({ detail_preference: opt.value })}
                  className={`p-3 rounded-lg text-left transition-colors ${
                    profile.detail_preference === opt.value
                      ? "bg-[var(--electric-lime)]/10 border-[var(--electric-lime)] text-[var(--electric-lime)]"
                      : "bg-[var(--surface-2)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]"
                  } border border-[var(--border-subtle)]`}
                >
                  <span className="block text-sm font-medium">{opt.label}</span>
                  <span className="block text-xs opacity-70">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-3">
              Emotional Support Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: "minimal", label: "Minimal", desc: "Just the facts, minimal emotional engagement" },
                { value: "moderate", label: "Moderate", desc: "Balanced emotional acknowledgment" },
                { value: "high", label: "High", desc: "Empathetic and emotionally supportive" },
              ] as const).map(opt => (
                <button
                  key={opt.value}
                  onClick={() => onSave({ emotional_support_level: opt.value })}
                  className={`p-3 rounded-lg text-left transition-colors ${
                    profile.emotional_support_level === opt.value
                      ? "bg-[var(--electric-lime)]/10 border-[var(--electric-lime)] text-[var(--electric-lime)]"
                      : "bg-[var(--surface-2)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]"
                  } border border-[var(--border-subtle)]`}
                >
                  <span className="block text-sm font-medium">{opt.label}</span>
                  <span className="block text-xs opacity-70">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { key: "challenge_me", label: "Challenge my thinking", desc: "Push back when you see room for growth" },
              { key: "celebrate_wins", label: "Celebrate wins", desc: "Acknowledge achievements" },
              { key: "use_analogies", label: "Use analogies", desc: "Explain with metaphors" },
              { key: "use_humor", label: "Use humor", desc: "Include appropriate humor" },
              { key: "be_philosophical", label: "Be philosophical", desc: "Explore deeper meanings" },
              { key: "action_oriented", label: "Action oriented", desc: "Focus on next steps" },
            ].map(toggle => (
              <button
                key={toggle.key}
                onClick={() => onSave({ [toggle.key]: !profile[toggle.key as keyof AIUserProfile] })}
                className={`p-4 rounded-xl text-left transition-colors ${
                  profile[toggle.key as keyof AIUserProfile]
                    ? "bg-[var(--electric-lime)]/10 border-[var(--electric-lime)]"
                    : "bg-[var(--surface-2)] border-[var(--border-subtle)] hover:border-[var(--text-muted)]"
                } border`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {toggle.label}
                  </span>
                  <div className={`w-8 h-5 rounded-full transition-colors ${
                    profile[toggle.key as keyof AIUserProfile]
                      ? "bg-[var(--electric-lime)]"
                      : "bg-[var(--border)]"
                  }`}>
                    <div className={`w-3 h-3 rounded-full bg-white transition-transform mt-1 ${
                      profile[toggle.key as keyof AIUserProfile] ? "ml-4" : "ml-1"
                    }`} />
                  </div>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-1">{toggle.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Current Settings Summary */}
      <div className="p-6 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
          Current Settings Summary
        </h2>
        <p className="text-sm text-[var(--text-muted)] mb-4">
          Here&apos;s how the AI will communicate with you based on your current settings.
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 rounded-lg bg-[var(--surface-2)]">
            <p className="text-xs text-[var(--text-muted)]">Style</p>
            <p className="text-sm font-medium text-[var(--text-primary)] capitalize">
              {profile.communication_style || "Balanced"}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-[var(--surface-2)]">
            <p className="text-xs text-[var(--text-muted)]">Formality</p>
            <p className="text-sm font-medium text-[var(--text-primary)] capitalize">
              {profile.formality_level || "Casual"}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-[var(--surface-2)]">
            <p className="text-xs text-[var(--text-muted)]">Detail</p>
            <p className="text-sm font-medium text-[var(--text-primary)] capitalize">
              {profile.detail_preference || "Moderate"}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-[var(--surface-2)]">
            <p className="text-xs text-[var(--text-muted)]">Emotional Support</p>
            <p className="text-sm font-medium text-[var(--text-primary)] capitalize">
              {profile.emotional_support_level || "Moderate"}
            </p>
          </div>
        </div>
        
        <div className="mt-4 flex flex-wrap gap-2">
          {profile.challenge_me && (
            <span className="px-2 py-1 rounded text-xs bg-[var(--electric-lime)]/10 text-[var(--electric-lime)]">
              Challenges thinking
            </span>
          )}
          {profile.celebrate_wins && (
            <span className="px-2 py-1 rounded text-xs bg-[var(--electric-lime)]/10 text-[var(--electric-lime)]">
              Celebrates wins
            </span>
          )}
          {profile.use_analogies && (
            <span className="px-2 py-1 rounded text-xs bg-[var(--electric-lime)]/10 text-[var(--electric-lime)]">
              Uses analogies
            </span>
          )}
          {profile.use_humor && (
            <span className="px-2 py-1 rounded text-xs bg-[var(--electric-lime)]/10 text-[var(--electric-lime)]">
              Uses humor
            </span>
          )}
          {profile.be_philosophical && (
            <span className="px-2 py-1 rounded text-xs bg-[var(--electric-lime)]/10 text-[var(--electric-lime)]">
              Philosophical
            </span>
          )}
          {profile.action_oriented && (
            <span className="px-2 py-1 rounded text-xs bg-[var(--electric-lime)]/10 text-[var(--electric-lime)]">
              Action-oriented
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Goals Section
   ═══════════════════════════════════════════════════════════════════════════ */

function GoalsSection({
  goals,
  onUpdate,
}: {
  goals: AIUserGoal[];
  onUpdate: (goals: AIUserGoal[]) => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: "", why_important: "", category: "" });
  
  async function addGoal() {
    if (!newGoal.title.trim()) return;
    
    const res = await fetch("/api/profile/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newGoal),
    });
    
    if (res.ok) {
      const data = await res.json();
      onUpdate([data.goal, ...goals]);
      setNewGoal({ title: "", why_important: "", category: "" });
      setShowAdd(false);
    }
  }
  
  async function updateGoalStatus(goalId: string, status: string) {
    const res = await fetch(`/api/profile/goals/${goalId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    
    if (res.ok) {
      const data = await res.json();
      onUpdate(goals.map(g => g.id === goalId ? data.goal : g));
    }
  }
  
  const categories = [
    { value: "personal", label: "Personal", color: "var(--electric-lime)" },
    { value: "professional", label: "Professional", color: "var(--electric-cyan)" },
    { value: "health", label: "Health", color: "#10b981" },
    { value: "relationship", label: "Relationship", color: "#ec4899" },
    { value: "financial", label: "Financial", color: "#f59e0b" },
    { value: "learning", label: "Learning", color: "#8b5cf6" },
  ];
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Your Goals
          </h2>
          <p className="text-sm text-[var(--text-muted)]">
            Goals help me understand what you&apos;re working toward and connect our conversations to your bigger picture.
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="px-4 py-2 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] font-medium hover:brightness-110"
        >
          Add Goal
        </button>
      </div>
      
      {showAdd && (
        <div className="p-6 rounded-2xl bg-[var(--surface-1)] border border-[var(--electric-lime)]">
          <h3 className="text-sm font-medium text-[var(--text-primary)] mb-4">New Goal</h3>
          
          <div className="space-y-4">
            <input
              type="text"
              value={newGoal.title}
              onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
              placeholder="What's your goal?"
              className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
            />
            
            <textarea
              value={newGoal.why_important}
              onChange={(e) => setNewGoal({ ...newGoal, why_important: e.target.value })}
              placeholder="Why is this important to you?"
              rows={2}
              className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
            />
            
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setNewGoal({ ...newGoal, category: cat.value })}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    newGoal.category === cat.value
                      ? "text-[var(--void)]"
                      : "bg-[var(--surface-2)] text-[var(--text-secondary)]"
                  }`}
                  style={{
                    backgroundColor: newGoal.category === cat.value ? cat.color : undefined,
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAdd(false)}
                className="px-4 py-2 rounded-lg bg-[var(--surface-2)] text-[var(--text-secondary)]"
              >
                Cancel
              </button>
              <button
                onClick={addGoal}
                disabled={!newGoal.title.trim()}
                className="px-4 py-2 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] font-medium hover:brightness-110 disabled:opacity-50"
              >
                Add Goal
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="space-y-4">
        {goals.length === 0 ? (
          <div className="p-12 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)] text-center">
            <p className="text-[var(--text-muted)]">No goals yet</p>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              Add goals to help me understand what you&apos;re working toward.
            </p>
          </div>
        ) : (
          goals.map(goal => {
            const category = categories.find(c => c.value === goal.category);
            return (
              <div
                key={goal.id}
                className="p-5 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)]"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-[var(--text-primary)]">
                        {goal.title}
                      </h3>
                      {category && (
                        <span
                          className="px-2 py-0.5 rounded text-xs"
                          style={{
                            backgroundColor: `${category.color}20`,
                            color: category.color,
                          }}
                        >
                          {category.label}
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        goal.status === "achieved"
                          ? "bg-[var(--success)]/20 text-[var(--success)]"
                          : goal.status === "paused"
                          ? "bg-[var(--warning)]/20 text-[var(--warning)]"
                          : "bg-[var(--surface-2)] text-[var(--text-muted)]"
                      }`}>
                        {goal.status}
                      </span>
                    </div>
                    {goal.why_important && (
                      <p className="text-sm text-[var(--text-muted)] mt-1">
                        Why: {goal.why_important}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {goal.status === "active" && (
                      <button
                        onClick={() => updateGoalStatus(goal.id, "achieved")}
                        className="px-3 py-1.5 rounded-lg bg-[var(--success)]/10 text-[var(--success)] text-sm hover:bg-[var(--success)]/20"
                      >
                        Mark Complete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
