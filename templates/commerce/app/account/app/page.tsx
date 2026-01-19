import Link from 'next/link'

export default function AccountAppInstallPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <main className="pt-24 pb-16 md:pt-28 md:pb-24">
        <div className="container max-w-2xl">
          <div className="flex items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">Install Support App</h1>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                Add 709 Support to your home screen for faster replies and a cleaner chat experience.
              </p>
            </div>
            <Link href="/account/messages" className="btn-secondary text-sm">
              Open messages
            </Link>
          </div>

          <div className="grid gap-4">
            <div className="p-6 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Android (Chrome)</h2>
              <ol className="text-sm text-[var(--text-secondary)] space-y-1 list-decimal list-inside">
                <li>Open your account in Chrome.</li>
                <li>Tap the menu (⋮) or the install banner.</li>
                <li>Select “Install app”.</li>
              </ol>
            </div>

            <div className="p-6 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">iPhone / iPad (Safari)</h2>
              <ol className="text-sm text-[var(--text-secondary)] space-y-1 list-decimal list-inside">
                <li>Open your account in Safari.</li>
                <li>Tap Share.</li>
                <li>Select “Add to Home Screen”.</li>
              </ol>
            </div>

            <div className="p-6 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Tip</h2>
              <p className="text-sm text-[var(--text-secondary)]">
                Use the installed app for support chats. Orders and tracking still live in your account.
              </p>
            </div>
          </div>

          <div className="mt-8">
            <Link href="/account" className="text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
              ← Back to account
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
