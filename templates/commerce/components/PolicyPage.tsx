'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import Header from '../../../components/Header'
import Footer from '../../../components/Footer'
import { useTenant } from '@/context/TenantContext'
import type { TenantPolicyPage } from '@/types/tenant'

interface PolicyPageProps {
  policyKey: 'shipping' | 'returns' | 'authenticity' | 'privacy' | 'terms'
  defaultTitle: string
  defaultContent: string
}

/**
 * Simple markdown-like parser for policy content
 * Supports: headers (##), bold (**), lists (- or •), links [text](url)
 */
function parseMarkdown(content: string): string {
  let html = content
    // Escape HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Headers
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold text-[var(--text-primary)] mt-6 mb-3">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold text-[var(--text-primary)] mt-8 mb-4">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold text-[var(--text-primary)] mt-8 mb-4">$1</h1>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-[var(--text-primary)]">$1</strong>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-[var(--accent)] hover:underline">$1</a>')
    // Lists
    .replace(/^[-•] (.+)$/gm, '<li class="text-[var(--text-secondary)]">$1</li>')
    // Paragraphs (lines that aren't headers or list items)
    .replace(/^(?!<[h|l])(.+)$/gm, '<p class="text-[var(--text-secondary)] leading-relaxed mb-4">$1</p>')
    // Wrap consecutive list items
    .replace(/(<li[^>]*>.*<\/li>\n?)+/g, '<ul class="space-y-2 mb-4 ml-4 list-disc">$&</ul>')
    // Clean up empty paragraphs
    .replace(/<p[^>]*>\s*<\/p>/g, '')
  
  return html
}

export default function PolicyPage({ policyKey, defaultTitle, defaultContent }: PolicyPageProps) {
  const { settings } = useTenant()
  const brandName = settings?.theme?.brand_name || 'Store'
  const supportEmail = settings?.contact?.email || settings?.email?.support_email || 'support@example.com'
  
  const policy: TenantPolicyPage | undefined = settings?.policies?.[policyKey]
  
  // Check if policy is disabled
  if (policy?.enabled === false) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
        <Header />
        <main className="flex-1 pt-24 pb-16 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Page Not Available</h1>
            <p className="text-[var(--text-secondary)] mb-6">This policy page is not currently available.</p>
            <Link href="/" className="text-[var(--accent)] hover:underline">Return to store</Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }
  
  const title = policy?.title || defaultTitle
  
  // Replace placeholders in content
  const processContent = (content: string) => {
    return content
      .replace(/\{\{brand_name\}\}/g, brandName)
      .replace(/\{\{support_email\}\}/g, supportEmail)
      .replace(/\{\{ship_from_city\}\}/g, settings?.regional?.ship_from_city || 'our warehouse')
      .replace(/\{\{ship_from_region\}\}/g, settings?.regional?.ship_from_region || '')
      .replace(/\{\{ship_from_country\}\}/g, settings?.regional?.ship_from_country || '')
      .replace(/\{\{phone_country_code\}\}/g, settings?.regional?.phone_country_code || '')
      .replace(/\{\{product_term\}\}/g, settings?.storefront?.product_term_singular || 'product')
      .replace(/\{\{products_term\}\}/g, settings?.storefront?.product_term_plural || 'products')
  }
  
  const rawContent = policy?.content || defaultContent
  const processedContent = processContent(rawContent)
  
  const htmlContent = useMemo(() => parseMarkdown(processedContent), [processedContent])
  
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
      <Header />

      <main className="flex-1 pt-24 pb-16">
        <div className="container max-w-3xl">
          <nav className="mb-8">
            <Link href="/" className="text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
              ← Back
            </Link>
          </nav>

          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-8">{title}</h1>

          {policy?.last_updated && (
            <p className="text-sm text-[var(--text-muted)] mb-8">
              Last updated: {new Date(policy.last_updated).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          )}

          <div 
            className="prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
          
          {/* Contact section */}
          <div className="mt-12 p-6 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg">
            <h3 className="font-semibold text-[var(--text-primary)] mb-2">Questions?</h3>
            <p className="text-[var(--text-secondary)] text-sm">
              If you have any questions about this policy, please contact us at{' '}
              <a href={`mailto:${supportEmail}`} className="text-[var(--accent)] hover:underline">
                {supportEmail}
              </a>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
