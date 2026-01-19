"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

/* ═══════════════════════════════════════════════════════════════════════════
   AI Profile Page - Tenant Admin
   User profile information for AI context
   ═══════════════════════════════════════════════════════════════════════════ */

interface AIProfile {
  id: string;
  display_name: string;
  bio: string;
  preferences: string[];
  working_hours: { start: string; end: string } | null;
  timezone: string | null;
  created_at: string;
  updated_at: string;
}

export default function AIProfilePage() {
  const [profile, setProfile] = useState<AIProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [preferences, setPreferences] = useState<string[]>([]);
  const [newPreference, setNewPreference] = useState("");
  
  useEffect(() => {
    loadProfile();
  }, []);
  
  async function loadProfile() {
    try {
      const res = await fetch("/api/chat/profile");
      if (res.ok) {
        const data = await res.json();
        if (data.profile) {
          setProfile(data.profile);
          setDisplayName(data.profile.display_name || "");
          setBio(data.profile.bio || "");
          setPreferences(data.profile.preferences || []);
        }
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
    } finally {
      setLoading(false);
    }
  }
  
  async function saveProfile() {
    setSaving(true);
    try {
      const res = await fetch("/api/chat/profile", {
        method: profile ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayName,
          bio,
          preferences,
        }),
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
  
  function addPreference() {
    if (newPreference.trim() && !preferences.includes(newPreference.trim())) {
      setPreferences([...preferences, newPreference.trim()]);
      setNewPreference("");
    }
  }
  
  function removePreference(pref: string) {
    setPreferences(preferences.filter(p => p !== pref));
  }
  
  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-[var(--text-muted)]">
          <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>Loading profile...</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/chat"
          className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Your AI Profile
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Information to help AI provide personalized responses
          </p>
        </div>
      </div>
      
      {/* Profile Form */}
      <div className="space-y-6">
        {/* Display Name */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            Display Name
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="How should the AI address you?"
            className="w-full px-4 py-3 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
          />
        </div>
        
        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            About You
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell the AI about yourself, your role, and what you typically work on..."
            rows={4}
            className="w-full px-4 py-3 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] text-[var(--text-primary)] resize-none focus:outline-none focus:border-[var(--electric-lime)]"
          />
        </div>
        
        {/* Preferences */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            Preferences & Communication Style
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {preferences.map((pref, i) => (
              <span
                key={i}
                className="px-3 py-1.5 rounded-lg bg-[var(--electric-lime)]/10 text-[var(--electric-lime)] text-sm flex items-center gap-2"
              >
                {pref}
                <button
                  onClick={() => removePreference(pref)}
                  className="hover:text-[var(--error)]"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newPreference}
              onChange={(e) => setNewPreference(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addPreference()}
              placeholder="e.g., concise responses, technical detail, code examples"
              className="flex-1 px-4 py-2 rounded-lg bg-[var(--surface-1)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--electric-lime)]"
            />
            <button
              onClick={addPreference}
              className="px-4 py-2 rounded-lg bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              Add
            </button>
          </div>
        </div>
        
        {/* Save Button */}
        <div className="pt-4">
          <button
            onClick={saveProfile}
            disabled={saving}
            className="px-6 py-3 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] font-medium hover:brightness-110 transition-all disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </div>
    </div>
  );
}
