/* ═══════════════════════════════════════════════════════════════════════════
   Navigation Types
   Shared type definitions for sidebar navigation
   ═══════════════════════════════════════════════════════════════════════════ */

export interface NavItem {
  href: string;
  label: string;
  icon: string;
  exact?: boolean;
  feature?: string;
  children?: NavItem[];
  badge?: number | string;
  badgeVariant?: "default" | "success" | "warning" | "error";
}

export interface NavSection {
  id: string;
  label: string;
  items: NavItem[];
}

export interface SidebarConfig {
  brandName: string;
  brandSubtitle?: string;
  brandHref: string;
  sections: NavSection[];
  showShopLink?: boolean;
  showSignOut?: boolean;
  userDisplay?: {
    name: string;
    subtitle: string;
    initials: string;
  };
}
