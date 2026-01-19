import { getRestaurantSettings } from '@/lib/tenant'
import { Footer } from '@/components/Footer'
import Link from 'next/link'

export const metadata = {
  title: 'Events',
}

export default async function EventsPage() {
  const tenant = await getRestaurantSettings()
  const settings = tenant?.settings
  const events = settings?.events

  const upcomingEvents = events?.upcoming_events?.filter(e => !e.sold_out && new Date(e.date) >= new Date()) || []
  const pastEvents = events?.upcoming_events?.filter(e => new Date(e.date) < new Date()) || []

  return (
    <main>
      <header className="hero" style={{ minHeight: '40vh' }}>
        <nav className="site-nav">
          <Link href="/">home</Link>
          <Link href="/menu">menu</Link>
        </nav>
        <div className="hero-content">
          <h1>events</h1>
        </div>
      </header>

      <section className="section" style={{ minHeight: 'auto' }}>
        {upcomingEvents.length > 0 ? (
          <div>
            <h2>upcoming</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
              {upcomingEvents.map((event) => (
                <article
                  key={event.id}
                  style={{
                    padding: 'var(--space-md)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-soft)',
                  }}
                >
                  {event.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={event.image_url}
                      alt={event.title}
                      style={{
                        width: '100%',
                        height: '200px',
                        objectFit: 'cover',
                        borderRadius: 'var(--radius-soft)',
                        marginBottom: 'var(--space-sm)',
                      }}
                    />
                  )}
                  <h3>{event.title}</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: 'var(--space-xs)' }}>
                    {new Date(event.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                    {event.time && ` • ${event.time}`}
                  </p>
                  {event.description && (
                    <p style={{ marginBottom: 'var(--space-sm)' }}>{event.description}</p>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                    {event.price && (
                      <span style={{ fontWeight: 500 }}>${(event.price / 100).toFixed(0)}</span>
                    )}
                    {event.ticket_url && !event.sold_out && (
                      <a
                        href={event.ticket_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: '0.5rem 1rem',
                          border: '1px solid var(--color-text-primary)',
                          borderRadius: 'var(--radius-soft)',
                          fontSize: '0.875rem',
                        }}
                      >
                        get tickets
                      </a>
                    )}
                    {event.sold_out && (
                      <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>sold out</span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : (
          <p style={{ color: 'var(--color-text-secondary)' }}>
            no upcoming events at this time. check back soon.
          </p>
        )}

        {pastEvents.length > 0 && (
          <div style={{ marginTop: 'var(--space-lg)', paddingTop: 'var(--space-lg)', borderTop: '1px solid var(--color-border)' }}>
            <h2>past events</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', marginTop: 'var(--space-md)', opacity: 0.7 }}>
              {pastEvents.slice(0, 5).map((event) => (
                <div key={event.id}>
                  <span style={{ fontWeight: 500 }}>{event.title}</span>
                  <span style={{ color: 'var(--color-text-muted)', marginLeft: '0.5rem', fontSize: '0.875rem' }}>
                    {new Date(event.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
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
