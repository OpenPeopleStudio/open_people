import type { RestaurantSettings, RestaurantTenantContext } from '@/types/tenant'

/**
 * Default restaurant settings for development/preview
 */
const DEFAULT_SETTINGS: RestaurantSettings = {
  theme: {
    name: 'Restaurant',
    tagline: 'Opening Soon',
    colors: {
      bg_primary: '#f5f5f0',
      text_primary: '#1a1a1a',
      text_secondary: '#666',
      text_muted: '#888',
    },
    typography: {
      font_primary: 'Inter',
      font_display: 'Darker Grotesque',
      text_transform: 'lowercase',
    },
  },
  content: {
    hero: {
      headline: 'Your<br>Restaurant<br>Name',
      subheadline: 'opening soon',
    },
    about: {
      title: 'who we are',
      content: 'a restaurant.<br>local.<br>seasonal.<br><br>we focus on what matters.',
    },
    philosophy: {
      enabled: true,
      title: 'philosophy',
      content: 'intention shapes what we make.<br>craft is how we make it.<br><br>the experience is yours.',
    },
    status: {
      enabled: true,
      title: 'status',
      content: 'currently under development.<br>updates will be shared when appropriate.',
    },
  },
  features: {
    newsletter: true,
    careers: true,
    events: false,
    reservations: false,
  },
  newsletter: {
    enabled: true,
    title: 'updates',
    description: 'leave your email to be notified when we open.',
    success_message: 'thank you. we\'ll be in touch.',
    allow_message: true,
  },
}

/**
 * Get restaurant tenant settings
 * In production, this would fetch from Supabase based on domain/subdomain
 */
export async function getRestaurantSettings(): Promise<RestaurantTenantContext | null> {
  // TODO: In production, resolve tenant from domain and fetch settings from Supabase
  // const supabase = createServerClient()
  // const host = headers().get('host')
  // const tenant = await resolveTenantFromHost(supabase, host)
  
  return {
    id: 'preview',
    slug: 'preview',
    name: 'Restaurant',
    settings: DEFAULT_SETTINGS,
    status: 'coming_soon',
  }
}

/**
 * Format price for display
 */
export function formatPrice(cents: number, currency = 'CAD', symbol = '$'): string {
  const dollars = cents / 100
  return `${symbol}${dollars.toFixed(2)}`
}

/**
 * Format business hours for display
 */
export function formatHours(hours: RestaurantSettings['location']['hours']): string[] {
  if (!hours) return []
  
  const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  
  return hours
    .sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day))
    .map(h => {
      if (h.closed) return `${h.day}: closed`
      if (h.open && h.close) return `${h.day}: ${h.open} - ${h.close}${h.note ? ` (${h.note})` : ''}`
      return `${h.day}: ${h.note || 'TBD'}`
    })
}
