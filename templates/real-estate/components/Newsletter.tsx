'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'

export function Newsletter() {
  return (
    <section className="py-16 bg-blue-900 text-white">
      <div className="container mx-auto px-4">
        <Card className="max-w-2xl mx-auto bg-white/10 border-white/20">
          <CardContent className="p-8 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Stay Updated on the Market
            </h2>
            <p className="text-blue-100 mb-6 text-lg">
              Get the latest property listings, market insights, and real estate tips delivered to your inbox.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Enter your email"
                className="flex-1 bg-white text-gray-900 border-white/30 placeholder:text-gray-500"
              />
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8">
                Subscribe
              </Button>
            </div>

            <p className="text-blue-200 text-sm mt-4">
              No spam, unsubscribe at any time. We respect your privacy.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}