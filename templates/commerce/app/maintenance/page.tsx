import { headers } from 'next/headers'
import MaintenanceLogin from '../../../components/MaintenanceLogin'

async function getMaintenance() {
  const h = await headers()
  const host = h.get('x-forwarded-host') || h.get('host')
  const proto = h.get('x-forwarded-proto') || 'https'

  const origin = host ? `${proto}://${host}` : null
  if (!origin) return { message: null as string | null }

  const res = await fetch(`${origin}/api/maintenance`, { cache: 'no-store' }).catch(() => null)
  if (!res || !res.ok) return { message: null as string | null }

  const data = (await res.json().catch(() => null)) as { message?: string | null } | null
  return { message: data?.message ?? null }
}

export default async function MaintenancePage() {
  const { message } = await getMaintenance()

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--bg-primary)] px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--bg-tertiary),_transparent_65%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-5xl items-center justify-center py-16">
        <div className="w-full max-w-2xl rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-secondary)]/90 p-10 shadow-2xl backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
              709exclusive
            </div>
            <div className="flex items-center gap-2 text-[var(--text-muted)]">
              <div className="h-2 w-2 rounded-full bg-[var(--accent)]" />
              Coming soon
            </div>
          </div>

          <div className="mt-8 flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)]">
              <div className="h-6 w-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-[var(--text-primary)]">Down for maintenance</h1>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                We’re polishing the next drop. We’ll be back shortly.
              </p>
            </div>
          </div>

          {message && (
            <div className="mt-6 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)]/60 p-4">
              <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">{message}</p>
            </div>
          )}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-6">
            <div className="text-sm text-[var(--text-muted)]">
              If you need help right now, message us on Instagram or email support.
            </div>
            <MaintenanceLogin />
          </div>
        </div>
      </div>
    </div>
  )
}
