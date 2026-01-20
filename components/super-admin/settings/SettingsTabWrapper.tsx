"use client";

import { ReactNode } from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   Settings Tab Wrapper Component
   Consistent wrapper for all settings tab content
   ═══════════════════════════════════════════════════════════════════════════ */

type Props = {
  title: string;
  description?: string;
  children: ReactNode;
  variant?: "default" | "danger";
};

export function SettingsTabWrapper({
  title,
  description,
  children,
  variant = "default",
}: Props) {
  return (
    <div
      className={`rounded-xl bg-[var(--surface-1)] border p-6 ${
        variant === "danger"
          ? "border-[var(--error)]/30"
          : "border-[var(--border-subtle)]"
      }`}
    >
      <h2
        className={`text-lg font-semibold mb-2 ${
          variant === "danger"
            ? "text-[var(--error)]"
            : "text-[var(--text-primary)]"
        }`}
      >
        {title}
      </h2>
      {description && (
        <p className="text-sm text-[var(--text-muted)] mb-6">{description}</p>
      )}
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Shared Input Components
   ═══════════════════════════════════════════════════════════════════════════ */

type TextInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "email" | "url";
  placeholder?: string;
  description?: string;
};

export function TextInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  description,
}: TextInputProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
      />
      {description && (
        <p className="text-xs text-[var(--text-muted)] mt-1">{description}</p>
      )}
    </div>
  );
}

type NumberInputProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  description?: string;
};

export function NumberInput({
  label,
  value,
  onChange,
  min,
  max,
  description,
}: NumberInputProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
        {label}
      </label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        min={min}
        max={max}
        className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
      />
      {description && (
        <p className="text-xs text-[var(--text-muted)] mt-1">{description}</p>
      )}
    </div>
  );
}

type SelectInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  description?: string;
};

export function SelectInput({
  label,
  value,
  onChange,
  options,
  description,
}: SelectInputProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {description && (
        <p className="text-xs text-[var(--text-muted)] mt-1">{description}</p>
      )}
    </div>
  );
}

type ToggleProps = {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export function Toggle({ label, description, checked, onChange }: ToggleProps) {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-[var(--surface-2)]">
      <div>
        <p className="text-sm font-medium text-[var(--text-primary)]">{label}</p>
        {description && (
          <p className="text-xs text-[var(--text-muted)] mt-0.5">{description}</p>
        )}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          checked ? "bg-[var(--electric-lime)]" : "bg-[var(--surface-3)]"
        }`}
      >
        <span
          className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
            checked ? "translate-x-6" : ""
          }`}
        />
      </button>
    </div>
  );
}

type TagInputProps = {
  label: string;
  description?: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
};

export function TagInput({
  label,
  description,
  values,
  onChange,
  placeholder = "Add item and press Enter",
}: TagInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const input = e.currentTarget;
      const newValue = input.value.trim();
      if (newValue && !values.includes(newValue)) {
        onChange([...values, newValue]);
        input.value = "";
      }
    }
  };

  const removeValue = (valueToRemove: string) => {
    onChange(values.filter((v) => v !== valueToRemove));
  };

  return (
    <div>
      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
        {label}
      </label>
      <div className="flex flex-wrap gap-2 mb-2">
        {values.map((value) => (
          <span
            key={value}
            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[var(--surface-3)] text-xs text-[var(--text-secondary)]"
          >
            {value}
            <button
              onClick={() => removeValue(value)}
              className="hover:text-[var(--error)]"
            >
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
      />
      {description && (
        <p className="text-xs text-[var(--text-muted)] mt-1">{description}</p>
      )}
    </div>
  );
}
