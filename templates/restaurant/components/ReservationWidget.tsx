'use client'

import { useState } from 'react'
import { useTenant } from '@/context/TenantContext'

type ReservationWidgetProps = {
  provider?: 'internal' | 'opentable' | 'resy' | 'yelp' | 'tock' | 'sevenrooms' | 'external'
  externalUrl?: string
  widgetId?: string
  maxPartySize?: number
}

export function ReservationWidget({
  provider = 'internal',
  externalUrl,
  widgetId,
  maxPartySize = 10,
}: ReservationWidgetProps) {
  const { settings } = useTenant()
  const config = settings?.reservations

  const displayProvider = provider || config?.provider || 'internal'
  const displayExternalUrl = externalUrl || config?.external_url
  const displayMaxParty = maxPartySize || config?.max_party_size || 10

  // For external providers, show link
  if (displayProvider !== 'internal' && displayExternalUrl) {
    return (
      <div className="reservation-external">
        <a
          href={displayExternalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="reservation-link"
          style={{
            display: 'inline-block',
            padding: '1rem 2rem',
            border: '1px solid var(--color-text-primary)',
            borderRadius: 'var(--radius-soft)',
            textDecoration: 'none',
            transition: 'all 0.2s ease',
          }}
        >
          make a reservation
        </a>
        <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          via {displayProvider}
        </p>
      </div>
    )
  }

  // Internal reservation form
  return <InternalReservationForm maxPartySize={displayMaxParty} />
}

function InternalReservationForm({ maxPartySize }: { maxPartySize: number }) {
  const { settings } = useTenant()
  const config = settings?.reservations

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    date: '',
    time: '',
    partySize: '2',
    specialRequests: '',
  })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [feedback, setFeedback] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setFeedback('')

    try {
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to submit reservation')
      }

      setStatus('success')
      setFeedback('thank you. we\'ll confirm your reservation shortly.')
      setFormData({
        name: '',
        email: '',
        phone: '',
        date: '',
        time: '',
        partySize: '2',
        specialRequests: '',
      })
    } catch (error) {
      console.error('Reservation error:', error)
      setStatus('error')
      setFeedback('something went wrong. please try again or call us directly.')
    }
  }

  const minDate = new Date()
  minDate.setDate(minDate.getDate() + (config?.min_advance_hours ? Math.ceil(config.min_advance_hours / 24) : 1))
  
  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + (config?.max_advance_days || 60))

  return (
    <form onSubmit={handleSubmit} className="reservation-form" style={{ maxWidth: '500px' }}>
      <div style={{ display: 'grid', gap: 'var(--space-sm)' }}>
        <div>
          <label htmlFor="res-name" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
            name
          </label>
          <input
            id="res-name"
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="email-input"
            disabled={status === 'loading' || status === 'success'}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)' }}>
          <div>
            <label htmlFor="res-email" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
              email
            </label>
            <input
              id="res-email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="email-input"
              disabled={status === 'loading' || status === 'success'}
            />
          </div>
          <div>
            <label htmlFor="res-phone" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
              phone
            </label>
            <input
              id="res-phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="email-input"
              disabled={status === 'loading' || status === 'success'}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-sm)' }}>
          <div>
            <label htmlFor="res-date" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
              date
            </label>
            <input
              id="res-date"
              type="date"
              required
              min={minDate.toISOString().split('T')[0]}
              max={maxDate.toISOString().split('T')[0]}
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="email-input"
              disabled={status === 'loading' || status === 'success'}
            />
          </div>
          <div>
            <label htmlFor="res-time" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
              time
            </label>
            <input
              id="res-time"
              type="time"
              required
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              className="email-input"
              disabled={status === 'loading' || status === 'success'}
            />
          </div>
          <div>
            <label htmlFor="res-party" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
              party size
            </label>
            <select
              id="res-party"
              value={formData.partySize}
              onChange={(e) => setFormData({ ...formData, partySize: e.target.value })}
              className="email-input"
              disabled={status === 'loading' || status === 'success'}
              style={{ width: '100%' }}
            >
              {Array.from({ length: maxPartySize }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? 'guest' : 'guests'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {config?.special_requests_enabled !== false && (
          <div>
            <label htmlFor="res-requests" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
              special requests (optional)
            </label>
            <textarea
              id="res-requests"
              value={formData.specialRequests}
              onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
              className="message-input"
              rows={3}
              disabled={status === 'loading' || status === 'success'}
            />
          </div>
        )}

        <button
          type="submit"
          disabled={status === 'loading' || status === 'success'}
          className={`email-submit ${status === 'loading' ? 'loading' : ''} ${status === 'success' ? 'success' : ''}`}
          style={{ marginTop: 'var(--space-sm)' }}
        >
          {status === 'success' ? 'submitted' : 'request reservation'}
        </button>

        {feedback && (
          <p
            className={`email-message ${status === 'success' ? 'success' : 'error'}`}
            style={{ marginTop: 'var(--space-xs)' }}
          >
            {feedback}
          </p>
        )}

        {config?.cancellation_policy && (
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 'var(--space-sm)' }}>
            {config.cancellation_policy}
          </p>
        )}
      </div>
    </form>
  )
}
