import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import { isAdmin } from '../lib/roles'
import { SupabaseClient } from '@supabase/supabase-js'
import { getTenantFromRequest } from '../lib/tenant'

export async function POST(req: Request) {
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
    const { 
      variantIds, 
      operation, 
      value, 
      reason 
    }: {
      variantIds: string[]
      operation: 'adjust_stock' | 'set_stock' | 'adjust_price_percent' | 'adjust_price_flat' | 'set_price'
      value: number
      reason?: string
    } = await req.json()

    if (!variantIds || variantIds.length === 0) {
      return NextResponse.json({ error: 'No variants selected' }, { status: 400 })
    }

    if (value === undefined || value === null) {
      return NextResponse.json({ error: 'Value required' }, { status: 400 })
    }

    let updated = 0
    const errors: string[] = []

    // Process each variant
    for (const variantId of variantIds) {
      try {
        // Get current variant data
        const { data: variant, error: fetchError } = await supabase
          .from('product_variants')
          .select('id, stock, price_cents, sku')
          .eq('id', variantId)
          .eq('tenant_id', tenant?.id)
          .single()

        if (fetchError || !variant) {
          errors.push(`Variant ${variantId} not found`)
          continue
        }

        let newStock = variant.stock
        let newPrice = variant.price_cents

        switch (operation) {
          case 'adjust_stock':
            newStock = Math.max(0, variant.stock + value)
            break
          case 'set_stock':
            newStock = Math.max(0, value)
            break
          case 'adjust_price_percent':
            // value is percentage (e.g., 10 for +10%, -10 for -10%)
            newPrice = Math.round(variant.price_cents * (1 + value / 100))
            break
          case 'adjust_price_flat':
            // value is cents to add/subtract
            newPrice = Math.max(0, variant.price_cents + value)
            break
          case 'set_price':
            newPrice = Math.max(0, value)
            break
        }

        // Update variant
        const updateData: Record<string, number> = {}
        
        if (newStock !== variant.stock) {
          updateData.stock = newStock
          
          // Create audit entry for stock changes
          await supabase.from('inventory_audit').insert({
            tenant_id: tenant?.id,
            variant_id: variantId,
            delta: newStock - variant.stock,
            reason: reason || `Bulk ${operation}: ${variant.stock} → ${newStock}`,
            actor: user.id
          })
        }
        
        if (newPrice !== variant.price_cents) {
          updateData.price_cents = newPrice
        }

        if (Object.keys(updateData).length > 0) {
          const { error: updateError } = await supabase
            .from('product_variants')
            .update(updateData)
            .eq('id', variantId)
            .eq('tenant_id', tenant?.id)

          if (updateError) {
            errors.push(`Failed to update ${variant.sku}`)
          } else {
            updated++
          }
        } else {
          updated++ // No change needed but counted as success
        }
      } catch (e) {
        errors.push(`Error processing variant ${variantId}`)
        console.error(e)
      }
    }

    return NextResponse.json({ 
      success: true, 
      updated, 
      total: variantIds.length,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error) {
    console.error('Bulk operation error:', error)
    return NextResponse.json({ error: 'Failed to perform bulk operation' }, { status: 500 })
  }
}

async function getUserRole(supabase: SupabaseClient, userId: string, tenantId?: string): Promise<string | undefined> {
  let query = supabase
    .from('709_profiles')
    .select('role')
    .eq('id', userId)

  if (tenantId) {
    query = query.eq('tenant_id', tenantId)
  }

  const { data: profile } = await query.single()

  return profile?.role
}
