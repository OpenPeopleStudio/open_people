'use client'

import Link from 'next/link'
import type { RestaurantLocation, SocialLinks } from '@/types/tenant'

type FooterProps = {
  name?: string
  location?: RestaurantLocation
  social?: SocialLinks
  footerText?: string
}

const SocialIcon = ({ platform }: { platform: keyof SocialLinks }) => {
  const icons: Record<string, JSX.Element> = {
    instagram: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ),
    facebook: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
    twitter: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
    tiktok: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
      </svg>
    ),
    yelp: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.16 12.594l-4.995 1.433c-.96.276-1.74-.8-1.176-1.63l2.986-4.375c.522-.765 1.69-.57 1.93.32l.955 3.538c.167.618-.33 1.262-.7 1.262zm-3.22 5.055l-4.037-2.962c-.783-.575-1.713.284-1.41 1.29l1.602 5.305c.268.89 1.475.89 1.95.067l2.145-3.72c.33-.572-.03-1.28-.25-1.98zm-9.12 1.11l2.45-4.263c.48-.836-.56-1.784-1.574-1.44l-5.352 1.812c-.89.302-.89 1.5.067 1.97l3.56 2.104c.56.333 1.28-.03 1.98-.183zm-.32-6.592l5.364 1.08c1.008.204 1.52-1.212.78-2.146l-3.894-4.92c-.65-.82-1.875-.267-1.97.89l-.47 4.62c-.067.576.345 1.14.19 1.476zm3.73-9.167l.946 5.37c.183 1.04 1.64 1.073 2.206.05l2.978-5.387c.49-.89-.352-1.83-1.36-1.51l-4.06 1.252c-.553.17-.894.775-.71 1.225z"/>
      </svg>
    ),
  }
  return icons[platform] || null
}

export function Footer({ name, location, social, footerText }: FooterProps) {
  const currentYear = new Date().getFullYear()
  const socialPlatforms = social ? Object.entries(social).filter(([, url]) => url) : []

  return (
    <footer className="footer">
      <div className="footer-content">
        {/* Social Links */}
        {socialPlatforms.length > 0 && (
          <div className="footer-links" style={{ marginBottom: 'var(--space-md)' }}>
            {socialPlatforms.map(([platform, url]) => (
              <a
                key={platform}
                href={url as string}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={platform}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-secondary)',
                  transition: 'all 0.2s ease',
                }}
              >
                <SocialIcon platform={platform as keyof SocialLinks} />
              </a>
            ))}
          </div>
        )}

        {/* Location Info */}
        {location && (
          <div style={{ marginBottom: 'var(--space-md)', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            {location.address_line1 && <p>{location.address_line1}</p>}
            {(location.city || location.region) && (
              <p>
                {[location.city, location.region].filter(Boolean).join(', ')}
                {location.postal_code && ` ${location.postal_code}`}
              </p>
            )}
            {location.phone && <p>{location.phone}</p>}
            {location.email && (
              <p>
                <a href={`mailto:${location.email}`}>{location.email}</a>
              </p>
            )}
          </div>
        )}

        {/* Quick Links */}
        <div className="footer-links">
          <Link href="/menu">menu</Link>
          <Link href="/about">about</Link>
          <Link href="/contact">contact</Link>
          <Link href="/careers">careers</Link>
        </div>

        {/* Copyright */}
        <p className="footer-text">
          {footerText || `© ${currentYear} ${name || 'restaurant'}. all rights reserved.`}
        </p>
      </div>
    </footer>
  )
}
