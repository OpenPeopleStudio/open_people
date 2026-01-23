'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'
import { useTenant } from '@/context/TenantContext'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const router = useRouter()
  const { id: tenantId, slug: tenantSlug } = useTenant()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login')
  const emailInputRef = useRef<HTMLInputElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  // Focus email input when modal opens
  useEffect(() => {
    if (isOpen && emailInputRef.current) {
      setTimeout(() => emailInputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleEscape)
    }
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Reset state when closing
  useEffect(() => {
    if (!isOpen) {
      setError(null)
      setMessage(null)
      setMode('login')
    }
  }, [isOpen])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setError('Authentication is not configured. Please check environment variables.')
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        // Provide more user-friendly error messages
        if (error.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please try again.')
        } else if (error.message.includes('Email not confirmed')) {
          setError('Please check your email and confirm your account first.')
        } else {
          setError(error.message)
        }
      } else if (data.session?.user) {
        // Successfully logged in - redirect based on role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.session.user.id)
          .eq('tenant_id', tenantId)
          .single()

        const role = profile?.role || ''
        const isAdmin = ['owner', 'admin'].includes(role)
        const isStaff = role === 'staff'

        onClose()
        if (onSuccess) {
          onSuccess()
          return
        }
        if (isAdmin) {
          router.push('/admin/products')
        } else if (isStaff) {
          router.push('/staff/location')
        } else {
          router.push('/account')
        }
        router.refresh()
      } else {
        setError('Login failed. Please try again.')
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('An unexpected error occurred. Please check your connection.')
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
            tenant_id: tenantId,
            tenant_slug: tenantSlug,
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

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div 
          ref={modalRef}
          className="w-full max-w-md bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-2xl shadow-2xl pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-primary)]">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              {mode === 'login' && 'Sign in'}
              {mode === 'signup' && 'Create account'}
              {mode === 'forgot' && 'Reset password'}
            </h2>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-[var(--bg-secondary)] transition-colors"
            >
              <svg className="w-5 h-5 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {mode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="text-sm">Email</label>
                  <input
                    ref={emailInputRef}
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="mt-1"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center">
                    <label className="text-sm mb-0">Password</label>
                    <button
                      type="button"
                      onClick={() => switchMode('forgot')}
                      className="text-xs text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
                    >
                      Forgot?
                    </button>
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="mt-1"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-lg">
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
                  No account?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('signup')}
                    className="text-[var(--accent)] hover:underline"
                  >
                    Sign up
                  </button>
                </p>
              </form>
            )}

            {mode === 'signup' && (
              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <label className="text-sm">Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    autoComplete="name"
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    minLength={6}
                    className="mt-1"
                  />
                  <p className="text-xs text-[var(--text-muted)] mt-1">At least 6 characters</p>
                </div>

                {error && (
                  <div className="p-3 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-lg">
                    <p className="text-sm text-[var(--error)]">{error}</p>
                  </div>
                )}

                {message && (
                  <div className="p-3 bg-[var(--success)]/10 border border-[var(--success)]/20 rounded-lg">
                    <p className="text-sm text-[var(--success)]">{message}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full justify-center"
                >
                  {loading ? 'Creating...' : 'Create account'}
                </button>

                <p className="text-center text-sm text-[var(--text-muted)]">
                  Have an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="text-[var(--accent)] hover:underline"
                  >
                    Sign in
                  </button>
                </p>
              </form>
            )}

            {mode === 'forgot' && (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                  Enter your email to receive a password reset link.
                </p>
                
                <div>
                  <label className="text-sm">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="mt-1"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-lg">
                    <p className="text-sm text-[var(--error)]">{error}</p>
                  </div>
                )}

                {message && (
                  <div className="p-3 bg-[var(--success)]/10 border border-[var(--success)]/20 rounded-lg">
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
                  ← Back to sign in
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
