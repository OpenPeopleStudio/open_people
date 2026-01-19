'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../@/lib/supabaseClient'
import Header from '../../../components/Header'
import Footer from '../../../components/Footer'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'login' | 'forgot'>('login')
  const [message, setMessage] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
      } else if (data.user) {
        // Check user role to redirect appropriately
        const { data: profile } = await supabase
          .from('709_profiles')
          .select('role')
          .eq('id', data.user.id)
          .single()
        
        const role = profile?.role || ''
        const isAdmin = ['owner', 'admin'].includes(role)
        const isStaff = role === 'staff'
        
        if (isAdmin) {
          router.push('/admin/products')
        } else if (isStaff) {
          router.push('/staff/location')
        } else {
          // Customers should use the customer login
          router.push('/account')
        }
        router.refresh()
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      })

      if (error) {
        setError(error.message)
      } else {
        setMessage('Check your email for a password reset link')
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center pt-20 pb-16">
        <div className="w-full max-w-md px-6">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              {mode === 'login' ? 'Staff Login' : 'Reset password'}
            </h1>
            <p className="text-[var(--text-secondary)] mt-2">
              {mode === 'login' 
                ? 'Sign in to access the admin dashboard' 
                : 'Enter your email to receive a reset link'}
            </p>
          </div>

          {mode === 'login' && (
            <div className="mb-6 p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-center">
              <p className="text-sm text-[var(--text-muted)]">
                Customer?{' '}
                <Link href="/account/login" className="text-[var(--accent)] hover:underline">
                  Sign in here
                </Link>
              </p>
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label>Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="mb-0">Password</label>
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setError(null); setMessage(null); }}
                    className="text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <div className="p-4 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-md">
                  <p className="text-sm text-[var(--error)]">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div>
                <label>Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>

              {error && (
                <div className="p-4 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-md">
                  <p className="text-sm text-[var(--error)]">{error}</p>
                </div>
              )}

              {message && (
                <div className="p-4 bg-[var(--success)]/10 border border-[var(--success)]/20 rounded-md">
                  <p className="text-sm text-[var(--success)]">{message}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center"
              >
                {loading ? 'Sending...' : 'Send reset link'}
              </button>

              <button
                type="button"
                onClick={() => { setMode('login'); setError(null); setMessage(null); }}
                className="w-full text-center text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
              >
                Back to sign in
              </button>
            </form>
          )}

          <p className="mt-8 text-center text-sm text-[var(--text-muted)]">
            <Link href="/" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              ← Back to store
            </Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  )
}
