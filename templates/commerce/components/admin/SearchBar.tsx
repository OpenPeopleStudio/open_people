'use client'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  resultsCount?: number
}

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Search...',
  resultsCount,
}: SearchBarProps) {
  return (
    <div className="relative">
      <div className="relative group">
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)] group-focus-within:text-[var(--neon-cyan)] transition-colors pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-12 pr-14 py-3 sm:py-4 min-h-[48px] bg-[var(--glass-bg)] backdrop-blur-xl text-[var(--text-primary)] border border-[var(--glass-border)] rounded-full focus:border-[var(--border-glow)] focus:shadow-[0_0_20px_rgba(255,0,255,0.2)] focus:outline-none text-sm sm:text-base placeholder:text-[var(--text-muted)] transition-all duration-300"
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] w-10 h-10 flex items-center justify-center rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/10 transition-all duration-300"
            aria-label="Clear search"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      {resultsCount !== undefined && value && (
        <div className="mt-3 text-xs font-semibold text-[var(--text-muted)] px-4">
          {resultsCount} {resultsCount === 1 ? 'result' : 'results'} found
        </div>
      )}
    </div>
  )
}
