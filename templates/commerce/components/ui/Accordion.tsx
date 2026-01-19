'use client'

import { useState, ReactNode } from 'react'

interface AccordionItemProps {
  title: string
  children: ReactNode
  defaultOpen?: boolean
}

export function AccordionItem({ title, children, defaultOpen = false }: AccordionItemProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border-b border-[var(--border-primary)] last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full py-4 text-left"
        aria-expanded={isOpen}
      >
        <span className="font-medium text-[var(--text-primary)]">{title}</span>
        <svg 
          className={`w-5 h-5 text-[var(--text-muted)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div 
        className={`overflow-hidden transition-all duration-200 ease-out ${
          isOpen ? 'max-h-[500px] opacity-100 pb-4' : 'max-h-0 opacity-0'
        }`}
      >
        {children}
      </div>
    </div>
  )
}

interface AccordionProps {
  children: ReactNode
  className?: string
}

export default function Accordion({ children, className = '' }: AccordionProps) {
  return (
    <div className={`bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-primary)] px-4 ${className}`}>
      {children}
    </div>
  )
}
