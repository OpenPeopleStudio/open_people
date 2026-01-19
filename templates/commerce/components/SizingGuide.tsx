'use client'

import { useState } from 'react'

interface SizingGuideProps {
  brand: string
  model?: string
}

const BRAND_SIZING: Record<string, { fit: string; note: string }> = {
  'Nike': { fit: 'True to size', note: 'Most Nike models run true to size. Air Max may run slightly narrow.' },
  'Jordan': { fit: 'True to size', note: 'Jordan 1s run true to size. Jordan 4s may feel slightly snug - consider half size up if between sizes.' },
  'Adidas': { fit: 'True to size', note: 'Yeezy 350s run small - go half size up. Ultra Boosts are true to size.' },
  'New Balance': { fit: 'True to size', note: 'Most models true to size. 550s may run slightly large.' },
  'Converse': { fit: 'Runs large', note: 'Chuck Taylors run large - go half to full size down.' },
  'Vans': { fit: 'True to size', note: 'Most Vans run true to size. Sk8-His may feel snug initially.' },
  'Asics': { fit: 'True to size', note: 'Gel-Lyte IIIs are true to size with a wider fit.' },
  'Reebok': { fit: 'True to size', note: 'Questions and Club C models run true to size.' },
}

const MODEL_SPECIFIC: Record<string, { fit: string; note: string }> = {
  'Air Jordan 1': { fit: 'True to size', note: 'Consistent sizing across High, Mid, and Low. Break-in period for leather.' },
  'Air Jordan 4': { fit: 'Half size up', note: 'Runs slightly snug. Go half size up if you have wider feet.' },
  'Air Jordan 11': { fit: 'True to size', note: 'Patent leather doesn\'t stretch much. Consider half size up for comfort.' },
  'Dunk Low': { fit: 'True to size', note: 'Leather models true to size. SB Dunks have more padding - go true or half down.' },
  'Dunk High': { fit: 'True to size', note: 'Same as Dunk Low. Ankle collar may feel snug at first.' },
  'Air Force 1': { fit: 'Half size down', note: 'AF1s run large. Most people go half size down.' },
  'Air Max 1': { fit: 'True to size', note: 'Runs slightly narrow. Wide feet may want to go half up.' },
  'Air Max 90': { fit: 'True to size', note: 'Similar to AM1, slightly narrow fit.' },
  'Yeezy 350': { fit: 'Half size up', note: 'Notoriously snug. Always go at least half size up.' },
  'Yeezy 500': { fit: 'True to size', note: 'More room than 350s. True to size for most.' },
  'Ultra Boost': { fit: 'True to size', note: 'Primeknit stretches. True to size or half down for snug fit.' },
}

export default function SizingGuide({ brand, model }: SizingGuideProps) {
  const [showModal, setShowModal] = useState(false)

  // Check for model-specific guidance first
  const modelKey = model ? Object.keys(MODEL_SPECIFIC).find(key => 
    model.toLowerCase().includes(key.toLowerCase())
  ) : null

  const guidance = modelKey 
    ? MODEL_SPECIFIC[modelKey]
    : BRAND_SIZING[brand] || { fit: 'True to size', note: 'No specific sizing notes for this brand.' }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="text-sm text-[var(--accent)] hover:underline flex items-center gap-1"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        Size Guide
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowModal(false)}>
          <div 
            className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg w-full max-w-lg"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-[var(--border-primary)] flex justify-between items-center">
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Sizing Guide</h2>
              <button onClick={() => setShowModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Current Item Guidance */}
              <div className="p-4 bg-[var(--accent)]/10 border border-[var(--accent)]/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 bg-[var(--accent)] text-white text-xs font-medium rounded">
                    {guidance.fit}
                  </span>
                  <span className="font-medium text-[var(--text-primary)]">
                    {modelKey || brand}
                  </span>
                </div>
                <p className="text-sm text-[var(--text-secondary)]">{guidance.note}</p>
              </div>

              {/* Size Conversion Chart */}
              <div>
                <h3 className="font-medium text-[var(--text-primary)] mb-3">Men&apos;s Size Conversion</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border-primary)]">
                        <th className="py-2 px-3 text-left text-[var(--text-muted)]">US</th>
                        <th className="py-2 px-3 text-left text-[var(--text-muted)]">UK</th>
                        <th className="py-2 px-3 text-left text-[var(--text-muted)]">EU</th>
                        <th className="py-2 px-3 text-left text-[var(--text-muted)]">CM</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-primary)]">
                      {[
                        { us: '7', uk: '6', eu: '40', cm: '25' },
                        { us: '8', uk: '7', eu: '41', cm: '26' },
                        { us: '9', uk: '8', eu: '42.5', cm: '27' },
                        { us: '10', uk: '9', eu: '44', cm: '28' },
                        { us: '11', uk: '10', eu: '45', cm: '29' },
                        { us: '12', uk: '11', eu: '46', cm: '30' },
                        { us: '13', uk: '12', eu: '47.5', cm: '31' },
                      ].map((row, i) => (
                        <tr key={i} className="hover:bg-[var(--bg-tertiary)]">
                          <td className="py-2 px-3 text-[var(--text-primary)]">{row.us}</td>
                          <td className="py-2 px-3 text-[var(--text-secondary)]">{row.uk}</td>
                          <td className="py-2 px-3 text-[var(--text-secondary)]">{row.eu}</td>
                          <td className="py-2 px-3 text-[var(--text-secondary)]">{row.cm}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tips */}
              <div className="p-4 bg-[var(--bg-tertiary)] rounded-lg">
                <h4 className="font-medium text-[var(--text-primary)] mb-2">💡 Tips</h4>
                <ul className="text-sm text-[var(--text-secondary)] space-y-1">
                  <li>• Measure your feet in the evening when they&apos;re largest</li>
                  <li>• If between sizes, go up for comfort</li>
                  <li>• Consider sock thickness you&apos;ll wear</li>
                  <li>• Leather shoes stretch; synthetic/mesh don&apos;t</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
