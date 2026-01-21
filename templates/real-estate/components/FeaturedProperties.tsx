'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Heart, MapPin, Bed, Bath, Square, Eye } from 'lucide-react'
import type { Property } from '@/types/real-estate'

// Mock data - in real app, this would come from API
const mockProperties: Property[] = [
  {
    id: '1',
    agent_id: 'agent1',
    property_type: 'house',
    status: 'active',
    street_address: '123 Oak Street',
    city: 'Springfield',
    state_province: 'IL',
    postal_code: '62701',
    country: 'US',
    price: 450000,
    bedrooms: 4,
    bathrooms: 3,
    square_feet: 2500,
    lot_size: 0.25,
    year_built: 2015,
    description: 'Beautiful modern home with open floor plan',
    features: ['Garage', 'Garden', 'Modern Kitchen'],
    title: 'Stunning Modern Home',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    listed_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    agent_id: 'agent1',
    property_type: 'condo',
    status: 'active',
    street_address: '456 Pine Avenue',
    city: 'Springfield',
    state_province: 'IL',
    postal_code: '62702',
    country: 'US',
    price: 320000,
    bedrooms: 2,
    bathrooms: 2,
    square_feet: 1400,
    year_built: 2018,
    description: 'Luxury condo with city views',
    features: ['Pool', 'Gym', 'Concierge'],
    title: 'Downtown Luxury Condo',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    listed_at: '2024-01-02T00:00:00Z',
  },
  {
    id: '3',
    agent_id: 'agent1',
    property_type: 'house',
    status: 'active',
    street_address: '789 Elm Drive',
    city: 'Springfield',
    state_province: 'IL',
    postal_code: '62703',
    country: 'US',
    price: 280000,
    bedrooms: 3,
    bathrooms: 2,
    square_feet: 1800,
    lot_size: 0.15,
    year_built: 2005,
    description: 'Charming family home in quiet neighborhood',
    features: ['Fireplace', 'Deck', 'Updated Kitchen'],
    title: 'Family Home Paradise',
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z',
    listed_at: '2024-01-03T00:00:00Z',
  },
]

export function FeaturedProperties() {
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  const toggleFavorite = (propertyId: string) => {
    const newFavorites = new Set(favorites)
    if (newFavorites.has(propertyId)) {
      newFavorites.delete(propertyId)
    } else {
      newFavorites.add(propertyId)
    }
    setFavorites(newFavorites)
  }

  const formatPrice = (price: number | null) => {
    if (!price) return 'Price on Request'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(price)
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Featured Properties
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover our handpicked selection of premium properties in prime locations
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {mockProperties.map((property) => (
            <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative">
                {/* Property Image Placeholder */}
                <div className="h-48 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                  <Home className="h-16 w-16 text-white" />
                </div>

                {/* Status Badge */}
                <Badge className="absolute top-4 left-4 bg-green-500">
                  {property.status === 'active' ? 'For Sale' : property.status}
                </Badge>

                {/* Favorite Button */}
                <button
                  onClick={() => toggleFavorite(property.id)}
                  className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
                >
                  <Heart
                    className={`h-5 w-5 ${
                      favorites.has(property.id)
                        ? 'text-red-500 fill-current'
                        : 'text-gray-400'
                    }`}
                  />
                </button>
              </div>

              <CardContent className="p-6">
                <div className="mb-2">
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">
                    {property.title}
                  </h3>
                  <div className="flex items-center text-gray-600 mb-2">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span className="text-sm">
                      {property.street_address}, {property.city}, {property.state_province}
                    </span>
                  </div>
                </div>

                <div className="text-2xl font-bold text-blue-600 mb-4">
                  {formatPrice(property.price)}
                </div>

                <div className="flex items-center justify-between text-gray-600 mb-4">
                  <div className="flex items-center">
                    <Bed className="h-4 w-4 mr-1" />
                    <span className="text-sm">{property.bedrooms} beds</span>
                  </div>
                  <div className="flex items-center">
                    <Bath className="h-4 w-4 mr-1" />
                    <span className="text-sm">{property.bathrooms} baths</span>
                  </div>
                  <div className="flex items-center">
                    <Square className="h-4 w-4 mr-1" />
                    <span className="text-sm">{property.square_feet?.toLocaleString()} sqft</span>
                  </div>
                </div>

                <p className="text-gray-600 text-sm line-clamp-2">
                  {property.description}
                </p>
              </CardContent>

              <CardFooter className="p-6 pt-0">
                <div className="flex gap-2 w-full">
                  <Button variant="outline" className="flex-1">
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                  <Button className="flex-1">
                    Contact Agent
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button size="lg" variant="outline">
            View All Properties
          </Button>
        </div>
      </div>
    </section>
  )
}