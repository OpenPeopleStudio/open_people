'use client'

import { useState, useRef, useEffect } from 'react'

interface Option {
  id: string
  label: string
  subtitle?: string
}

interface AutocompleteSearchProps {
  options: Option[]
  value: string | null
  onChange: (value: string | null) => void
  placeholder?: string
  label?: string
  error?: string
  disabled?: boolean
}

export default function AutocompleteSearch({
  options,
  value,
  onChange,
  placeholder = 'Search...',
  label,
  error,
  disabled = false,
}: AutocompleteSearchProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const wrapperRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find(opt => opt.id === value)
  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(search.toLowerCase()) ||
    opt.subtitle?.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (optionId: string) => {
    onChange(optionId)
    setIsOpen(false)
    setSearch('')
  }

  const handleClear = () => {
    onChange(null)
    setSearch('')
  }

  return (
    <div ref={wrapperRef} className="relative">
      {label && (
        <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        {selectedOption ? (
          // Selected state
          <div className="flex items-center gap-2 w-full pl-4 pr-12 py-3 sm:py-4 bg-[var(--glass-bg)] backdrop-blur-xl text-[var(--text-primary)] border border-[var(--glass-border)] rounded-2xl">
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{selectedOption.label}</div>
              {selectedOption.subtitle && (
                <div className="text-sm text-[var(--text-muted)] truncate">{selectedOption.subtitle}</div>
              )}
            </div>
            <button
              type="button"
              onClick={handleClear}
              disabled={disabled}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/10 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Clear selection"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          // Search state
          <div className="relative">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setIsOpen(true)
              }}
              onFocus={() => setIsOpen(true)}
              placeholder={placeholder}
              disabled={disabled}
              className="w-full pl-12 pr-4 py-3 sm:py-4 bg-[var(--glass-bg)] backdrop-blur-xl text-[var(--text-primary)] border border-[var(--glass-border)] rounded-2xl focus:border-[var(--border-glow)] focus:shadow-[0_0_20px_rgba(255,0,255,0.2)] focus:outline-none text-sm sm:text-base placeholder:text-[var(--text-muted)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        )}

        {/* Dropdown */}
        {isOpen && !selectedOption && (
          <div className="absolute z-50 w-full mt-2 bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)] rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.5)] max-h-60 overflow-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">
                No results found
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelect(option.id)}
                  className="w-full px-4 py-3 text-left hover:bg-white/10 transition-colors first:rounded-t-2xl last:rounded-b-2xl"
                >
                  <div className="font-medium text-[var(--text-primary)]">{option.label}</div>
                  {option.subtitle && (
                    <div className="text-sm text-[var(--text-muted)] mt-0.5">{option.subtitle}</div>
                  )}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-[var(--error)]">{error}</p>
      )}
    </div>
  )
}
