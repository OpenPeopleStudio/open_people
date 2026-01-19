'use client'

import { useState } from 'react'

interface ShippingRate {
  method: string
  carrier: string
  price_cents: number
  delivery_days: string
}

interface ShippingEstimatorProps {
  priceCents: number
}

const CANADA_RATES: ShippingRate[] = [
  { method: 'Standard', carrier: 'Canada Post', price_cents: 1500, delivery_days: '5-7 business days' },
  { method: 'Express', carrier: 'Canada Post', price_cents: 2500, delivery_days: '2-3 business days' },
  { method: 'Priority', carrier: 'Purolator', price_cents: 3500, delivery_days: '1-2 business days' },
]

const US_RATES: ShippingRate[] = [
  { method: 'Standard', carrier: 'USPS', price_cents: 2500, delivery_days: '7-10 business days' },
  { method: 'Express', carrier: 'UPS', price_cents: 4500, delivery_days: '3-5 business days' },
]

const LOCAL_DELIVERY = {
  fee_cents: 1000,
  free_threshold_cents: 15000,
  cutoff_time: '2:00 PM',
  delivery_window: 'Same day or next business day',
}

const FREE_SHIPPING_THRESHOLD = 25000 // $250

export default function ShippingEstimator({ priceCents }: ShippingEstimatorProps) {
  const [postalCode, setPostalCode] = useState('')
  const [country, setCountry] = useState<'CA' | 'US'>('CA')
  const [showRates, setShowRates] = useState(false)
  const [isLocalEligible, setIsLocalEligible] = useState(false)

  const checkPostalCode = () => {
    if (!postalCode) return

    // Check for St. John's area postal codes (A1A-A1N)
    const isLocal = /^A1[A-N]/i.test(postalCode.replace(/\s/g, ''))
    setIsLocalEligible(isLocal)
    setShowRates(true)
  }

  const getFreeShippingRemaining = () => {
    const remaining = FREE_SHIPPING_THRESHOLD - priceCents
    return remaining > 0 ? remaining : 0
  }

  const rates = country === 'CA' ? CANADA_RATES : US_RATES

  return (
    <div className="border border-[var(--border-primary)] rounded-lg p-4">
      <h3 className="font-medium text-[var(--text-primary)] mb-3 flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
        Shipping Estimate
      </h3>

      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={postalCode}
          onChange={(e) => setPostalCode(e.target.value.toUpperCase())}
          placeholder={country === 'CA' ? 'A1A 1A1' : '12345'}
          className="flex-1 text-sm"
          maxLength={country === 'CA' ? 7 : 5}
        />
        <select
          value={country}
          onChange={(e) => {
            setCountry(e.target.value as 'CA' | 'US')
            setShowRates(false)
          }}
          className="text-sm bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded px-2"
        >
          <option value="CA">🇨🇦 Canada</option>
          <option value="US">🇺🇸 USA</option>
        </select>
        <button
          onClick={checkPostalCode}
          className="btn-secondary text-sm px-3"
        >
          Check
        </button>
      </div>

      {showRates && (
        <div className="space-y-3">
          {/* Free Shipping Progress */}
          {getFreeShippingRemaining() > 0 && country === 'CA' && (
            <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg">
              <p className="text-sm text-[var(--text-secondary)]">
                Add <span className="font-medium text-[var(--accent)]">${(getFreeShippingRemaining() / 100).toFixed(0)}</span> more for free standard shipping!
              </p>
              <div className="mt-2 h-1.5 bg-[var(--border-primary)] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[var(--accent)] rounded-full transition-all"
                  style={{ width: `${Math.min(100, (priceCents / FREE_SHIPPING_THRESHOLD) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Local Delivery Option */}
          {isLocalEligible && (
            <div className="p-3 bg-[var(--success)]/10 border border-[var(--success)]/20 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[var(--success)]">🚗</span>
                <span className="font-medium text-[var(--text-primary)]">Local Delivery Available!</span>
              </div>
              <p className="text-sm text-[var(--text-secondary)]">
                {priceCents >= LOCAL_DELIVERY.free_threshold_cents 
                  ? 'FREE local delivery'
                  : `$${(LOCAL_DELIVERY.fee_cents / 100).toFixed(0)} delivery fee`
                }
                {' • '}{LOCAL_DELIVERY.delivery_window}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Order by {LOCAL_DELIVERY.cutoff_time} NST for same-day
              </p>
            </div>
          )}

          {/* Shipping Rates */}
          <div className="space-y-2">
            {rates.map((rate, i) => {
              const isFree = priceCents >= FREE_SHIPPING_THRESHOLD && rate.method === 'Standard' && country === 'CA'
              return (
                <div key={i} className="flex justify-between items-center p-2 rounded bg-[var(--bg-tertiary)]">
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {rate.method}
                      <span className="text-[var(--text-muted)] font-normal"> via {rate.carrier}</span>
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">{rate.delivery_days}</p>
                  </div>
                  <span className={`text-sm font-medium ${isFree ? 'text-[var(--success)]' : 'text-[var(--text-primary)]'}`}>
                    {isFree ? 'FREE' : `$${(rate.price_cents / 100).toFixed(2)}`}
                  </span>
                </div>
              )
            })}
          </div>

          {/* US Duties Notice */}
          {country === 'US' && (
            <div className="p-3 bg-[var(--warning)]/10 border border-[var(--warning)]/20 rounded-lg">
              <p className="text-sm text-[var(--warning)]">
                ⚠️ Import duties &amp; taxes may apply and are the customer&apos;s responsibility. 
                Ships from St. John&apos;s, NL, Canada.
              </p>
            </div>
          )}

          {/* Pickup Option */}
          <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <span>📍</span>
              <span className="font-medium text-[var(--text-primary)]">Local Pickup</span>
              <span className="text-sm text-[var(--success)]">FREE</span>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">
              Pick up from St. John&apos;s, NL • Ready within 24 hours
            </p>
          </div>
        </div>
      )}

      {!showRates && (
        <p className="text-sm text-[var(--text-muted)]">
          Enter your postal/zip code for shipping rates and delivery estimates
        </p>
      )}
    </div>
  )
}
