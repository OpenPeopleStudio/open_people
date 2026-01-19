'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
      <div className="text-center px-6 max-w-lg">
        {/* Error Display */}
        <div className="relative mb-8">
          <div className="w-24 h-24 mx-auto rounded-full bg-[var(--error)]/10 flex items-center justify-center">
            <svg 
              className="w-12 h-12 text-[var(--error)]" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              strokeWidth={1.5}
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" 
              />
            </svg>
          </div>
        </div>

        {/* Message */}
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-3">
          Something went wrong
        </h1>
        <p className="text-[var(--text-secondary)] mb-8">
          We encountered an unexpected error. Please try again.
        </p>

        {/* Error digest for debugging */}
        {error.digest && (
          <p className="text-xs text-[var(--text-muted)] mb-6 font-mono bg-[var(--bg-secondary)] px-3 py-2 rounded-lg inline-block">
            Error ID: {error.digest}
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-[var(--accent)]/25 hover:shadow-xl hover:shadow-[var(--accent)]/30"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            Try Again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-[var(--border-primary)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] font-medium text-sm transition-all duration-200"
          >
            Return Home
          </a>
        </div>

        {/* Help */}
        <p className="mt-8 text-sm text-[var(--text-muted)]">
          If this problem persists, please{' '}
          <a 
            href="/account/messages"
            className="text-[var(--accent)] hover:underline"
          >
            contact support
          </a>
        </p>
      </div>
    </div>
  )
}
