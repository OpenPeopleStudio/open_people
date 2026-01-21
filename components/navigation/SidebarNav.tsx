"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavSection, NavItem } from "@/lib/navigation/types";

/* ═══════════════════════════════════════════════════════════════════════════
   Sidebar Navigation Component
   Reusable sidebar with collapsible sections, badges, and persistence
   Desktop: collapsible rail  |  Mobile: full-screen overlay triggered externally
   ═══════════════════════════════════════════════════════════════════════════ */

interface SidebarNavProps {
  sections: NavSection[];
  brandName: string;
  brandSubtitle?: string;
  brandHref: string;
  brandInitial?: string;
  brandIcon?: React.ReactNode;
  features?: Record<string, boolean>;
  storageKey?: string; // Key for localStorage persistence
  footerContent?: React.ReactNode;
  /** Mobile overlay mode – controlled by parent layout */
  mobileOpen?: boolean;
  /** Callback when mobile overlay requests close */
  onMobileClose?: () => void;
}

// Hook for localStorage with SSR safety
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error("Error reading localStorage:", error);
      return initialValue;
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error("Error writing localStorage:", error);
    }
  }, [key, storedValue]);

  const setValue = useCallback((value: T) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error("Error writing localStorage:", error);
    }
  }, [key]);

  return [storedValue, setValue];
}

// Get initial expanded items based on current pathname
function getInitialExpandedItems(sections: NavSection[], pathname: string): Set<string> {
  const expanded = new Set<string>();
  
  sections.forEach(section => {
    section.items.forEach(item => {
      if (item.children?.some(child => {
        if (child.exact) return pathname === child.href;
        return pathname.startsWith(child.href);
      })) {
        expanded.add(item.href);
      }
    });
  });
  
  return expanded;
}

export function SidebarNav({
  sections,
  brandName,
  brandSubtitle,
  brandHref,
  brandInitial,
  brandIcon,
  features = {},
  storageKey = "sidebar",
  footerContent,
  mobileOpen = false,
  onMobileClose,
}: SidebarNavProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useLocalStorage(`${storageKey}-collapsed`, false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(() => 
    getInitialExpandedItems(sections, pathname)
  );

  // Lock body scroll when mobile overlay is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Update expanded items when pathname changes
  useEffect(() => {
    const newExpanded = getInitialExpandedItems(sections, pathname);
    if (newExpanded.size > 0) {
      const timeout = setTimeout(() => {
        setExpandedItems(prev => new Set([...prev, ...newExpanded]));
      }, 0);

      return () => clearTimeout(timeout);
    }
  }, [pathname, sections]);

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const hasActiveChild = (item: NavItem) => {
    if (!item.children) return false;
    return item.children.some(child => isActive(child.href, child.exact));
  };

  const toggleExpanded = (href: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(href)) {
        next.delete(href);
      } else {
        next.add(href);
      }
      return next;
    });
  };

  const isItemVisible = (item: NavItem) => {
    if (item.feature === "admin") return true;
    if (!item.feature) return true;
    return features[item.feature] !== false;
  };

  const visibleSections = sections
    .map(section => ({
      ...section,
      items: section.items.filter(isItemVisible),
    }))
    .filter(section => section.items.length > 0);

  // Shared nav content renderer
  const renderNavContent = (isMobile: boolean) => (
    <>
      {/* Logo / Brand */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-[var(--border-subtle)]">
        <Link
          href={brandHref}
          onClick={isMobile ? onMobileClose : undefined}
          className={`flex items-center gap-2 ${!isMobile && collapsed ? "justify-center" : ""}`}
        >
          <div className="w-8 h-8 rounded-lg bg-[var(--electric-lime)] flex items-center justify-center shrink-0">
            {brandIcon || (
              <span className="text-sm font-bold text-[var(--void)]">
                {brandInitial || brandName.charAt(0)}
              </span>
            )}
          </div>
          {(isMobile || !collapsed) && (
            <div>
              <span className="text-sm font-semibold text-[var(--text-primary)]">
                {brandName}
              </span>
              {brandSubtitle && (
                <span className="block text-xs text-[var(--text-muted)]">
                  {brandSubtitle}
                </span>
              )}
            </div>
          )}
        </Link>
        {!isMobile && !collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-1)] transition-colors"
            aria-label="Collapse sidebar"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
              />
            </svg>
          </button>
        )}
        {isMobile && (
          <button
            onClick={onMobileClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-1)] transition-colors"
            aria-label="Close menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Expand button when collapsed (desktop only) */}
      {!isMobile && collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="mx-auto mt-4 p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-1)] transition-colors"
          aria-label="Expand sidebar"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 5l7 7-7 7M5 5l7 7-7 7"
            />
          </svg>
        </button>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
        {visibleSections.map((section) => (
          <div key={section.id}>
            {/* Section header */}
            {(isMobile || !collapsed) && (
              <div className="px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                {section.label}
              </div>
            )}
            {/* Section items */}
            <div className="space-y-1">
              {section.items.map((item) => (
                <NavItemComponent
                  key={item.href}
                  item={item}
                  collapsed={!isMobile && collapsed}
                  isActive={isActive}
                  hasActiveChild={hasActiveChild}
                  isExpanded={expandedItems.has(item.href) || hasActiveChild(item)}
                  onToggle={() => toggleExpanded(item.href)}
                  isItemVisible={isItemVisible}
                  onLinkClick={isMobile ? onMobileClose : undefined}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      {footerContent && (
        <div className="p-3 border-t border-[var(--border-subtle)]">
          {footerContent}
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex ${
          collapsed ? "w-16" : "w-64"
        } border-r border-[var(--border-subtle)] flex-col transition-all duration-200`}
      >
        {renderNavContent(false)}
      </aside>

      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-50 md:hidden transition-opacity duration-200 ${
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onMobileClose}
        />
        {/* Drawer */}
        <aside
          className={`absolute top-0 left-0 h-full w-72 max-w-[85vw] bg-[var(--void)] border-r border-[var(--border-subtle)] flex flex-col transition-transform duration-200 ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {renderNavContent(true)}
        </aside>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   NavItem Component
   Individual navigation item with optional children
   ───────────────────────────────────────────────────────────────────────────── */

interface NavItemComponentProps {
  item: NavItem;
  collapsed: boolean;
  isActive: (href: string, exact?: boolean) => boolean;
  hasActiveChild: (item: NavItem) => boolean;
  isExpanded: boolean;
  onToggle: () => void;
  isItemVisible: (item: NavItem) => boolean;
  /** Called when a link is clicked (used for mobile close) */
  onLinkClick?: () => void;
}

function NavItemComponent({
  item,
  collapsed,
  isActive,
  hasActiveChild,
  isExpanded,
  onToggle,
  isItemVisible,
  onLinkClick,
}: NavItemComponentProps) {
  const active = isActive(item.href, item.exact);
  const childActive = hasActiveChild(item);
  const hasChildren = item.children && item.children.length > 0;

  const baseClasses = `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
    collapsed ? "justify-center" : ""
  }`;

  const activeClasses = active || childActive
    ? "bg-[var(--electric-lime)]/10 text-[var(--electric-lime)]"
    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-1)]";

  const renderBadge = () => {
    if (!item.badge) return null;
    
    const variantClasses = {
      default: "bg-[var(--surface-2)] text-[var(--text-muted)]",
      success: "bg-[var(--success)]/10 text-[var(--success)]",
      warning: "bg-[var(--warning)]/10 text-[var(--warning)]",
      error: "bg-[var(--error)]/10 text-[var(--error)]",
    };

    return (
      <span className={`text-xs px-1.5 py-0.5 rounded ${variantClasses[item.badgeVariant || "default"]}`}>
        {item.badge}
      </span>
    );
  };

  return (
    <div>
      {hasChildren ? (
        <button
          onClick={onToggle}
          className={`w-full ${baseClasses} ${activeClasses}`}
          title={collapsed ? item.label : undefined}
        >
          <svg
            className="w-5 h-5 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
          </svg>
          {!collapsed && (
            <>
              <span className="flex-1 text-left">{item.label}</span>
              {renderBadge()}
              <svg
                className={`w-4 h-4 transition-transform pointer-events-none ${isExpanded ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </>
          )}
        </button>
      ) : (
        <Link
          href={item.href}
          onClick={onLinkClick}
          className={`${baseClasses} ${activeClasses}`}
          title={collapsed ? item.label : undefined}
        >
          <svg
            className="w-5 h-5 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
          </svg>
          {!collapsed && (
            <>
              <span className="flex-1">{item.label}</span>
              {renderBadge()}
            </>
          )}
        </Link>
      )}

      {/* Child items */}
      {hasChildren && isExpanded && !collapsed && (
        <div className="ml-4 mt-1 space-y-1 border-l border-[var(--border-subtle)] pl-3">
          {item.children!.filter(isItemVisible).map((child) => {
            const childIsActive = isActive(child.href, child.exact);
            return (
              <Link
                key={child.href}
                href={child.href}
                onClick={onLinkClick}
                className={`flex items-center gap-2 px-2 py-2 rounded-lg text-sm transition-colors ${
                  childIsActive
                    ? "text-[var(--electric-lime)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-1)]"
                }`}
              >
                <svg
                  className="w-4 h-4 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d={child.icon} />
                </svg>
                <span className="flex-1">{child.label}</span>
                {child.badge && (
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    child.badgeVariant === "error" ? "bg-[var(--error)]/10 text-[var(--error)]" :
                    child.badgeVariant === "warning" ? "bg-[var(--warning)]/10 text-[var(--warning)]" :
                    child.badgeVariant === "success" ? "bg-[var(--success)]/10 text-[var(--success)]" :
                    "bg-[var(--surface-2)] text-[var(--text-muted)]"
                  }`}>
                    {child.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
