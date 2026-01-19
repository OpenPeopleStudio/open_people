'use client'

interface FilterPillProps {
  label: string
  selected: boolean
  onClick: () => void
  size?: 'sm' | 'md'
}

export default function FilterPill({ label, selected, onClick, size = 'md' }: FilterPillProps) {
  const sizeClasses = size === 'sm' 
    ? 'px-3 py-2 text-xs min-h-[44px]' 
    : 'px-4 py-2.5 text-sm min-h-[44px]'

  return (
    <button
      onClick={onClick}
      className={`${sizeClasses} rounded-full font-medium transition-colors flex items-center justify-center ${
        selected
          ? 'bg-[var(--accent)] text-white'
          : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]'
      }`}
    >
      {label}
    </button>
  )
}

// Size button variant (square for sizes)
export function SizeButton({ label, selected, onClick, disabled = false }: FilterPillProps & { disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`min-w-[44px] min-h-[44px] w-12 h-12 text-sm rounded-lg font-medium transition-colors flex items-center justify-center ${
        disabled 
          ? 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] opacity-50 cursor-not-allowed'
          : selected
            ? 'bg-[var(--accent)] text-white'
            : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]'
      }`}
    >
      {label}
    </button>
  )
}

// Condition button variant
export function ConditionButton({ label, selected, onClick }: FilterPillProps) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 text-sm rounded-lg font-medium transition-colors min-h-[44px] flex items-center justify-center ${
        selected
          ? 'bg-[var(--accent)] text-white'
          : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]'
      }`}
    >
      {label}
    </button>
  )
}
