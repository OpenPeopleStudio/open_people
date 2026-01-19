'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useCart } from '../context/CartContext'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import LoginModal from './LoginModal'
import { useTenant } from '@/context/TenantContext'

export default function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { itemCount, isHydrated } = useCart()
  const { id: tenantId, featureFlags } = useTenant()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setIsLoggedIn(!!user)
      
      if (user) {
        const { data: profile } = await supabase
          .from('709_profiles')
          .select('role')
          .eq('id', user.id)
          .eq('tenant_id', tenantId)
          .single()
        
        setUserRole(profile?.role || null)
      }
    }
    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setIsLoggedIn(!!session?.user)
      
      if (session?.user) {
        const { data: profile } = await supabase
          .from('709_profiles')
          .select('role')
          .eq('id', session.user.id)
          .eq('tenant_id', tenantId)
          .single()
        
        setUserRole(profile?.role || null)
      } else {
        setUserRole(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const isAdmin = userRole === 'owner' || userRole === 'admin'
  const isStaff = userRole === 'staff'

  const canAccessAdmin = featureFlags.admin !== false
  const accountLink = isLoggedIn
    ? (isAdmin && canAccessAdmin ? '/admin/products' : isStaff ? '/staff/location' : '/account')
    : '/account/login'

  // Hide on admin/staff pages
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/staff')) {
    return null
  }

  const navItems = [
    {
      href: '/',
      label: 'Shop',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
        </svg>
      ),
      isActive: pathname === '/' || pathname?.startsWith('/product'),
    },
    {
      href: '/cart',
      label: 'Cart',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
      ),
      isActive: pathname === '/cart' || pathname === '/checkout',
      badge: isHydrated && itemCount > 0 ? (itemCount > 99 ? '99+' : itemCount) : null,
    },
    {
      href: '/account/orders',
      label: 'Orders',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
        </svg>
      ),
      isActive: pathname === '/account/orders',
    },
    {
      href: accountLink,
      label: isLoggedIn ? (isAdmin && canAccessAdmin ? 'Admin' : isStaff ? 'Staff' : 'Account') : 'Sign in',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      ),
      isActive: pathname === accountLink || pathname?.startsWith('/account'),
    },
  ]

  // Separate account item for special handling
  const accountItem = navItems[navItems.length - 1]
  const mainNavItems = navItems.slice(0, -1)

  return (
    <>
      <nav className="bottom-nav md:hidden">
        <div className="bottom-nav-inner">
          {mainNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`bottom-nav-item ${item.isActive ? 'active' : ''}`}
            >
              {item.icon}
              <span className="bottom-nav-label">{item.label}</span>
              {item.badge && (
                <span className="bottom-nav-badge">{item.badge}</span>
              )}
            </Link>
          ))}
          
          {/* Account - opens modal if not logged in */}
          {isLoggedIn ? (
            <Link
              href={accountItem.href}
              className={`bottom-nav-item ${accountItem.isActive ? 'active' : ''}`}
            >
              {accountItem.icon}
              <span className="bottom-nav-label">{accountItem.label}</span>
            </Link>
          ) : (
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="bottom-nav-item"
            >
              {accountItem.icon}
              <span className="bottom-nav-label">Sign in</span>
            </button>
          )}
        </div>
      </nav>

      {/* Login Modal */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={() => router.refresh()}
      />
    </>
  )
}
