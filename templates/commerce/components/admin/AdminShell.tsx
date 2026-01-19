'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'
import PWAInstallButton from './PWAInstallButton'
import HelpModal from './HelpModal'
import { useTenant } from '@/context/TenantContext'

interface NavItem {
  href: string
  label: string
  icon: string
}

interface AdminShellProps {
  children: React.ReactNode
  userEmail?: string | null
  navItems: NavItem[]
  isSuperAdmin?: boolean
  userRole?: string
}

export default function AdminShell({ children, userEmail, navItems, isSuperAdmin = false, userRole = 'admin' }: AdminShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { settings } = useTenant()
  const brandName = isSuperAdmin ? '709exclusive' : (settings?.theme?.brand_name || 'Store')
  const adminTitle = isSuperAdmin ? 'Super Admin' : 'Admin'

  const handleSignOut = async () => {
    if (isSigningOut) return
    setIsSigningOut(true)
    try {
      await supabase.auth.signOut()
      setIsSidebarOpen(false)
      router.push('/')
      router.refresh()
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-[var(--bg-secondary)] border-b border-[var(--border-primary)] flex items-center justify-between px-4 lg:hidden">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 -ml-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="text-lg font-bold text-[var(--text-primary)]">{brandName} {adminTitle}</span>
        <div className="w-10" /> {/* Spacer */}
      </header>

      {/* Desktop Header */}
      <header className="hidden lg:flex fixed top-0 left-0 right-0 z-50 h-16 bg-[var(--bg-secondary)] border-b border-[var(--border-primary)] items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link href={isSuperAdmin ? "/super-admin/tenants" : "/admin/products"} className="flex items-center gap-2">
            <span className="text-xl font-black tracking-tighter text-[var(--text-primary)]">{brandName}</span>
            <span className="text-sm font-medium text-[var(--text-muted)]">{adminTitle}</span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsHelpOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-all"
            title="Help & Documentation"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="hidden md:inline">Help</span>
          </button>
          <PWAInstallButton />
          <details className="relative hidden md:block">
            <summary className="list-none">
              <button
                type="button"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-all"
                aria-label="Account menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </summary>
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] shadow-xl">
              {userEmail && (
                <div className="px-4 py-3 border-b border-[var(--border-primary)] text-xs text-[var(--text-muted)] truncate">
                  {userEmail}
                </div>
              )}
              <div className="py-2">
                <Link
                  href="/account/settings"
                  className="block px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                >
                  Account settings
                </Link>
                {!isSuperAdmin && (
                  <Link
                    href="/admin/tenant-settings"
                    className="block px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                  >
                    Tenant settings
                  </Link>
                )}
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className={`w-full text-left px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors ${
                    isSigningOut ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                >
                  Sign out
                </button>
              </div>
            </div>
          </details>
          {!isSuperAdmin && (
            <Link 
              href="/" 
              className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors hidden md:inline"
            >
              View Store →
            </Link>
          )}
        </div>
      </header>

      {/* Sidebar Overlay (Mobile) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-64 bg-[var(--bg-secondary)] border-r border-[var(--border-primary)] overflow-y-auto transition-transform duration-300 ease-in-out
        lg:top-16 lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-[var(--border-primary)] lg:hidden">
           <span className="text-xl font-black tracking-tighter text-[var(--accent)]">{brandName} {adminTitle}</span>
           <button 
             onClick={() => setIsSidebarOpen(false)}
             className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
           >
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
             </svg>
           </button>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname?.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors group ${
                  isActive 
                    ? 'bg-[var(--accent)]/10 text-[var(--accent)]' 
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                }`}
              >
                <svg 
                  className={`w-5 h-5 transition-colors ${
                    isActive ? 'text-[var(--accent)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]'
                  }`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                </svg>
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {!isSuperAdmin && (
          <div className="px-4 pb-4">
            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Settings
            </div>
            <div className="space-y-1">
              <Link
                href="/admin/tenant-settings"
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors group ${
                  pathname?.startsWith('/admin/tenant-settings')
                    ? 'bg-[var(--accent)]/10 text-[var(--accent)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                }`}
              >
                <svg
                  className={`w-5 h-5 transition-colors ${
                    pathname?.startsWith('/admin/tenant-settings')
                      ? 'text-[var(--accent)]'
                      : 'text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]'
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3l8 4v6c0 5-3.5 8-8 8s-8-3-8-8V7l8-4z" />
                </svg>
                <span className="font-medium">Tenant</span>
              </Link>
            </div>
          </div>
        )}
        
        {/* Mobile footer links */}
        <div className="p-4 border-t border-[var(--border-primary)] lg:hidden mt-auto">
           <div className="flex items-center gap-3 mb-4">
             {userEmail && (
               <div className="w-8 h-8 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center text-[var(--text-secondary)] shrink-0">
                 {userEmail[0].toUpperCase()}
               </div>
             )}
             <div className="flex-1 min-w-0">
               <p className="text-sm font-medium text-[var(--text-primary)] truncate">{userEmail}</p>
             </div>
           </div>
          <div className="grid gap-2">
            <button
              type="button"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className={`block w-full text-center px-4 py-2 border border-[var(--border-primary)] rounded-md text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors ${
                isSigningOut ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              Sign out
            </button>
            {!isSuperAdmin && (
              <Link 
               href="/" 
               className="block w-full text-center px-4 py-2 border border-[var(--border-primary)] rounded-md text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                View Store
              </Link>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 min-h-screen transition-all duration-300">
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Help Modal */}
      <HelpModal 
        isOpen={isHelpOpen} 
        onClose={() => setIsHelpOpen(false)}
        userRole={isSuperAdmin ? 'owner' : userRole}
      />
    </div>
  )
}