import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import { isAdmin } from '../lib/roles'
import { SupabaseClient } from '@supabase/supabase-js'
import { getTenantFromRequest } from '../lib/tenant'

// Update a single variant
export async function PATCH(req: Request) {
  const supabase = await createSupabaseServer()
  const tenant = await getTenantFromRequest(req)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !user.id) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  if (!isAdmin(await getUserRole(supabase, user.id!, tenant?.id))) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  try {
    const { variantId, updates }: {
      variantId: string
      updates: {
        price_cents?: number
        stock?: number
        condition_code?: string
        condition?: string
      }
    } = await req.json()

    if (!variantId) {
      return NextResponse.json({ error: 'Variant ID required' }, { status: 400 })
    }

    // Build update object with only valid fields
    const updateData: Record<string, unknown> = {}
    
    if (updates.price_cents !== undefined && updates.price_cents >= 0) {
      updateData.price_cents = updates.price_cents
    }
    
    if (updates.stock !== undefined && updates.stock >= 0) {
      // Get current stock to calculate delta for audit
      const { data: current } = await supabase
        .from('product_variants')
        .select('stock')
        .eq('id', variantId)
        .eq('tenant_id', tenant?.id)
        .single()
      
      if (current && updates.stock !== current.stock) {
        const delta = updates.stock - current.stock
        
        // Create audit entry
        await supabase.from('inventory_audit').insert({
          tenant_id: tenant?.id,
          variant_id: variantId,
          delta,
          reason: `Manual stock adjustment: ${current.stock} → ${updates.stock}`,
          actor: user.id
        })
      }
      
      updateData.stock = updates.stock
    }
    
    if (updates.condition_code) {
      updateData.condition_code = updates.condition_code
      // Also update the full condition name
      const conditionMap: Record<string, string> = {
        'DS': 'Deadstock',
        'VNDS': 'Very Near Deadstock',
        'PADS': 'Pass as Deadstock',
        'USED': 'Used - Good',
        'BEATER': 'Beater'
      }
      updateData.condition = conditionMap[updates.condition_code] || updates.condition_code
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('product_variants')
      .update(updateData)
      .eq('id', variantId)
      .eq('tenant_id', tenant?.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ variant: data })
  } catch (error) {
    console.error('Variant update error:', error)
    return NextResponse.json({ error: 'Failed to update variant' }, { status: 500 })
  }
}

// Delete a variant
export async function DELETE(req: Request) {
  const supabase = await createSupabaseServer()
  const tenant = await getTenantFromRequest(req)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !user.id) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  if (!isAdmin(await getUserRole(supabase, user.id!, tenant?.id))) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const url = new URL(req.url)
  const variantId = url.searchParams.get('id')

  if (!variantId) {
    return NextResponse.json({ error: 'Variant ID required' }, { status: 400 })
  }

  try {
    // Check if variant has any active orders
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('id')
      .eq('variant_id', variantId)
      .eq('tenant_id', tenant?.id)
      .limit(1)

    if (orderItems && orderItems.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete variant with order history. Set stock to 0 instead.' 
      }, { status: 400 })
    }

    const { error } = await supabase
      .from('product_variants')
      .delete()
      .eq('id', variantId)
      .eq('tenant_id', tenant?.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Variant delete error:', error)
    return NextResponse.json({ error: 'Failed to delete variant' }, { status: 500 })
  }
}

async function getUserRole(supabase: SupabaseClient, userId: string, tenantId?: string): Promise<string | undefined> {
  let query = supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)

  if (tenantId) {
    query = query.eq('tenant_id', tenantId)
  }

  const { data: profile } = await query.single()

  return profile?.role
}
