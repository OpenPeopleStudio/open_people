/**
 * Consignment Automation Workflows
 * 
 * Automates consignment operations:
 * - Auto-calculate payouts
 * - Schedule payout batches
 * - Alert consignors when items sell
 */

export interface PayoutCalculation {
  consignor_id: string
  item_id: string
  sold_price_cents: number
  commission_cents: number
  payout_cents: number
  commission_rate: number
}

/**
 * Calculate payout for sold consignment item
 */
export async function calculateConsignmentPayout(
  supabase: any,
  itemId: string,
  soldPriceCents: number,
  tenantId?: string
): Promise<PayoutCalculation | null> {
  try {
    // Get consignment item with consignor details
    let itemQuery = supabase
      .from('consignment_items')
      .select(`
        id,
        consignor_id,
        consignor:consignors (id, commission_rate)
      `)
      .eq('id', itemId)
      .single()

    if (tenantId) {
      itemQuery = itemQuery.eq('tenant_id', tenantId)
    }

    const { data: item, error } = await itemQuery

    if (error || !item) {
      return null
    }

    const consignor = Array.isArray(item.consignor) ? item.consignor[0] : item.consignor
    const commissionRate = consignor.commission_rate || 20

    const commissionCents = Math.round((soldPriceCents * commissionRate) / 100)
    const payoutCents = soldPriceCents - commissionCents

    return {
      consignor_id: item.consignor_id,
      item_id: itemId,
      sold_price_cents: soldPriceCents,
      commission_cents: commissionCents,
      payout_cents: payoutCents,
      commission_rate: commissionRate,
    }
  } catch (error) {
    console.error('Payout calculation error:', error)
    return null
  }
}

/**
 * Schedule batch payouts for consignors with outstanding balances
 */
export async function scheduleBatchPayouts(
  supabase: any,
  minBalanceCents: number = 5000, // Minimum $50 for payout
  tenantId?: string
): Promise<{ scheduled: number; total_amount_cents: number }> {
  try {
    // Get consignors with balance above minimum
    let consignorsQuery = supabase
      .from('consignors')
      .select('id, email, name, balance_cents')
      .gte('balance_cents', minBalanceCents)

    if (tenantId) {
      consignorsQuery = consignorsQuery.eq('tenant_id', tenantId)
    }

    const { data: consignors } = await consignorsQuery

    if (!consignors || consignors.length === 0) {
      return { scheduled: 0, total_amount_cents: 0 }
    }

    let totalAmount = 0
    let scheduled = 0

    for (const consignor of consignors) {
      // Create payout record
      const { error: payoutError } = await supabase
        .from('consignment_payouts')
        .insert({
          tenant_id: tenantId,
          consignor_id: consignor.id,
          amount_cents: consignor.balance_cents,
          method: 'bank_transfer',
          status: 'pending',
          notes: 'Automated batch payout',
        })

      if (!payoutError) {
        totalAmount += consignor.balance_cents
        scheduled++

        // Log the scheduled payout
        await supabase.from('activity_logs').insert({
          tenant_id: tenantId,
          user_id: null,
          user_email: consignor.email,
          action: 'payout_scheduled',
          entity_type: 'consignment_payout',
          entity_id: consignor.id,
          details: {
            amount_cents: consignor.balance_cents,
            consignor_name: consignor.name,
          },
        })
      }
    }

    return { scheduled, total_amount_cents: totalAmount }
  } catch (error) {
    console.error('Batch payout scheduling error:', error)
    return { scheduled: 0, total_amount_cents: 0 }
  }
}

/**
 * Alert consignor when their item sells
 */
export async function alertConsignorOnSale(
  supabase: any,
  itemId: string,
  tenantId?: string
): Promise<{ success: boolean }> {
  try {
    // Get item and consignor details
    let itemQuery = supabase
      .from('consignment_items')
      .select(`
        id,
        sold_price_cents,
        payout_cents,
        consignor:consignors (id, email, name),
        variant:product_variants (
          sku,
          product:products (name, brand, model)
        )
      `)
      .eq('id', itemId)
      .single()

    if (tenantId) {
      itemQuery = itemQuery.eq('tenant_id', tenantId)
    }

    const { data: item } = await itemQuery

    if (!item) {
      return { success: false }
    }

    const consignor = Array.isArray(item.consignor) ? item.consignor[0] : item.consignor
    const variant = Array.isArray(item.variant) ? item.variant[0] : item.variant
    const product = variant?.product
    const productData = Array.isArray(product) ? product[0] : product

    // Log the notification (actual email would be sent here)
    await supabase.from('activity_logs').insert({
      tenant_id: tenantId,
      user_id: null,
      user_email: consignor.email,
      action: 'consignor_sale_notification',
      entity_type: 'consignment_item',
      entity_id: itemId,
      details: {
        product_name: productData?.name || `${productData?.brand} ${productData?.model}`,
        sold_price_cents: item.sold_price_cents,
        payout_cents: item.payout_cents,
        consignor_name: consignor.name,
      },
    })

    // TODO: Send actual email notification

    return { success: true }
  } catch (error) {
    console.error('Consignor alert error:', error)
    return { success: false }
  }
}
