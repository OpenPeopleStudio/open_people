'use client'

import { useState, useMemo } from 'react'
import { helpSections, getHelpForRole, searchHelp, type HelpSection } from '@/lib/adminHelp'
import ReactMarkdown from 'react-markdown'

interface HelpModalProps {
  isOpen: boolean
  onClose: () => void
  userRole: string
}

export default function HelpModal({ isOpen, onClose, userRole }: HelpModalProps) {
  const [selectedSection, setSelectedSection] = useState<string | null>(null)
  const [selectedSubsection, setSelectedSubsection] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  const availableSections = useMemo(() => getHelpForRole(userRole), [userRole])
  
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    return searchHelp(searchQuery, userRole)
  }, [searchQuery, userRole])

  const currentSection = useMemo(() => 
    availableSections.find(s => s.id === selectedSection),
    [availableSections, selectedSection]
  )

  const currentSubsection = useMemo(() => 
    currentSection?.subsections.find(s => s.id === selectedSubsection),
    [currentSection, selectedSubsection]
  )

  const handleSearchResultClick = (sectionId: string, subsectionId: string) => {
    setSelectedSection(sectionId)
    setSelectedSubsection(subsectionId)
    setIsSearching(false)
    setSearchQuery('')
  }

  const handleBackToSections = () => {
    setSelectedSection(null)
    setSelectedSubsection(null)
  }

  const handleBackToSubsections = () => {
    setSelectedSubsection(null)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-4xl h-[90vh] bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-primary)]">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Help & Documentation</h2>
              <p className="text-sm text-[var(--text-muted)]">
                {userRole === 'owner' ? 'Owner' : userRole === 'admin' ? 'Admin' : 'Staff'} guide
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-6 border-b border-[var(--border-primary)]">
          <div className="relative">
            <input
              type="text"
              placeholder="Search help articles..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setIsSearching(e.target.value.length > 0)
              }}
              className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-elevated)] py-2 pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Search Results */}
          {isSearching && searchQuery && (
            <div className="space-y-3">
              {searchResults.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-[var(--text-muted)]">No results found for "{searchQuery}"</p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-[var(--text-muted)] mb-4">
                    {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                  </p>
                  {searchResults.map((result, index) => (
                    <button
                      key={index}
                      onClick={() => handleSearchResultClick(result.sectionId, result.subsectionId)}
                      className="w-full text-left p-4 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-elevated)] hover:border-[var(--accent)] transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[var(--text-muted)] mb-1">{result.sectionTitle}</p>
                          <h3 className="font-semibold text-[var(--text-primary)] mb-2">{result.subsectionTitle}</h3>
                          <p className="text-sm text-[var(--text-secondary)] line-clamp-2">{result.excerpt}</p>
                        </div>
                        <svg className="w-5 h-5 text-[var(--text-muted)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </>
              )}
            </div>
          )}

          {/* Section Content */}
          {!isSearching && currentSubsection && (
            <div className="prose prose-invert max-w-none">
              <button
                onClick={handleBackToSubsections}
                className="flex items-center gap-2 text-sm text-[var(--accent)] hover:text-[var(--accent-hover)] mb-6"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to {currentSection?.title}
              </button>
              <ReactMarkdown
                components={{
                  h1: ({ children }) => <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-4">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-xl font-semibold text-[var(--text-primary)] mt-6 mb-3">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-lg font-semibold text-[var(--text-primary)] mt-4 mb-2">{children}</h3>,
                  p: ({ children }) => <p className="text-[var(--text-secondary)] mb-4 leading-relaxed">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc list-inside text-[var(--text-secondary)] mb-4 space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside text-[var(--text-secondary)] mb-4 space-y-1">{children}</ol>,
                  li: ({ children }) => <li className="ml-4">{children}</li>,
                  code: ({ children, className }) => {
                    const isBlock = className?.includes('language-')
                    if (isBlock) {
                      return (
                        <pre className="bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg p-4 mb-4 overflow-x-auto">
                          <code className="text-sm text-[var(--text-primary)] font-mono">{children}</code>
                        </pre>
                      )
                    }
                    return <code className="bg-[var(--bg-tertiary)] text-[var(--accent)] px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
                  },
                  img: ({ src, alt }) => {
                    const imageSrc = typeof src === 'string' 
                      ? (src.startsWith('/') ? src : `/${src}`)
                      : ''
                    
                    return (
                      <div className="my-6">
                        <img 
                          src={imageSrc} 
                          alt={alt || ''} 
                          className="rounded-lg border border-[var(--border-primary)] w-full"
                          loading="lazy"
                        onError={(e) => {
                          // Hide broken images or show placeholder
                          const img = e.target as HTMLImageElement
                          img.style.display = 'none'
                          const parent = img.parentElement
                          if (parent && !parent.querySelector('.image-placeholder')) {
                            const placeholder = document.createElement('div')
                            placeholder.className = 'image-placeholder flex items-center justify-center h-48 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-muted)] text-sm'
                            placeholder.innerHTML = `
                              <div class="text-center p-4">
                                <svg class="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <p>Screenshot: ${alt || src}</p>
                                <p class="text-xs mt-1 opacity-75">Image will be added soon</p>
                              </div>
                            `
                            parent.appendChild(placeholder)
                          }
                        }}
                      />
                      {alt && (
                        <p className="text-xs text-[var(--text-muted)] italic mt-2 text-center">{alt}</p>
                      )}
                      </div>
                    )
                  },
                  strong: ({ children }) => <strong className="font-semibold text-[var(--text-primary)]">{children}</strong>,
                  a: ({ children, href }) => <a href={href} className="text-[var(--accent)] hover:text-[var(--accent-hover)] underline" target="_blank" rel="noopener noreferrer">{children}</a>,
                  table: ({ children }) => <div className="overflow-x-auto mb-4"><table className="min-w-full border border-[var(--border-primary)] rounded-lg">{children}</table></div>,
                  thead: ({ children }) => <thead className="bg-[var(--bg-tertiary)]">{children}</thead>,
                  th: ({ children }) => <th className="px-4 py-2 text-left text-sm font-semibold text-[var(--text-primary)] border-b border-[var(--border-primary)]">{children}</th>,
                  td: ({ children }) => <td className="px-4 py-2 text-sm text-[var(--text-secondary)] border-b border-[var(--border-primary)]">{children}</td>,
                }}
              >
                {currentSubsection.content}
              </ReactMarkdown>
            </div>
          )}

          {/* Subsection List */}
          {!isSearching && selectedSection && !selectedSubsection && currentSection && (
            <div>
              <button
                onClick={handleBackToSections}
                className="flex items-center gap-2 text-sm text-[var(--accent)] hover:text-[var(--accent-hover)] mb-6"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to all topics
              </button>
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">{currentSection.title}</h2>
              <div className="grid gap-3">
                {currentSection.subsections.map((subsection) => (
                  <button
                    key={subsection.id}
                    onClick={() => setSelectedSubsection(subsection.id)}
                    className="text-left p-4 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-elevated)] hover:border-[var(--accent)] hover:bg-[var(--bg-tertiary)] transition-all group"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                        {subsection.title}
                      </h3>
                      <svg className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Section List */}
          {!isSearching && !selectedSection && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setSelectedSection(section.id)}
                  className="text-left p-6 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-elevated)] hover:border-[var(--accent)] hover:bg-[var(--bg-tertiary)] transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] group-hover:bg-[var(--accent)] group-hover:text-white transition-colors">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={section.icon} />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[var(--text-primary)] mb-1 group-hover:text-[var(--accent)] transition-colors">
                        {section.title}
                      </h3>
                      <p className="text-sm text-[var(--text-muted)]">
                        {section.subsections.length} article{section.subsections.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <svg className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
