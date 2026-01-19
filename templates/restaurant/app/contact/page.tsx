import { getRestaurantSettings, formatHours } from '@/lib/tenant'
import { Footer } from '@/components/Footer'
import { ReservationWidget } from '@/components/ReservationWidget'
import Link from 'next/link'

export const metadata = {
  title: 'Contact',
}

export default async function ContactPage() {
  const tenant = await getRestaurantSettings()
  const settings = tenant?.settings
  const location = settings?.location
  const contact = settings?.contact
  const reservations = settings?.reservations
  const hours = location?.hours ? formatHours(location.hours) : []

  return (
    <main>
      <header className="hero" style={{ minHeight: '40vh' }}>
        <nav className="site-nav">
          <Link href="/">home</Link>
          <Link href="/menu">menu</Link>
        </nav>
        <div className="hero-content">
          <h1>contact</h1>
        </div>
      </header>

      <section className="section" style={{ minHeight: 'auto', paddingBlock: 'var(--space-lg)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-lg)', maxWidth: '900px', margin: '0 auto' }}>
          
          {/* Location Info */}
          <div>
            <h2>location</h2>
            {location?.address_line1 && <p>{location.address_line1}</p>}
            {location?.address_line2 && <p>{location.address_line2}</p>}
            {(location?.city || location?.region) && (
              <p>
                {[location.city, location.region].filter(Boolean).join(', ')}
                {location.postal_code && ` ${location.postal_code}`}
              </p>
            )}
            {location?.country && <p>{location.country}</p>}

            {location?.coordinates && (
              <a
                href={`https://www.google.com/maps?q=${location.coordinates.lat},${location.coordinates.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-block', marginTop: 'var(--space-sm)', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}
              >
                view on map →
              </a>
            )}
          </div>

          {/* Contact Info */}
          <div>
            <h2>get in touch</h2>
            {(contact?.phone || location?.phone) && (
              <p>
                <a href={`tel:${contact?.phone || location?.phone}`}>
                  {contact?.phone || location?.phone}
                </a>
              </p>
            )}
            {(contact?.email || location?.email) && (
              <p>
                <a href={`mailto:${contact?.email || location?.email}`}>
                  {contact?.email || location?.email}
                </a>
              </p>
            )}
            {contact?.press_email && (
              <p style={{ marginTop: 'var(--space-sm)' }}>
                press: <a href={`mailto:${contact.press_email}`}>{contact.press_email}</a>
              </p>
            )}
            {contact?.events_email && (
              <p>
                events: <a href={`mailto:${contact.events_email}`}>{contact.events_email}</a>
              </p>
            )}
          </div>

          {/* Hours */}
          {hours.length > 0 && (
            <div>
              <h2>hours</h2>
              {hours.map((line, i) => (
                <p key={i} style={{ fontSize: '0.875rem' }}>{line}</p>
              ))}
              {location?.special_hours_note && (
                <p style={{ marginTop: 'var(--space-sm)', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  {location.special_hours_note}
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Reservations Section */}
      {reservations?.enabled && (
        <section className="section" style={{ minHeight: 'auto', paddingBlock: 'var(--space-lg)', borderTop: '1px solid var(--color-border)' }}>
          <h2>reservations</h2>
          <ReservationWidget
            provider={reservations.provider}
            externalUrl={reservations.external_url}
            widgetId={reservations.external_widget_id}
            maxPartySize={reservations.max_party_size}
          />
        </section>
      )}

      <Footer
        name={settings?.theme?.name}
        location={location}
        social={settings?.social}
        footerText={settings?.content?.footer_text}
      />
    </main>
  )
}
