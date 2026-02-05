import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import { createClient } from '@supabase/supabase-js'
import { getTenantFromRequest } from '../lib/tenant'
import { resolveEmailProvider } from '@/lib/integrations'
import { sendInviteEmail } from '@/lib/email'

// Delete user and all associated data
export async function DELETE(request: Request) {
  const supabase = await createSupabaseServer()
  const tenant = await getTenantFromRequest(request)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check owner/admin role for deleting users
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .eq('tenant_id', tenant?.id)
    .single()

  if (!profile || !['owner', 'admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    // Check target user exists and is not owner
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', userId)
    .eq('tenant_id', tenant?.id)
      .single()

    if (!targetProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (targetProfile.role === 'owner') {
      return NextResponse.json({ error: 'Cannot delete owner account' }, { status: 400 })
    }

    // Can't delete yourself
    if (userId === user.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
    }

    // Delete all associated data (order matters due to foreign keys)
    
    // 1. Delete wishlist items
    await supabase.from('wishlist_items').delete().eq('user_id', userId).eq('tenant_id', tenant?.id)
    
    // 2. Delete stock alerts
    await supabase.from('stock_alerts').delete().eq('user_id', userId).eq('tenant_id', tenant?.id)
    
    // 3. Delete drop alerts
    await supabase.from('drop_alerts').delete().eq('user_id', userId).eq('tenant_id', tenant?.id)
    
    // 4. Delete recently viewed
    await supabase.from('recently_viewed').delete().eq('user_id', userId).eq('tenant_id', tenant?.id)
    
    // 5. Delete messages
    await supabase.from('messages').delete().eq('customer_id', userId).eq('tenant_id', tenant?.id)
    
    // 6. Delete order items for user's orders
    const { data: orders } = await supabase
      .from('orders')
      .select('id')
      .eq('customer_id', userId)
      .eq('tenant_id', tenant?.id)
    
    if (orders && orders.length > 0) {
      const orderIds = orders.map(o => o.id)
      await supabase.from('order_items').delete().in('order_id', orderIds).eq('tenant_id', tenant?.id)
    }
    
    // 7. Delete orders
    await supabase.from('orders').delete().eq('customer_id', userId).eq('tenant_id', tenant?.id)
    
    // 8. Delete user preferences
    await supabase.from('user_preferences').delete().eq('user_id', userId).eq('tenant_id', tenant?.id)
    
    // 9. Delete the profile
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId)
      .eq('tenant_id', tenant?.id)

    if (profileError) {
      console.error('Error deleting profile:', profileError)
    }

    // 10. Delete from auth.users (requires service role)
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (serviceRoleKey) {
      const adminClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey,
        { auth: { autoRefreshToken: false, persistSession: false } }
      )
      
      const { error: authError } = await adminClient.auth.admin.deleteUser(userId)
      if (authError) {
        console.error('Error deleting auth user:', authError)
        // Profile is already deleted, just log this error
      }
    }

    // Log the action
    await supabase.from('activity_logs').insert({
      tenant_id: tenant?.id,
      user_id: user.id,
      user_email: user.email,
      action: 'delete_user',
      entity_type: 'user',
      entity_id: userId,
      details: { 
        deleted_user_name: targetProfile.full_name,
        deleted_user_role: targetProfile.role
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'User and all associated data deleted' 
    })

  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to delete user'
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServer()
  const tenant = await getTenantFromRequest(request)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check owner role for inviting users
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .eq('tenant_id', tenant?.id)
    .single()

  if (!profile || profile.role !== 'owner') {
    return NextResponse.json({ error: 'Owner access required' }, { status: 403 })
  }

  try {
    const { email, role } = await request.json()
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''

    console.log('[Invite User] Starting invite process with role:', role)

    if (!normalizedEmail) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    if (!['admin', 'staff'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!serviceRoleKey || !supabaseUrl) {
      return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 })
    }

    const adminClient = createClient(
      supabaseUrl,
      serviceRoleKey,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const origin = new URL(request.url).origin
    const inviteOptions = {
      redirectTo: `${origin}/auth/callback?type=invite`,
      data: {
        role,
        tenant_id: tenant?.id,
        tenant_slug: tenant?.slug,
      },
    }
    const emailProvider = resolveEmailProvider(tenant?.settings)
    console.log('[Invite User] Email provider resolved to:', emailProvider)
    let invitedUserId: string | null = null

    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
      normalizedEmail,
      inviteOptions
    )

    if (inviteError) {
      const errorMessage = inviteError.message?.toLowerCase() ?? ''
      const shouldFallback = errorMessage.includes('error sending email')
      console.log('[Invite User] Supabase invite error:', inviteError.message, 'shouldFallback:', shouldFallback)
      
      if (!shouldFallback) {
        console.error('Invite user error:', inviteError)
        return NextResponse.json({ error: inviteError.message }, { status: 500 })
      }

      if (emailProvider === 'disabled') {
        console.log('[Invite User] Email provider is disabled')
        return NextResponse.json({
          error: 'Email provider disabled. Configure email integration or Supabase SMTP to send invites.'
        }, { status: 500 })
      }

      console.warn('Supabase invite email failed. Using app email provider:', emailProvider)
      const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
        type: 'invite',
        email: normalizedEmail,
        options: inviteOptions,
      })

      const actionLink = linkData?.properties?.action_link
      if (linkError || !actionLink) {
        console.error('Invite link generation error:', linkError)
        return NextResponse.json({ error: linkError?.message || 'Failed to generate invite link' }, { status: 500 })
      }

      console.log('[Invite User] Generated invite link, sending via', emailProvider)
      try {
        await sendInviteEmail({
          inviteeEmail: normalizedEmail,
          inviteLink: actionLink,
          tenantName: tenant?.name || '709exclusive',
          role,
          inviterEmail: user.email,
          emailProvider,
        })
        console.log('[Invite User] Successfully sent invite email via', emailProvider)
      } catch (emailError) {
        console.error('Failed to send invite via app email provider:', emailError)
        return NextResponse.json({ 
          error: emailError instanceof Error ? emailError.message : 'Failed to send invite email. Please check your email provider configuration.'
        }, { status: 500 })
      }

      invitedUserId = linkData?.user?.id ?? null
    } else {
      console.log('[Invite User] Supabase successfully sent invite email')
      invitedUserId = inviteData?.user?.id ?? null
    }

    if (invitedUserId) {
      const { error: updateError } = await adminClient
        .from('profiles')
        .update({ role, tenant_id: tenant?.id })
        .eq('id', invitedUserId)
      if (updateError) {
        console.error('Error updating invited user role:', updateError)
      }
    }

    // Log the action
    await supabase.from('activity_logs').insert({
      tenant_id: tenant?.id,
      user_id: user.id,
      user_email: user.email,
      action: 'invite_user',
      entity_type: 'user',
      entity_id: normalizedEmail,
      details: { role }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Invitation email sent' 
    })

  } catch (error) {
    console.error('Invite user error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to invite user'
    }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const supabase = await createSupabaseServer()
  const tenant = await getTenantFromRequest(request)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check owner role for changing roles
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .eq('tenant_id', tenant?.id)
    .single()

  if (!profile || profile.role !== 'owner') {
    return NextResponse.json({ error: 'Owner access required' }, { status: 403 })
  }

  try {
    const { userId, role } = await request.json()

    // Can't change owner role
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
    .eq('tenant_id', tenant?.id)
      .single()

    if (targetProfile?.role === 'owner') {
      return NextResponse.json({ error: 'Cannot change owner role' }, { status: 400 })
    }

    // Update role
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId)
      .eq('tenant_id', tenant?.id)

    if (error) throw error

    // Log the action
    await supabase.from('activity_logs').insert({
      tenant_id: tenant?.id,
      user_id: user.id,
      user_email: user.email,
      action: 'update_user_role',
      entity_type: 'user',
      entity_id: userId,
      details: { new_role: role }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Update role error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to update role'
    }, { status: 500 })
  }
}
