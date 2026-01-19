import Link from 'next/link'
import PageHeader from '../../../components/admin/PageHeader'
import ActionCard from '../../../components/admin/ActionCard'
import Button from '../../../components/ui/Button'

export default function AdminAppInstallPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="Install Admin App"
        subtitle="Add the admin console to your home screen for a fast, app-like experience"
        actions={
          <Link href="/admin/inbox">
            <Button variant="secondary" size="sm">
              Open inbox
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 md:gap-6 mb-8">
        <ActionCard
          title="Android (Chrome)"
          description="Open admin in Chrome → Menu (⋮) → Install app"
          icon={
            <svg className="w-6 h-6 md:w-7 md:h-7" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.523 15.341c-.736 0-1.372.405-1.729 1.004l-5.847-3.004c.061-.217.093-.445.093-.682s-.032-.465-.093-.682l5.718-2.937c.372.639 1.039 1.073 1.808 1.073 1.159 0 2.1-.942 2.1-2.1s-.941-2.1-2.1-2.1-2.1.942-2.1 2.1c0 .111.009.219.026.325l-5.717 2.937c-.372-.639-1.039-1.073-1.808-1.073-1.159 0-2.1.942-2.1 2.1s.941 2.1 2.1 2.1c.769 0 1.436-.434 1.808-1.073l5.847 3.004c-.017.106-.026.214-.026.325 0 1.159.941 2.1 2.1 2.1s2.1-.941 2.1-2.1-.941-2.1-2.1-2.1z"/>
            </svg>
          }
          badge="Quick"
          badgeColor="success"
        />

        <ActionCard
          title="iPhone / iPad (Safari)"
          description="Open admin in Safari → Share → Add to Home Screen"
          icon={
            <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          }
          badge="iOS"
          badgeColor="info"
        />
      </div>

      <div className="bg-[var(--accent-blue)]/5 border border-[var(--accent-blue)]/20 rounded-xl md:rounded-2xl p-5 md:p-6">
        <div className="flex gap-3 md:gap-4">
          <svg className="w-5 h-5 md:w-6 md:h-6 text-[var(--accent-blue)] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="font-semibold text-[var(--text-primary)] text-sm md:text-base mb-2">
              Why install?
            </h3>
            <ul className="text-xs md:text-sm text-[var(--text-secondary)] space-y-1.5">
              <li>• Opens directly to inbox by default</li>
              <li>• Stays signed in longer</li>
              <li>• Feels native to your device</li>
              <li>• Works offline (when supported)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
