'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Heart, MapPin, Bed, Bath, Square, Eye, Grid, List } from 'lucide-react'
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
    description: 'Beautiful modern home with open floor plan, updated kitchen, and master suite with walk-in closet.',
    features: ['Garage', 'Garden', 'Modern Kitchen', 'Hardwood Floors', 'Walk-in Closet'],
    title: 'Stunning Modern Home with Open Floor Plan',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    listed_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    agent_id: 'agent1',
    property_type: 'condo',
    status: 'active',
    street_address: '456 Pine Avenue, Unit 5B',
    city: 'Springfield',
    state_province: 'IL',
    postal_code: '62702',
    country: 'US',
    price: 320000,
    bedrooms: 2,
    bathrooms: 2,
    square_feet: 1400,
    year_built: 2018,
    description: 'Luxury downtown condo with floor-to-ceiling windows, stainless steel appliances, and city views.',
    features: ['Pool', 'Gym', 'Concierge', 'Stainless Appliances', 'City Views'],
    title: 'Luxury Downtown Condo with City Views',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    listed_at: '2024-01-02T00:00:00Z',
  },
  {
    id: '3',
    agent_id: 'agent1',
    property_type: 'house',
    status: 'pending',
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
    description: 'Charming family home in quiet neighborhood with updated kitchen and finished basement.',
    features: ['Fireplace', 'Deck', 'Updated Kitchen', 'Finished Basement'],
    title: 'Charming Family Home in Quiet Neighborhood',
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z',
    listed_at: '2024-01-03T00:00:00Z',
  },
  {
    id: '4',
    agent_id: 'agent1',
    property_type: 'townhouse',
    status: 'active',
    street_address: '321 Maple Lane',
    city: 'Springfield',
    state_province: 'IL',
    postal_code: '62704',
    country: 'US',
    price: 395000,
    bedrooms: 3,
    bathrooms: 2.5,
    square_feet: 2100,
    year_built: 2019,
    description: 'Modern townhouse with private garage, rooftop deck, and low maintenance living.',
    features: ['Garage', 'Rooftop Deck', 'Low Maintenance', 'Private Entrance'],
    title: 'Modern Townhouse with Rooftop Deck',
    created_at: '2024-01-04T00:00:00Z',
    updated_at: '2024-01-04T00:00:00Z',
    listed_at: '2024-01-04T00:00:00Z',
  },
  {
    id: '5',
    agent_id: 'agent1',
    property_type: 'land',
    status: 'active',
    street_address: '555 River Road',
    city: 'Springfield',
    state_province: 'IL',
    postal_code: '62705',
    country: 'US',
    price: 150000,
    lot_size: 5.2,
    description: '5+ acre wooded lot perfect for building your dream home with river access.',
    features: ['River Access', 'Wooded', 'Secluded', 'Buildable'],
    title: '5+ Acre Wooded Lot with River Access',
    created_at: '2024-01-05T00:00:00Z',
    updated_at: '2024-01-05T00:00:00Z',
    listed_at: '2024-01-05T00:00:00Z',
  },
  {
    id: '6',
    agent_id: 'agent1',
    property_type: 'commercial',
    status: 'active',
    street_address: '100 Main Street',
    city: 'Springfield',
    state_province: 'IL',
    postal_code: '62701',
    country: 'US',
    price: 750000,
    square_feet: 5000,
    year_built: 1995,
    description: 'Prime downtown commercial space with high visibility and excellent foot traffic.',
    features: ['High Visibility', 'Downtown Location', 'Ample Parking', 'Updated Systems'],
    title: 'Prime Downtown Commercial Space',
    created_at: '2024-01-06T00:00:00Z',
    updated_at: '2024-01-06T00:00:00Z',
    listed_at: '2024-01-06T00:00:00Z',
  },
]

export function PropertiesList() {
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState('newest')

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'pending': return 'bg-yellow-500'
      case 'sold': return 'bg-red-500'
      case 'coming_soon': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div>
      {/* Controls */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <span className="text-gray-600">
            Showing {mockProperties.length} properties
          </span>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="sqft">Square Feet</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Properties Grid/List */}
      <div className={
        viewMode === 'grid'
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          : "space-y-4"
      }>
        {mockProperties.map((property) => (
          <Card key={property.id} className={viewMode === 'list' ? "flex" : "overflow-hidden hover:shadow-lg transition-shadow"}>
            {/* Property Image */}
            <div className={viewMode === 'list' ? "w-48 flex-shrink-0" : "relative"}>
              <div className={viewMode === 'list' ? "h-32" : "h-48 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center"}>
                <Home className="h-16 w-16 text-white" />
              </div>

              {/* Status Badge */}
              <Badge className={`absolute top-4 left-4 ${getStatusColor(property.status)}`}>
                {property.status === 'active' ? 'For Sale' :
                 property.status === 'pending' ? 'Pending' :
                 property.status === 'sold' ? 'Sold' :
                 property.status === 'coming_soon' ? 'Coming Soon' :
                 property.status}
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

            <div className={viewMode === 'list' ? "flex-1" : ""}>
              <CardContent className={viewMode === 'list' ? "p-4" : "p-6"}>
                <div className="mb-2">
                  <h3 className="text-xl font-semibold text-gray-900 mb-1 line-clamp-1">
                    {property.title}
                  </h3>
                  <div className="flex items-center text-gray-600 mb-2">
                    <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                    <span className="text-sm truncate">
                      {property.street_address}, {property.city}, {property.state_province}
                    </span>
                  </div>
                </div>

                <div className="text-2xl font-bold text-blue-600 mb-4">
                  {formatPrice(property.price)}
                </div>

                <div className="flex items-center justify-between text-gray-600 mb-4">
                  {property.bedrooms && (
                    <div className="flex items-center">
                      <Bed className="h-4 w-4 mr-1" />
                      <span className="text-sm">{property.bedrooms} beds</span>
                    </div>
                  )}
                  {property.bathrooms && (
                    <div className="flex items-center">
                      <Bath className="h-4 w-4 mr-1" />
                      <span className="text-sm">{property.bathrooms} baths</span>
                    </div>
                  )}
                  {property.square_feet && (
                    <div className="flex items-center">
                      <Square className="h-4 w-4 mr-1" />
                      <span className="text-sm">{property.square_feet.toLocaleString()} sqft</span>
                    </div>
                  )}
                </div>

                <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                  {property.description}
                </p>

                {property.features && property.features.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {property.features.slice(0, 3).map((feature, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                    {property.features.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{property.features.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>

              <CardFooter className={viewMode === 'list' ? "p-4 pt-0" : "p-6 pt-0"}>
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
            </div>
          </Card>
        ))}
      </div>

      {/* Load More */}
      <div className="text-center mt-12">
        <Button variant="outline" size="lg">
          Load More Properties
        </Button>
      </div>
    </div>
  )
}