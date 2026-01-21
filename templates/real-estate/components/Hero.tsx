'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, MapPin, Home, TrendingUp } from 'lucide-react'

export function Hero() {
  return (
    <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white">
      <div className="absolute inset-0 bg-black/20" />
      <div className="relative container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Find Your Dream Home
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-blue-100">
            Professional real estate services with personalized attention and expert guidance
          </p>

          {/* Search Bar */}
          <div className="bg-white rounded-lg p-2 shadow-2xl max-w-2xl mx-auto mb-8">
            <div className="flex flex-col md:flex-row gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Enter city, neighborhood, or address"
                  className="pl-10 h-12 text-gray-900 border-0"
                />
              </div>
              <Button size="lg" className="h-12 px-8">
                Search Properties
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Home className="h-8 w-8 text-blue-300" />
              </div>
              <div className="text-3xl font-bold">500+</div>
              <div className="text-blue-200">Properties Listed</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <MapPin className="h-8 w-8 text-blue-300" />
              </div>
              <div className="text-3xl font-bold">50+</div>
              <div className="text-blue-200">Cities Covered</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-8 w-8 text-blue-300" />
              </div>
              <div className="text-3xl font-bold">15+</div>
              <div className="text-blue-200">Years Experience</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}