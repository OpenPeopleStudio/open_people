'use client'

import Link from 'next/link'
import { useTenant } from '@/context/TenantContext'

type HeroProps = {
  headline?: string
  subheadline?: string
  backgroundImage?: string
  ctaPrimary?: { label: string; href: string }
  ctaSecondary?: { label: string; href: string }
  showEvents?: boolean
  showCareers?: boolean
}

export function Hero({
  headline,
  subheadline,
  backgroundImage,
  ctaPrimary,
  ctaSecondary,
  showEvents,
  showCareers,
}: HeroProps) {
  const { settings } = useTenant()
  const name = settings?.theme?.name || 'Restaurant'

  // Parse headline to support line breaks
  const renderHeadline = (text?: string) => {
    if (!text) {
      return name.split(' ').map((word, i) => (
        <span key={i}>
          {word}
          {i < name.split(' ').length - 1 && <br />}
        </span>
      ))
    }
    return <span dangerouslySetInnerHTML={{ __html: text }} />
  }

  return (
    <header
      id="hero"
      className="hero"
      style={backgroundImage ? {
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      } : undefined}
    >
      {/* Navigation */}
      {(showEvents || showCareers) && (
        <nav className="site-nav">
          {showEvents && <Link href="/events">events</Link>}
          {showCareers && <Link href="/careers">work with us</Link>}
        </nav>
      )}

      {/* Main Content */}
      <div className="hero-content">
        <h1>{renderHeadline(headline)}</h1>
        {subheadline && (
          <p className="hero-tagline">{subheadline}</p>
        )}

        {/* CTAs */}
        {(ctaPrimary || ctaSecondary) && (
          <div className="hero-ctas" style={{ marginTop: 'var(--space-lg)', display: 'flex', gap: 'var(--space-sm)' }}>
            {ctaPrimary && (
              <Link
                href={ctaPrimary.href}
                className="hero-cta-primary"
                style={{
                  padding: '0.75rem 1.5rem',
                  border: '1px solid var(--color-text-primary)',
                  borderRadius: 'var(--radius-soft)',
                }}
              >
                {ctaPrimary.label}
              </Link>
            )}
            {ctaSecondary && (
              <Link
                href={ctaSecondary.href}
                className="hero-cta-secondary"
                style={{
                  padding: '0.75rem 1.5rem',
                  color: 'var(--color-text-secondary)',
                }}
              >
                {ctaSecondary.label}
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
