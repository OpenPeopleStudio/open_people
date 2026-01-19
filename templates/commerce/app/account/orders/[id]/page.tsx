'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

interface OrderItem {
  qty: number
  price_cents: number
  product_variants: {
    sku: string
    brand: string
    model: string
    size: string | null
    condition_code: string
    products: {
      name: string
    }
  }
}

interface Order {
  id: string
  status: string
  total_cents: number
  shipping_cents: number
  shipping_address: {
    name: string
    line1: string
    line2?: string
    city: string
    province: string
    postal_code: string
    country: string
  }
  tracking_number: string | null
  carrier: string | null
  created_at: string
  paid_at: string | null
  fulfilled_at: string | null
  shipped_at: string | null
  order_items: OrderItem[]
}

export default function OrderDetailPage() {
  const params = useParams()
  const orderId = params.id as string
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/orders/${orderId}`)
        if (response.ok) {
          const data = await response.json()
          setOrder(data.order)
        }
      } catch (error) {
        console.error('Failed to fetch order:', error)
      } finally {
        setLoading(false)
      }
    }

    if (orderId) {
      fetchOrder()
    }
  }, [orderId])

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <p className="text-red-600">Order not found or access denied.</p>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-blue-100 text-blue-800'
      case 'fulfilled': return 'bg-yellow-100 text-yellow-800'
      case 'shipped': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'refunded': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const subtotal = order.order_items.reduce((sum, item) => sum + (item.price_cents * item.qty), 0)

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Order #{order.id.slice(-8)}</h1>
          <p className="mt-2 text-gray-600">
            Placed on {new Date(order.created_at).toLocaleDateString()}
          </p>
        </div>

        {/* Order Status */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Order Status</h2>
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(order.status)}`}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
          </div>

          {/* Status Timeline */}
          <div className="flex space-x-8">
            <div className={`flex flex-col items-center ${order.paid_at ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-4 h-4 rounded-full mb-2 ${order.paid_at ? 'bg-green-600' : 'bg-gray-400'}`}></div>
              <span className="text-sm">Payment</span>
              {order.paid_at && (
                <span className="text-xs mt-1">{new Date(order.paid_at).toLocaleDateString()}</span>
              )}
            </div>
            <div className={`flex flex-col items-center ${order.fulfilled_at ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-4 h-4 rounded-full mb-2 ${order.fulfilled_at ? 'bg-green-600' : 'bg-gray-400'}`}></div>
              <span className="text-sm">Fulfilled</span>
              {order.fulfilled_at && (
                <span className="text-xs mt-1">{new Date(order.fulfilled_at).toLocaleDateString()}</span>
              )}
            </div>
            <div className={`flex flex-col items-center ${order.shipped_at ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-4 h-4 rounded-full mb-2 ${order.shipped_at ? 'bg-green-600' : 'bg-gray-400'}`}></div>
              <span className="text-sm">Shipped</span>
              {order.shipped_at && (
                <span className="text-xs mt-1">{new Date(order.shipped_at).toLocaleDateString()}</span>
              )}
            </div>
          </div>

          {order.tracking_number && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Tracking Information</h3>
              <p className="text-gray-600">
                Tracking Number: <span className="font-mono">{order.tracking_number}</span>
                {order.carrier && <span> ({order.carrier})</span>}
              </p>
            </div>
          )}
        </div>

        {/* Order Items */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Items Ordered</h2>
          <div className="space-y-4">
            {order.order_items.map((item, index) => (
              <div key={index} className="flex justify-between items-center py-4 border-b border-gray-100 last:border-b-0">
                <div>
                  <h3 className="font-medium text-gray-900">
                    {item.product_variants.brand} {item.product_variants.model}
                  </h3>
                  <p className="text-sm text-gray-600">
                    SKU: {item.product_variants.sku}
                    {item.product_variants.size && ` • Size: ${item.product_variants.size}`}
                    {` • Condition: ${item.product_variants.condition_code}`}
                  </p>
                  <p className="text-sm text-gray-500">Quantity: {item.qty}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    ${(item.price_cents * item.qty / 100).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="mt-6 border-t pt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Subtotal:</span>
              <span>${(subtotal / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Shipping:</span>
              <span>${(order.shipping_cents / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-semibold text-gray-900 pt-2 border-t">
              <span>Total:</span>
              <span>${(order.total_cents / 100).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Shipping Address</h2>
          <div className="text-gray-600">
            <p className="font-medium text-gray-900">{order.shipping_address.name}</p>
            <p>{order.shipping_address.line1}</p>
            {order.shipping_address.line2 && <p>{order.shipping_address.line2}</p>}
            <p>{order.shipping_address.city}, {order.shipping_address.province} {order.shipping_address.postal_code}</p>
            <p>{order.shipping_address.country}</p>
          </div>
        </div>
      </div>
    </div>
  )
}