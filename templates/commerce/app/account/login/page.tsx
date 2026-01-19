'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import Header from '../../../components/Header'
import Footer from '../../../components/Footer'

export default function CustomerLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login')

  useEffect(() => {
    // Check if already logged in
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.push('/account')
      }
    })
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
      } else {
        router.push('/account')
        router.refresh()
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/account`,
        },
      })

      if (error) {
        setError(error.message)
      } else {
        setMessage('Check your email for a confirmation link!')
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

  const switchMode = (newMode: 'login' | 'signup' | 'forgot') => {
    setMode(newMode)
    setError(null)
    setMessage(null)
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center pt-20 pb-16">
        <div className="w-full max-w-md px-6">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              {mode === 'login' && 'Sign in to your account'}
              {mode === 'signup' && 'Create an account'}
              {mode === 'forgot' && 'Reset password'}
            </h1>
            <p className="text-[var(--text-secondary)] mt-2">
              {mode === 'login' && 'Track orders and manage your purchases'}
              {mode === 'signup' && 'Join to track orders and get updates'}
              {mode === 'forgot' && 'Enter your email to receive a reset link'}
            </p>
          </div>

          {mode === 'login' && (
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
                    onClick={() => switchMode('forgot')}
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

              <p className="text-center text-sm text-[var(--text-muted)]">
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className="text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors"
                >
                  Sign up
                </button>
              </p>
            </form>
          )}

          {mode === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-6">
              <div>
                <label>Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  autoComplete="name"
                />
              </div>

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
                <label>Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  minLength={6}
                />
                <p className="text-xs text-[var(--text-muted)] mt-1">At least 6 characters</p>
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
                {loading ? 'Creating account...' : 'Create account'}
              </button>

              <p className="text-center text-sm text-[var(--text-muted)]">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors"
                >
                  Sign in
                </button>
              </p>
            </form>
          )}

          {mode === 'forgot' && (
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
                onClick={() => switchMode('login')}
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
