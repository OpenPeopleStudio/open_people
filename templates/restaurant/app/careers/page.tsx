import { getRestaurantSettings } from '@/lib/tenant'
import { Footer } from '@/components/Footer'
import Link from 'next/link'

export const metadata = {
  title: 'Careers',
}

export default async function CareersPage() {
  const tenant = await getRestaurantSettings()
  const settings = tenant?.settings
  const careers = settings?.careers
  const contact = settings?.contact

  const activePositions = careers?.positions?.filter(p => p.active !== false) || []

  return (
    <main>
      <header className="hero" style={{ minHeight: '40vh' }}>
        <nav className="site-nav">
          <Link href="/">home</Link>
          <Link href="/menu">menu</Link>
        </nav>
        <div className="hero-content">
          <h1>careers</h1>
          {careers?.title && <p className="hero-tagline">{careers.title}</p>}
        </div>
      </header>

      <section className="section" style={{ minHeight: 'auto' }}>
        {careers?.description && (
          <p style={{ marginBottom: 'var(--space-lg)' }}>
            <span dangerouslySetInnerHTML={{ __html: careers.description }} />
          </p>
        )}

        {activePositions.length > 0 ? (
          <div style={{ marginTop: 'var(--space-md)' }}>
            <h2>open positions</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
              {activePositions.map((position) => (
                <div
                  key={position.id}
                  style={{
                    padding: 'var(--space-md)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-soft)',
                  }}
                >
                  <h3 style={{ marginBottom: 'var(--space-xs)' }}>{position.title}</h3>
                  {position.type && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: 'var(--space-sm)' }}>
                      {position.type}
                    </p>
                  )}
                  {position.description && (
                    <p style={{ marginBottom: 'var(--space-sm)' }}>{position.description}</p>
                  )}
                  {position.requirements && position.requirements.length > 0 && (
                    <ul style={{ listStyle: 'disc', paddingLeft: '1.25rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                      {position.requirements.map((req, i) => (
                        <li key={i}>{req}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p style={{ color: 'var(--color-text-secondary)' }}>
            no open positions at this time. check back soon.
          </p>
        )}

        {/* Application Info */}
        <div style={{ marginTop: 'var(--space-lg)', paddingTop: 'var(--space-lg)', borderTop: '1px solid var(--color-border)' }}>
          <h2>apply</h2>
          <p style={{ marginTop: 'var(--space-sm)' }}>
            {careers?.application_form_url ? (
              <a
                href={careers.application_form_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  padding: '0.75rem 1.5rem',
                  border: '1px solid var(--color-text-primary)',
                  borderRadius: 'var(--radius-soft)',
                }}
              >
                apply now
              </a>
            ) : (
              <>
                send your resume to{' '}
                <a href={`mailto:${careers?.application_email || contact?.careers_email || contact?.email}`}>
                  {careers?.application_email || contact?.careers_email || contact?.email || 'careers@example.com'}
                </a>
              </>
            )}
          </p>
        </div>
      </section>

      <Footer
        name={settings?.theme?.name}
        location={settings?.location}
        social={settings?.social}
        footerText={settings?.content?.footer_text}
      />
    </main>
  )
}
