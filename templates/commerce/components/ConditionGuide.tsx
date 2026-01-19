'use client'

import { useState } from 'react'

const CONDITIONS = [
  {
    code: 'DS',
    name: 'Deadstock',
    description: 'Brand new, never worn. Original box and all accessories included.',
    details: [
      'Never tried on or worn',
      'All original tags attached',
      'Original box in excellent condition',
      'All accessories/extras included',
    ],
    priceNote: 'Premium pricing',
  },
  {
    code: 'VNDS',
    name: 'Very Near Deadstock',
    description: 'Tried on once or twice indoors. No visible wear.',
    details: [
      'Tried on indoors only',
      'No creasing on toe box',
      'Sole shows no wear',
      'Original box included (may have minor shelf wear)',
    ],
    priceNote: '~10% below DS',
  },
  {
    code: 'PADS',
    name: 'Pass as Deadstock',
    description: 'Worn briefly, shows minimal signs. Could pass as new to most.',
    details: [
      'Light indoor/outdoor wear',
      'Minor creasing possible',
      'Soles clean with minimal wear',
      'Box included (condition varies)',
    ],
    priceNote: '~15% below DS',
  },
  {
    code: 'USED',
    name: 'Used - Good',
    description: 'Worn with visible signs of use but still in good condition.',
    details: [
      'Normal creasing present',
      'Some sole wear visible',
      'May have minor scuffs',
      'Box may or may not be included',
    ],
    priceNote: '~30% below DS',
  },
  {
    code: 'BEATER',
    name: 'Beater',
    description: 'Well-worn, ideal for daily use without worry.',
    details: [
      'Heavy creasing/wear',
      'Visible sole wear',
      'Scuffs and marks present',
      'Sold as-is, no box',
    ],
    priceNote: '~50% below DS',
  },
]

interface ConditionGuideProps {
  currentCondition?: string
  inline?: boolean
}

export default function ConditionGuide({ currentCondition, inline = false }: ConditionGuideProps) {
  const [showModal, setShowModal] = useState(false)

  const current = currentCondition ? CONDITIONS.find(c => c.code === currentCondition) : null

  if (inline && current) {
    return (
      <div className="flex items-start gap-3 p-3 bg-[var(--bg-tertiary)] rounded-lg">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-[var(--accent)]/20 text-[var(--accent)] text-xs font-medium rounded">
              {current.code}
            </span>
            <span className="font-medium text-[var(--text-primary)]">{current.name}</span>
          </div>
          <p className="text-sm text-[var(--text-secondary)] mt-1">{current.description}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="text-xs text-[var(--accent)] hover:underline whitespace-nowrap"
        >
          View Guide
        </button>
      </div>
    )
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="text-sm text-[var(--accent)] hover:underline flex items-center gap-1"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Condition Guide
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowModal(false)}>
          <div 
            className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-[var(--border-primary)] flex justify-between items-center sticky top-0 bg-[var(--bg-secondary)]">
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Condition Guide</h2>
              <button onClick={() => setShowModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              <p className="text-[var(--text-secondary)]">
                All items are professionally inspected and graded. Here&apos;s what each condition means:
              </p>

              {CONDITIONS.map(condition => (
                <div 
                  key={condition.code}
                  className={`p-4 rounded-lg border-2 ${
                    currentCondition === condition.code
                      ? 'border-[var(--accent)] bg-[var(--accent)]/5'
                      : 'border-[var(--border-primary)]'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 bg-[var(--bg-tertiary)] text-[var(--text-primary)] font-bold rounded">
                      {condition.code}
                    </span>
                    <h3 className="font-semibold text-[var(--text-primary)]">{condition.name}</h3>
                    <span className="text-xs text-[var(--text-muted)] ml-auto">{condition.priceNote}</span>
                  </div>
                  <p className="text-[var(--text-secondary)] mb-3">{condition.description}</p>
                  <ul className="grid grid-cols-2 gap-2">
                    {condition.details.map((detail, i) => (
                      <li key={i} className="text-sm text-[var(--text-muted)] flex items-center gap-2">
                        <span className="text-[var(--success)]">✓</span>
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              <div className="p-4 bg-[var(--bg-tertiary)] rounded-lg">
                <h4 className="font-medium text-[var(--text-primary)] mb-2">Our Promise</h4>
                <ul className="text-sm text-[var(--text-secondary)] space-y-1">
                  <li>✓ All items authenticated by trained staff</li>
                  <li>✓ Detailed photos of actual item you&apos;ll receive</li>
                  <li>✓ Any defects clearly noted in listing</li>
                  <li>✓ 7-day return if item doesn&apos;t match description</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
