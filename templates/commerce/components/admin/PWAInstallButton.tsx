'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isIOS() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent.toLowerCase()
  return /iphone|ipad|ipod/.test(ua)
}

function isStandalone() {
  if (typeof window === 'undefined') return false
  const nav = window.navigator as Navigator & { standalone?: boolean }
  return window.matchMedia?.('(display-mode: standalone)')?.matches || nav.standalone === true
}

export default function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(() => isStandalone())
  const ios = useMemo(() => isIOS(), [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    const onAppInstalled = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onAppInstalled)

    // Best-effort SW registration; scoped to /admin/.
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/admin/sw.js', { scope: '/admin/' }).catch(() => {})
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onAppInstalled)
    }
  }, [])

  if (isInstalled) return null

  if (deferredPrompt) {
    return (
      <button
        type="button"
        onClick={async () => {
          try {
            await deferredPrompt.prompt()
            await deferredPrompt.userChoice
            setDeferredPrompt(null)
          } catch {
            setDeferredPrompt(null)
          }
        }}
        className="btn-secondary text-sm"
        aria-label="Install admin app"
      >
        Install app
      </button>
    )
  }

  // iOS doesn’t support `beforeinstallprompt` — provide in-admin instructions link.
  if (ios) {
    return (
      <Link href="/admin/app" className="btn-secondary text-sm">
        Install app
      </Link>
    )
  }

  return null
}
