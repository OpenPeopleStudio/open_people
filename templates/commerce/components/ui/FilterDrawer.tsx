'use client'

import { useEffect, useRef } from 'react'
import FilterPill, { SizeButton, ConditionButton } from './FilterPill'

interface FilterDrawerProps {
  isOpen: boolean
  onClose: () => void
  brands: string[]
  selectedBrands: string[]
  onToggleBrand: (brand: string) => void
  sizes: string[]
  selectedSizes: string[]
  onToggleSize: (size: string) => void
  conditions: string[]
  selectedConditions: string[]
  onToggleCondition: (condition: string) => void
  priceMin: string
  priceMax: string
  onPriceMinChange: (value: string) => void
  onPriceMaxChange: (value: string) => void
  onApply: () => void
  onClear: () => void
  activeCount: number
}

export default function FilterDrawer({
  isOpen,
  onClose,
  brands,
  selectedBrands,
  onToggleBrand,
  sizes,
  selectedSizes,
  onToggleSize,
  conditions,
  selectedConditions,
  onToggleCondition,
  priceMin,
  priceMax,
  onPriceMinChange,
  onPriceMaxChange,
  onApply,
  onClear,
  activeCount
}: FilterDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null)

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleEscape)
    }
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div 
        ref={drawerRef}
        className="fixed inset-x-0 bottom-0 z-50 md:hidden animate-slide-up"
        style={{ maxHeight: '85vh' }}
      >
        <div 
          className="bg-[var(--bg-primary)] rounded-t-2xl border-t border-[var(--border-primary)]"
          style={{ paddingBottom: 'var(--safe-area-bottom, 0px)' }}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 rounded-full bg-[var(--border-secondary)]" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 pb-4 border-b border-[var(--border-primary)]">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Filters</h2>
            <button 
              onClick={onClose}
              className="p-2 -mr-2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto px-5 py-5 space-y-6" style={{ maxHeight: 'calc(85vh - 160px)' }}>
            {/* Brands */}
            {brands.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Brand</h3>
                <div className="flex flex-wrap gap-2">
                  {brands.map(brand => (
                    <FilterPill
                      key={brand}
                      label={brand}
                      selected={selectedBrands.includes(brand)}
                      onClick={() => onToggleBrand(brand)}
                      size="sm"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Sizes */}
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Size</h3>
              <div className="flex flex-wrap gap-2">
                {sizes.map(size => (
                  <SizeButton
                    key={size}
                    label={size}
                    selected={selectedSizes.includes(size)}
                    onClick={() => onToggleSize(size)}
                  />
                ))}
              </div>
            </div>

            {/* Condition */}
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Condition</h3>
              <div className="flex flex-wrap gap-2">
                {conditions.map(condition => (
                  <ConditionButton
                    key={condition}
                    label={condition}
                    selected={selectedConditions.includes(condition)}
                    onClick={() => onToggleCondition(condition)}
                  />
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Price Range</h3>
              <div className="flex items-center gap-3">
                <div className="relative flex-1 min-w-0">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm pointer-events-none">$</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={priceMin}
                    onChange={(e) => onPriceMinChange(e.target.value)}
                    placeholder="Min"
                    className="w-full pl-8 pr-3 py-3 min-h-[44px]"
                  />
                </div>
                <span className="text-[var(--text-muted)] flex-shrink-0">–</span>
                <div className="relative flex-1 min-w-0">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm pointer-events-none">$</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={priceMax}
                    onChange={(e) => onPriceMaxChange(e.target.value)}
                    placeholder="Max"
                    className="w-full pl-8 pr-3 py-3 min-h-[44px]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex gap-3 px-5 py-4 border-t border-[var(--border-primary)] bg-[var(--bg-secondary)]">
            <button 
              onClick={onClear}
              className="flex-1 btn-secondary"
              disabled={activeCount === 0}
            >
              Clear{activeCount > 0 && ` (${activeCount})`}
            </button>
            <button 
              onClick={() => { onApply(); onClose(); }}
              className="flex-1 btn-primary"
            >
              Show Results
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
