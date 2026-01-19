'use client'

import { useEffect, useState } from 'react'
import Button from '../../../components/ui/Button'
import Surface from '../../../components/ui/Surface'

interface ConsentType {
  consent_code: string
  consent_name: string
  consent_description: string
  category: string
  is_required: boolean
  consent_given: boolean
  consented_at: string | null
}

export default function PrivacyControls() {
  const [consents, setConsents] = useState<ConsentType[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [changes, setChanges] = useState<Map<string, boolean>>(new Map())

  useEffect(() => {
    fetchConsents()
  }, [])

  const fetchConsents = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/account/consents')
      if (!response.ok) {
        throw new Error('Failed to fetch consents')
      }
      const data = await response.json()
      setConsents(data.consents || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load privacy settings')
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = (code: string, currentValue: boolean) => {
    const newChanges = new Map(changes)
    newChanges.set(code, !currentValue)
    setChanges(newChanges)
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccessMessage(null)

      const updatedConsents = Array.from(changes.entries()).map(([code, granted]) => ({
        code,
        granted,
      }))

      const response = await fetch('/api/account/consents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consents: updatedConsents }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save consents')
      }

      setSuccessMessage('Privacy preferences saved successfully')
      setChanges(new Map())
      await fetchConsents()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save privacy settings')
    } finally {
      setSaving(false)
    }
  }

  const getConsentValue = (consent: ConsentType) => {
    return changes.has(consent.consent_code) 
      ? changes.get(consent.consent_code)!
      : consent.consent_given
  }

  const hasChanges = changes.size > 0

  const categoryLabels = {
    essential: 'Essential',
    analytics: 'Analytics & Performance',
    personalization: 'Personalization',
    marketing: 'Marketing',
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'essential': return 'text-[var(--success)]'
      case 'analytics': return 'text-[var(--accent-blue)]'
      case 'personalization': return 'text-[var(--accent-amber)]'
      case 'marketing': return 'text-[var(--text-secondary)]'
      default: return 'text-[var(--text-muted)]'
    }
  }

  if (loading) {
    return (
      <Surface padding="md">
        <div className="text-center py-8">
          <div className="text-[var(--text-muted)]">Loading privacy settings...</div>
        </div>
      </Surface>
    )
  }

  const groupedConsents = consents.reduce((acc, consent) => {
    const category = consent.category
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(consent)
    return acc
  }, {} as Record<string, ConsentType[]>)

  return (
    <div className="space-y-4">
      <Surface padding="md">
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
          Privacy Preferences
        </h2>
        <p className="text-sm text-[var(--text-muted)] mb-6">
          Control how your data is used. Required settings cannot be disabled as they are essential for the platform to function.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-lg">
            <p className="text-sm text-[var(--error)]">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 bg-[var(--success)]/10 border border-[var(--success)]/20 rounded-lg">
            <p className="text-sm text-[var(--success)]">{successMessage}</p>
          </div>
        )}

        <div className="space-y-6">
          {Object.entries(groupedConsents).map(([category, categoryConsents]) => (
            <div key={category}>
              <h3 className={`text-sm font-medium mb-3 ${getCategoryColor(category)}`}>
                {categoryLabels[category as keyof typeof categoryLabels] || category}
              </h3>
              <div className="space-y-3">
                {categoryConsents.map((consent) => {
                  const isEnabled = getConsentValue(consent)
                  return (
                    <div
                      key={consent.consent_code}
                      className="flex items-start justify-between p-3 bg-[var(--bg-secondary)] rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-medium text-[var(--text-primary)]">
                            {consent.consent_name}
                          </h4>
                          {consent.is_required && (
                            <span className="text-xs px-2 py-0.5 bg-[var(--accent)]/20 text-[var(--accent)] rounded">
                              Required
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[var(--text-muted)]">
                          {consent.consent_description}
                        </p>
                        {consent.consented_at && (
                          <p className="text-xs text-[var(--text-muted)] mt-1">
                            Last updated: {new Date(consent.consented_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleToggle(consent.consent_code, consent.consent_given)}
                        disabled={consent.is_required}
                        className={`ml-4 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          isEnabled
                            ? 'bg-[var(--accent)]'
                            : 'bg-[var(--bg-tertiary)]'
                        } ${consent.is_required ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            isEnabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {hasChanges && (
          <div className="mt-6 flex gap-3">
            <Button
              onClick={handleSave}
              variant="primary"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              onClick={() => setChanges(new Map())}
              variant="ghost"
              disabled={saving}
            >
              Cancel
            </Button>
          </div>
        )}
      </Surface>

      <Surface padding="md" variant="outline">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">
          About Your Privacy
        </h3>
        <div className="text-xs text-[var(--text-muted)] space-y-2">
          <p>
            We respect your privacy and give you control over your data. You can change these preferences at any time.
          </p>
          <p>
            All changes are logged for compliance purposes. You can view your consent history in your privacy dashboard.
          </p>
        </div>
      </Surface>
    </div>
  )
}
