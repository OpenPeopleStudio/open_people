'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTenant } from '@/context/TenantContext'

// Social media icons component for reuse
function SocialIcon({ platform }: { platform: string }) {
  switch (platform) {
    case 'instagram':
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      )
    case 'twitter':
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      )
    case 'tiktok':
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
        </svg>
      )
    case 'facebook':
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      )
    case 'youtube':
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      )
    default:
      return null
  }
}

interface FooterSectionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}

function FooterSection({ title, children, defaultOpen = false }: FooterSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  
  return (
    <div className="border-b border-[var(--border-primary)] md:border-0">
      {/* Mobile: Collapsible header */}
      <button 
        className="flex items-center justify-between w-full py-4 md:hidden"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className="label-uppercase">{title}</span>
        <svg 
          className={`w-4 h-4 text-[var(--text-muted)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {/* Desktop: Static header */}
      <h4 className="label-uppercase mb-4 hidden md:block">{title}</h4>
      
      {/* Content */}
      <div className={`overflow-hidden transition-all duration-200 ease-out md:!max-h-none md:!opacity-100 md:!pb-0 ${
        isOpen ? 'max-h-96 opacity-100 pb-4' : 'max-h-0 opacity-0'
      }`}>
        {children}
      </div>
    </div>
  )
}

export default function Footer() {
  const { settings, featureFlags } = useTenant()
  const brandName = settings?.theme?.brand_name || 'Store'
  const tagline =
    settings?.content?.hero?.subhead ||
    'Quality products with fast delivery and local pickup.'

  return (
    <footer className="bg-[var(--bg-primary)] border-t border-[var(--glass-border)]">
      <div className="container py-12 md:py-20">
        {/* Mobile: Brand at top */}
        <div className="mb-8 pb-8 border-b border-[var(--glass-border)] md:hidden">
          <Link href="/" className="inline-block">
            <span className="text-2xl font-black tracking-tighter text-gradient">
              {brandName}
            </span>
          </Link>
          <p className="mt-3 text-sm text-[var(--text-secondary)]">
            {tagline}
          </p>
          
          {/* Social links for mobile */}
          {settings?.social && Object.entries(settings.social).some(([, url]) => url) && (
            <div className="flex items-center gap-4 mt-5">
              {settings.social.instagram && (
                <a 
                  href={settings.social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-12 h-12 rounded-full bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-glow)] hover:shadow-[0_0_15px_rgba(255,0,255,0.3)] transition-all duration-300"
                  aria-label="Instagram"
                >
                  <SocialIcon platform="instagram" />
                </a>
              )}
              {settings.social.twitter && (
                <a 
                  href={settings.social.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-12 h-12 rounded-full bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-glow)] hover:shadow-[0_0_15px_rgba(255,0,255,0.3)] transition-all duration-300"
                  aria-label="X (Twitter)"
                >
                  <SocialIcon platform="twitter" />
                </a>
              )}
              {settings.social.tiktok && (
                <a 
                  href={settings.social.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-12 h-12 rounded-full bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-glow)] hover:shadow-[0_0_15px_rgba(255,0,255,0.3)] transition-all duration-300"
                  aria-label="TikTok"
                >
                  <SocialIcon platform="tiktok" />
                </a>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-0 md:gap-12">
          {/* Brand - Desktop only */}
          <div className="hidden md:block md:col-span-1">
            <Link href="/" className="inline-block group">
              <span className="text-2xl font-black tracking-tighter text-gradient">
                {brandName}
              </span>
            </Link>
            <p className="mt-4 text-sm text-[var(--text-secondary)] leading-relaxed">
              {settings?.content?.hero?.subhead || 'Your destination for quality products and great service.'}
            </p>
          </div>

          {/* Shop */}
          <FooterSection title="Shop">
            <ul className="space-y-3">
              <li>
                <Link href="/shop" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                  Shop all
                </Link>
              </li>
              <li>
                <Link href="/shop?sort=newest" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                  New arrivals
                </Link>
              </li>
              {featureFlags.drops !== false && (
                <li>
                  <Link href="/shop?drops=true" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                    Drops
                  </Link>
                </li>
              )}
            </ul>
          </FooterSection>

          {/* Support */}
          <FooterSection title="Support">
            <ul className="space-y-3">
              <li>
                <Link href="/account/orders" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                  Order Status
                </Link>
              </li>
              <li>
                <Link href="/policies/shipping" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                  Shipping & Delivery
                </Link>
              </li>
              <li>
                <Link href="/policies/returns" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                  Returns
                </Link>
              </li>
              <li>
                <Link href="/policies/authenticity" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                  Authenticity
                </Link>
              </li>
              <li>
                <a 
                  href={`mailto:${settings?.contact?.email || 'support@example.com'}`}
                  className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  Contact Us
                </a>
              </li>
            </ul>
          </FooterSection>

          {/* Connect - Desktop only (mobile shows social links at top) */}
          {settings?.social && Object.entries(settings.social).some(([, url]) => url) && (
            <div className="hidden md:block">
              <h4 className="label-uppercase mb-4">Connect</h4>
              <ul className="space-y-3">
                {settings.social.instagram && (
                  <li>
                    <a 
                      href={settings.social.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors inline-flex items-center gap-2"
                    >
                      <SocialIcon platform="instagram" />
                      Instagram
                    </a>
                  </li>
                )}
                {settings.social.twitter && (
                  <li>
                    <a 
                      href={settings.social.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors inline-flex items-center gap-2"
                    >
                      <SocialIcon platform="twitter" />
                      X (Twitter)
                    </a>
                  </li>
                )}
                {settings.social.tiktok && (
                  <li>
                    <a 
                      href={settings.social.tiktok}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors inline-flex items-center gap-2"
                    >
                      <SocialIcon platform="tiktok" />
                      TikTok
                    </a>
                  </li>
                )}
                {settings.social.facebook && (
                  <li>
                    <a 
                      href={settings.social.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors inline-flex items-center gap-2"
                    >
                      <SocialIcon platform="facebook" />
                      Facebook
                    </a>
                  </li>
                )}
                {settings.social.youtube && (
                  <li>
                    <a 
                      href={settings.social.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors inline-flex items-center gap-2"
                    >
                      <SocialIcon platform="youtube" />
                      YouTube
                    </a>
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-[var(--glass-border)]">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-[var(--text-muted)] font-medium">
              {settings?.legal?.copyright_text || `© ${new Date().getFullYear()} ${settings?.legal?.company_name || brandName}. All rights reserved.`}
            </p>
            <div className="flex items-center gap-6">
              <Link 
                href={settings?.legal?.privacy_url || '/policies/privacy'}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all duration-300 font-medium"
              >
                Privacy Policy
              </Link>
              <Link 
                href={settings?.legal?.terms_url || '/policies/terms'}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all duration-300 font-medium"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
