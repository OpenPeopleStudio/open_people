'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import Header from '../../../../components/Header'
import Footer from '../../../../components/Footer'
import Button from '../../../../components/ui/Button'

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export default function TenantSignupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'auth' | 'tenant'>('auth')
  
  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    fullName: '',
  })
  
  const [tenantForm, setTenantForm] = useState({
    name: '',
    slug: '',
    primaryDomain: '',
    billingEmail: '',
  })
  
  const [slugTouched, setSlugTouched] = useState(false)

  const handleAuthSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error: signupError } = await supabase.auth.signUp({
        email: authForm.email.trim().toLowerCase(),
        password: authForm.password,
        options: {
          data: {
            full_name: authForm.fullName.trim() || null,
          },
        },
      })

      if (signupError) {
        setError(signupError.message)
        setLoading(false)
        return
      }

      if (!data.user) {
        setError('Signup failed. Please try again.')
        setLoading(false)
        return
      }

      setStep('tenant')
      setTenantForm((prev) => ({
        ...prev,
        billingEmail: authForm.email.trim().toLowerCase(),
      }))
    } catch (err) {
      console.error('Signup error:', err)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleTenantCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/tenants/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tenantForm),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(data.error || 'Failed to create tenant')
        setLoading(false)
        return
      }

      router.push('/admin/tenant-settings?welcome=true')
    } catch (err) {
      console.error('Tenant creation error:', err)
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
      <Header />

      <main className="flex-1 pt-24 pb-16 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-6">
            {step === 'auth' ? (
              <>
                <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                  Create your account
                </h1>
                <p className="text-sm text-[var(--text-muted)] mb-6">
                  Start your 14-day free trial. No credit card required.
                </p>

                {error && (
                  <div className="mb-4 p-3 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-lg">
                    <p className="text-sm text-[var(--error)]">{error}</p>
                  </div>
                )}

                <form onSubmit={handleAuthSignup} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      Full name
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-elevated)] p-2 text-sm text-[var(--text-primary)]"
                      value={authForm.fullName}
                      onChange={(e) => setAuthForm((prev) => ({ ...prev, fullName: e.target.value }))}
                      placeholder="Your name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-elevated)] p-2 text-sm text-[var(--text-primary)]"
                      value={authForm.email}
                      onChange={(e) => setAuthForm((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="you@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-elevated)] p-2 text-sm text-[var(--text-primary)]"
                      value={authForm.password}
                      onChange={(e) => setAuthForm((prev) => ({ ...prev, password: e.target.value }))}
                      placeholder="At least 6 characters"
                    />
                  </div>

                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? 'Creating account...' : 'Continue'}
                  </Button>
                </form>

                <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
                  Already have an account?{' '}
                  <Link href="/login" className="text-[var(--accent)] hover:underline">
                    Sign in
                  </Link>
                </p>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                  Create your store
                </h1>
                <p className="text-sm text-[var(--text-muted)] mb-6">
                  Set up your marketplace in seconds.
                </p>

                {error && (
                  <div className="mb-4 p-3 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-lg">
                    <p className="text-sm text-[var(--error)]">{error}</p>
                  </div>
                )}

                <form onSubmit={handleTenantCreate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      Store name
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-elevated)] p-2 text-sm text-[var(--text-primary)]"
                      value={tenantForm.name}
                      onChange={(e) => {
                        const nextName = e.target.value
                        setTenantForm((prev) => ({
                          ...prev,
                          name: nextName,
                          slug: slugTouched ? prev.slug : slugify(nextName),
                        }))
                      }}
                      placeholder="My Store"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      Store slug
                    </label>
                    <input
                      type="text"
                      required
                      pattern="[a-z0-9]([a-z0-9-]*[a-z0-9])?"
                      className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-elevated)] p-2 text-sm text-[var(--text-primary)] font-mono"
                      value={tenantForm.slug}
                      onChange={(e) => {
                        setSlugTouched(true)
                        setTenantForm((prev) => ({ ...prev, slug: slugify(e.target.value) }))
                      }}
                      placeholder="my-store"
                    />
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      Your store will be available at: {tenantForm.slug || 'my-store'}.709exclusive.shop
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      Custom domain (optional)
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-elevated)] p-2 text-sm text-[var(--text-primary)]"
                      value={tenantForm.primaryDomain}
                      onChange={(e) => setTenantForm((prev) => ({ ...prev, primaryDomain: e.target.value }))}
                      placeholder="store.example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      Billing email
                    </label>
                    <input
                      type="email"
                      required
                      className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-elevated)] p-2 text-sm text-[var(--text-primary)]"
                      value={tenantForm.billingEmail}
                      onChange={(e) => setTenantForm((prev) => ({ ...prev, billingEmail: e.target.value }))}
                      placeholder="billing@example.com"
                    />
                  </div>

                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? 'Creating store...' : 'Start free trial'}
                  </Button>
                </form>
              </>
            )}
          </div>

          <div className="mt-6 text-center text-xs text-[var(--text-muted)]">
            By signing up, you agree to our Terms of Service and Privacy Policy.
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
