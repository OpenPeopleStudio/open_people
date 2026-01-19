import { NextRequest, NextResponse } from 'next/server'
import type { RestaurantSettings } from '@/types/tenant'

// In-memory storage for demo (replace with database in production)
let tenantSettings: RestaurantSettings = {
  theme: {
    name: 'Restaurant',
    tagline: 'opening soon',
    colors: {
      bg_primary: '#f5f5f0',
      text_primary: '#1a1a1a',
      text_secondary: '#666666',
    },
    typography: {
      text_transform: 'lowercase',
    },
  },
  content: {
    hero: {
      headline: 'your<br>restaurant<br>name',
      subheadline: 'opening soon',
    },
    about: {
      title: 'who we are',
      content: 'a restaurant.<br>local.<br>seasonal.',
    },
    philosophy: {
      enabled: true,
      title: 'philosophy',
      content: 'intention shapes what we make.<br>craft is how we make it.',
    },
    status: {
      enabled: true,
      title: 'status',
      content: 'currently under development.',
    },
  },
  features: {
    newsletter: true,
    careers: true,
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
 * GET /api/admin/settings
 * Get current tenant settings
 */
export async function GET() {
  try {
    // TODO: Implement authentication check
    // const session = await getSession()
    // if (!session || !['admin', 'owner'].includes(session.role)) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    // TODO: Fetch from database based on tenant
    // const supabase = createClient()
    // const { data, error } = await supabase
    //   .from('tenants')
    //   .select('settings')
    //   .eq('id', tenantId)
    //   .single()

    return NextResponse.json({
      settings: tenantSettings,
    })
  } catch (error) {
    console.error('Get settings error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/settings
 * Update tenant settings
 */
export async function PATCH(request: NextRequest) {
  try {
    // TODO: Implement authentication check
    // const session = await getSession()
    // if (!session || !['admin', 'owner'].includes(session.role)) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const body = await request.json()
    const { settings } = body

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'Invalid settings' },
        { status: 400 }
      )
    }

    // Merge with existing settings
    tenantSettings = {
      ...tenantSettings,
      ...settings,
      theme: {
        ...tenantSettings.theme,
        ...settings.theme,
        colors: {
          ...tenantSettings.theme?.colors,
          ...settings.theme?.colors,
        },
        typography: {
          ...tenantSettings.theme?.typography,
          ...settings.theme?.typography,
        },
      },
      content: {
        ...tenantSettings.content,
        ...settings.content,
        hero: {
          ...tenantSettings.content?.hero,
          ...settings.content?.hero,
        },
        about: {
          ...tenantSettings.content?.about,
          ...settings.content?.about,
        },
        philosophy: {
          ...tenantSettings.content?.philosophy,
          ...settings.content?.philosophy,
        },
        status: {
          ...tenantSettings.content?.status,
          ...settings.content?.status,
        },
      },
      features: {
        ...tenantSettings.features,
        ...settings.features,
      },
      location: {
        ...tenantSettings.location,
        ...settings.location,
      },
      social: {
        ...tenantSettings.social,
        ...settings.social,
      },
    }

    // TODO: Save to database
    // const supabase = createClient()
    // const { error } = await supabase
    //   .from('tenants')
    //   .update({ settings: tenantSettings, updated_at: new Date().toISOString() })
    //   .eq('id', tenantId)

    console.log('Settings updated:', Object.keys(settings))

    return NextResponse.json({
      success: true,
      settings: tenantSettings,
    })
  } catch (error) {
    console.error('Update settings error:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
