'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCart } from '../context/CartContext'
import { supabase } from '../../lib/supabaseClient'
import LoginModal from './LoginModal'
import { useTenant } from '@/context/TenantContext'

function HeaderContent() {
  const { itemCount, isHydrated } = useCart()
  const { id: tenantId, settings, featureFlags } = useTenant()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const isDropsActive = searchParams.get('drops') === 'true'
  const brandName = settings?.theme?.brand_name || 'Store'
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })

    // Check auth status and role
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
        
        setIsAdmin(['owner', 'admin', 'staff'].includes(profile?.role || ''))
      }
    }
    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setIsLoggedIn(!!session?.user)
      
      if (session?.user) {
        const { data: profile } = await supabase
          .from('709_profiles')
          .select('role')
          .eq('id', session.user.id)
          .eq('tenant_id', tenantId)
          .single()
        
        setIsAdmin(['owner', 'admin', 'staff'].includes(profile?.role || ''))
      } else {
        setIsAdmin(false)
      }
    })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      subscription.unsubscribe()
    }
  }, [tenantId])

  // Close menu with animation
  const closeMobileMenu = () => {
    setIsClosing(true)
    setTimeout(() => {
      setIsMobileMenuOpen(false)
      setIsClosing(false)
    }, 250)
  }

  const handleSignOut = async () => {
    if (isSigningOut) return
    setIsSigningOut(true)
    try {
      await supabase.auth.signOut()
      router.push('/')
      router.refresh()
    } finally {
      setIsSigningOut(false)
    }
  }

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileMenuOpen])

  // Close menu on route change
  useEffect(() => {
    if (isMobileMenuOpen) {
      closeMobileMenu()
    }
    if (isSearchOpen) {
      setIsSearchOpen(false)
      setSearchQuery('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  // Focus search input when opening
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isSearchOpen])

  // Handle search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`)
      setIsSearchOpen(false)
      setSearchQuery('')
    }
  }

  // Determine the account link based on role
  const canAccessAdmin = featureFlags.admin !== false
  const accountLink = isLoggedIn 
    ? (isAdmin && canAccessAdmin ? '/admin/products' : '/account') 
    : '/account/login'
  
  const accountLabel = isLoggedIn 
    ? (isAdmin && canAccessAdmin ? 'Admin' : 'Account') 
    : 'Sign in'

  const isShopActive =
    pathname === '/shop' ||
    pathname?.startsWith('/product') ||
    isDropsActive ||
    pathname === '/policies/shipping'

  return (
    <>
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] border-b border-[var(--glass-border)]' 
            : 'bg-transparent'
        }`}
      >
        <div className="container">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="group flex flex-col gap-1">
              <span className="text-2xl font-black tracking-tighter text-gradient transition-all duration-300">
                {brandName}
              </span>
              <div className="flex items-center gap-2">
                {/* Lock Icon */}
                <svg className="w-3.5 h-3.5 text-white transition-all duration-300 delay-0 group-hover:text-green-400 group-active:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                {/* Cart Icon */}
                <svg className="w-3.5 h-3.5 text-white transition-all duration-300 delay-75 group-hover:text-green-400 group-active:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {/* Credit Card Icon */}
                <svg className="w-3.5 h-3.5 text-white transition-all duration-300 delay-150 group-hover:text-green-400 group-active:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                {/* Bitcoin Icon - only show if crypto payments enabled */}
                {featureFlags.crypto_payments && (
                  <svg className="w-3.5 h-3.5 text-white transition-all duration-300 delay-[225ms] group-hover:text-green-400 group-active:text-green-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.638 14.904c-1.602 6.43-8.113 10.34-14.542 8.736C2.67 22.05-1.244 15.525.362 9.105 1.962 2.67 8.475-1.243 14.9.358c6.43 1.605 10.342 8.115 8.738 14.548v-.002zm-6.35-4.613c.24-1.59-.974-2.45-2.64-3.03l.54-2.153-1.315-.33-.525 2.107c-.345-.087-.705-.167-1.064-.25l.526-2.127-1.32-.33-.54 2.165c-.285-.067-.565-.132-.84-.2l-1.815-.45-.35 1.407s.975.225.955.236c.535.136.63.486.615.766l-1.477 5.92c-.075.166-.24.406-.614.314.015.02-.96-.24-.96-.24l-.66 1.51 1.71.426.93.242-.54 2.19 1.32.327.54-2.17c.36.1.705.19 1.05.273l-.51 2.154 1.32.33.545-2.19c2.24.427 3.93.257 4.64-1.774.57-1.637-.03-2.58-1.217-3.196.854-.193 1.5-.76 1.68-1.93h.01zm-3.01 4.22c-.404 1.64-3.157.75-4.05.53l.72-2.9c.896.23 3.757.67 3.33 2.37zm.41-4.24c-.37 1.49-2.662.735-3.405.55l.654-2.64c.744.18 3.137.524 2.75 2.084v.006z"/>
                  </svg>
                )}
              </div>
            </Link>

            {/* Center Navigation - Desktop */}
            <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/shop"
                className={`px-4 py-2 text-sm font-semibold rounded-full transition-all duration-300 ${
                  pathname === '/shop' || pathname?.startsWith('/product')
                    ? 'bg-gradient-to-r from-[var(--neon-magenta)]/20 to-[var(--neon-cyan)]/20 text-[var(--text-primary)] border border-[var(--border-glow)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5'
                }`}
              >
                Shop all
              </Link>
              {featureFlags.drops !== false && (
                <Link
                  href="/shop?drops=true"
                  className={`px-4 py-2 text-sm font-semibold rounded-full transition-all duration-300 ${
                    isDropsActive
                      ? 'bg-gradient-to-r from-[var(--neon-magenta)]/20 to-[var(--neon-cyan)]/20 text-[var(--text-primary)] border border-[var(--border-glow)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5'
                  }`}
                >
                  Drops
                </Link>
              )}
              {(featureFlags.local_delivery || featureFlags.pickup) && (
                <Link
                  href="/policies/shipping"
                  className={`px-4 py-2 text-sm font-semibold rounded-full transition-all duration-300 ${
                    pathname === '/policies/shipping'
                      ? 'bg-gradient-to-r from-[var(--neon-magenta)]/20 to-[var(--neon-cyan)]/20 text-[var(--text-primary)] border border-[var(--border-glow)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5'
                  }`}
                >
                  Delivery & Pickup
                </Link>
              )}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-1">
              {/* Search */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/10 transition-all duration-300 hover:shadow-[0_0_15px_rgba(255,0,255,0.3)]"
                aria-label="Search"
              >
                <svg className="w-5 h-5 text-[var(--text-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </button>

              {/* Cart */}
              <Link 
                href="/cart" 
                className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/10 transition-all duration-300 hover:shadow-[0_0_15px_rgba(0,240,255,0.3)]"
              >
                <svg 
                  className="w-[22px] h-[22px] text-[var(--text-primary)]" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" 
                  />
                </svg>
                {isHydrated && itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[20px] h-[20px] flex items-center justify-center bg-gradient-to-r from-[var(--neon-magenta)] to-[var(--neon-cyan)] text-white text-[10px] font-bold rounded-full px-1 shadow-[0_0_10px_rgba(255,0,255,0.5)]">
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
              </Link>

              {/* Account */}
              {isLoggedIn ? (
                <Link 
                  href={accountLink} 
                  className="hidden md:flex px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors rounded-full hover:bg-white/5"
                >
                  {accountLabel}
                </Link>
              ) : (
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="hidden md:flex px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors rounded-full hover:bg-white/5"
                >
                  Sign in
                </button>
              )}
              {isLoggedIn && (
                <button
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className={`hidden md:flex px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors rounded-full hover:bg-white/5 ${
                    isSigningOut ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                >
                  Sign out
                </button>
              )}

              {/* Mobile Menu Toggle */}
              <button
                className="md:hidden flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/5 transition-colors"
                onClick={() => isMobileMenuOpen ? closeMobileMenu() : setIsMobileMenuOpen(true)}
                aria-label="Toggle menu"
                aria-expanded={isMobileMenuOpen}
              >
                <div className="relative w-5 h-5">
                  {/* Animated hamburger to X */}
                  <span 
                    className={`absolute left-0 w-5 h-0.5 bg-[var(--text-primary)] transition-all duration-300 ease-out ${
                      isMobileMenuOpen ? 'top-[9px] rotate-45' : 'top-[5px] rotate-0'
                    }`}
                  />
                  <span 
                    className={`absolute left-0 top-[9px] w-5 h-0.5 bg-[var(--text-primary)] transition-all duration-300 ease-out ${
                      isMobileMenuOpen ? 'opacity-0 scale-0' : 'opacity-100 scale-100'
                    }`}
                  />
                  <span 
                    className={`absolute left-0 w-5 h-0.5 bg-[var(--text-primary)] transition-all duration-300 ease-out ${
                      isMobileMenuOpen ? 'top-[9px] -rotate-45' : 'top-[13px] rotate-0'
                    }`}
                  />
                </div>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className={`fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm md:hidden transition-opacity duration-300 ${
              isClosing ? 'opacity-0' : 'opacity-100'
            }`}
            onClick={closeMobileMenu}
            aria-hidden="true"
          />
          
          {/* Menu Panel */}
          <div 
            ref={menuRef}
            className={`fixed top-0 right-0 bottom-0 z-[60] w-full max-w-sm bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] md:hidden shadow-2xl border-l border-[var(--glass-border)] transition-transform duration-300 ease-out ${
              isClosing ? 'translate-x-full' : 'translate-x-0'
            }`}
            style={{ paddingTop: 'var(--safe-area-top, 0px)' }}
          >
            {/* Menu Header */}
            <div className="flex items-center justify-between h-20 px-6 border-b border-[var(--glass-border)]">
              <span className="text-lg font-bold text-gradient">Menu</span>
              <button
                className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/10 transition-all duration-300"
                onClick={closeMobileMenu}
                aria-label="Close menu"
              >
                <svg className="w-5 h-5 text-[var(--text-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Menu Content */}
            <nav className="flex flex-col p-6">
              {/* Primary Navigation */}
              <div className="space-y-1">
                <Link 
                  href="/" 
                  className={`flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 ${
                    pathname === '/' 
                      ? 'bg-gradient-to-r from-[var(--neon-magenta)]/20 to-[var(--neon-cyan)]/20 text-[var(--text-primary)] border border-[var(--border-glow)]' 
                      : 'text-[var(--text-primary)] hover:bg-white/10'
                  }`}
                  onClick={closeMobileMenu}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
                  </svg>
                  <span className="text-lg font-semibold">Shop</span>
                </Link>

                {featureFlags.drops !== false && (
                  <Link 
                    href="/shop?drops=true" 
                    className={`flex items-center gap-4 px-4 py-4 rounded-xl transition-colors ${
                      isDropsActive 
                        ? 'bg-[var(--accent)]/10 text-[var(--accent)]' 
                        : 'text-[var(--text-primary)] hover:bg-white/5'
                    }`}
                    onClick={closeMobileMenu}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v4m0 0a4 4 0 014 4c0 2.757-2 5-4 8-2-3-4-5.243-4-8a4 4 0 014-4z" />
                    </svg>
                    <span className="text-lg font-medium">Drops</span>
                  </Link>
                )}

                <Link 
                  href="/cart" 
                  className={`flex items-center justify-between px-4 py-4 rounded-xl transition-colors ${
                    pathname === '/cart' 
                      ? 'bg-[var(--accent)]/10 text-[var(--accent)]' 
                      : 'text-[var(--text-primary)] hover:bg-white/5'
                  }`}
                  onClick={closeMobileMenu}
                >
                  <div className="flex items-center gap-4">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                    <span className="text-lg font-medium">Cart</span>
                  </div>
                  {isHydrated && itemCount > 0 && (
                    <span className="flex items-center justify-center min-w-[24px] h-6 px-2 bg-[var(--accent)] text-white text-sm font-semibold rounded-full">
                      {itemCount > 99 ? '99+' : itemCount}
                    </span>
                  )}
                </Link>

                <Link 
                  href="/account/orders" 
                  className={`flex items-center gap-4 px-4 py-4 rounded-xl transition-colors ${
                    pathname === '/account/orders' 
                      ? 'bg-[var(--accent)]/10 text-[var(--accent)]' 
                      : 'text-[var(--text-primary)] hover:bg-white/5'
                  }`}
                  onClick={closeMobileMenu}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                  </svg>
                  <span className="text-lg font-medium">Orders</span>
                </Link>

                {(featureFlags.local_delivery || featureFlags.pickup) && (
                  <Link 
                    href="/policies/shipping" 
                    className="flex items-center gap-4 px-4 py-4 rounded-xl transition-colors text-[var(--text-primary)] hover:bg-white/5"
                    onClick={closeMobileMenu}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h12v10H3V7zm12 3h3l3 3v4h-6V10zm-9 7h.01M15 17h.01M6 7V5a2 2 0 012-2h6a2 2 0 012 2v2" />
                    </svg>
                    <span className="text-lg font-medium">Delivery & Pickup</span>
                  </Link>
                )}
              </div>

              {/* Divider */}
              <div className="my-6 border-t border-[var(--border-primary)]" />

              {/* Secondary Navigation */}
              <div className="space-y-1">
                {isLoggedIn ? (
                  <>
                    <Link 
                      href={accountLink} 
                      className={`flex items-center gap-4 px-4 py-4 rounded-xl transition-colors ${
                        pathname === accountLink 
                          ? 'bg-[var(--accent)]/10 text-[var(--accent)]' 
                          : 'text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)]'
                      }`}
                      onClick={closeMobileMenu}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                      <span className="text-lg font-medium">{accountLabel}</span>
                    </Link>
                    <button
                      className="flex items-center gap-4 px-4 py-4 rounded-xl transition-colors text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)] w-full"
                      onClick={() => {
                        closeMobileMenu()
                        void handleSignOut()
                      }}
                      disabled={isSigningOut}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                      </svg>
                      <span className="text-lg font-medium">Sign out</span>
                    </button>
                  </>
                ) : (
                  <button 
                    className="flex items-center gap-4 px-4 py-4 rounded-xl transition-colors text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)] w-full"
                    onClick={() => {
                      setIsLoginModalOpen(true)
                      closeMobileMenu()
                    }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                    <span className="text-lg font-medium">Sign in</span>
                  </button>
                )}
              </div>
            </nav>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-[var(--border-primary)]" style={{ paddingBottom: 'calc(24px + var(--safe-area-bottom, 0px))' }}>
              <p className="text-xs text-[var(--text-muted)] text-center">
                {brandName}{settings?.contact?.city ? ` · ${settings.contact.city}${settings.contact.region ? `, ${settings.contact.region}` : ''}` : ''}
              </p>
            </div>
          </div>
        </>
      )}

      {/* Search Overlay */}
      {isSearchOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
            onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}
          />
          
          {/* Search Panel */}
          <div className="fixed inset-x-0 top-0 z-50 bg-[var(--bg-primary)] border-b border-[var(--border-primary)]">
            <div className="container">
              <form onSubmit={handleSearch} className="flex items-center h-20 gap-4">
                <svg className="w-5 h-5 text-[var(--text-muted)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={settings?.search?.placeholder || "Search products..."}
                  className="flex-1 bg-transparent border-none outline-none text-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}
                  className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/5 transition-colors"
                >
                  <svg className="w-5 h-5 text-[var(--text-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </form>
            </div>
            
            {/* Quick Links */}
            <div className="container pb-6">
              <p className="text-xs text-[var(--text-muted)] mb-3">Popular searches</p>
              <div className="flex flex-wrap gap-2">
                {(settings?.search?.popular_terms || ['New', 'Featured', 'Sale', 'Best Sellers']).map((term) => (
                  <button
                    key={term}
                    onClick={() => {
                      router.push(`/shop?search=${encodeURIComponent(term)}`)
                      setIsSearchOpen(false)
                      setSearchQuery('')
                    }}
                    className="px-3 py-1.5 text-sm bg-[var(--bg-secondary)] text-[var(--text-secondary)] rounded-full hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Login Modal */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={() => router.refresh()}
      />
    </>
  )
}

export default function Header() {
  return (
    <Suspense fallback={<div className="h-20" />}>
      <HeaderContent />
    </Suspense>
  )
}
