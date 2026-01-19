'use client'

import Link from 'next/link'
import { useTenant } from '../context/TenantContext'

export default function NotFound() {
  const { settings } = useTenant()
  const brandName = settings?.theme?.brand_name || 'Store'

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
      <div className="text-center px-6 max-w-lg">
        {/* 404 Display */}
        <div className="relative mb-8">
          <span className="text-[150px] font-black text-[var(--bg-tertiary)] leading-none select-none">
            404
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <svg 
              className="w-24 h-24 text-[var(--accent)]" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              strokeWidth={1.5}
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M15.182 16.318A4.486 4.486 0 0012.016 15a4.486 4.486 0 00-3.198 1.318M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" 
              />
            </svg>
          </div>
        </div>

        {/* Message */}
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-3">
          Page Not Found
        </h1>
        <p className="text-[var(--text-secondary)] mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-[var(--accent)]/25 hover:shadow-xl hover:shadow-[var(--accent)]/30"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
            Back to {brandName}
          </Link>
          <Link
            href="/shop"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-[var(--border-primary)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] font-medium text-sm transition-all duration-200"
          >
            Browse Shop
          </Link>
        </div>

        {/* Help */}
        <p className="mt-8 text-sm text-[var(--text-muted)]">
          Need help?{' '}
          <Link 
            href={`mailto:${settings?.contact?.email || 'support@example.com'}`}
            className="text-[var(--accent)] hover:underline"
          >
            Contact support
          </Link>
        </p>
      </div>
    </div>
  )
}
