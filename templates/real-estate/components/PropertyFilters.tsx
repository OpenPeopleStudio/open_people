'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Search, Filter, X } from 'lucide-react'
import type { PropertySearchFilters } from '@/types/real-estate'

export function PropertyFilters() {
  const [filters, setFilters] = useState<PropertySearchFilters>({
    min_price: undefined,
    max_price: undefined,
    min_bedrooms: undefined,
    property_type: [],
  })
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleFilterChange = (key: keyof PropertySearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      min_price: undefined,
      max_price: undefined,
      min_bedrooms: undefined,
      property_type: [],
    })
  }

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search by location, address, or MLS number..."
                className="pl-10 h-12"
              />
            </div>
          </div>

          {/* Basic Filters */}
          <div className="flex gap-4">
            <Select onValueChange={(value) => handleFilterChange('property_type', [value])}>
              <SelectTrigger className="w-40 h-12">
                <SelectValue placeholder="Property Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="house">House</SelectItem>
                <SelectItem value="condo">Condo</SelectItem>
                <SelectItem value="townhouse">Townhouse</SelectItem>
                <SelectItem value="apartment">Apartment</SelectItem>
                <SelectItem value="land">Land</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
              </SelectContent>
            </Select>

            <Select onValueChange={(value) => handleFilterChange('min_bedrooms', parseInt(value))}>
              <SelectTrigger className="w-32 h-12">
                <SelectValue placeholder="Beds" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1+</SelectItem>
                <SelectItem value="2">2+</SelectItem>
                <SelectItem value="3">3+</SelectItem>
                <SelectItem value="4">4+</SelectItem>
                <SelectItem value="5">5+</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="h-12 px-4"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>

            <Button className="h-12 px-8">
              Search
            </Button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="mt-6 pt-6 border-t">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Min Price
                </label>
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.min_price || ''}
                  onChange={(e) => handleFilterChange('min_price', parseInt(e.target.value) || undefined)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Price
                </label>
                <Input
                  type="number"
                  placeholder="No limit"
                  value={filters.max_price || ''}
                  onChange={(e) => handleFilterChange('max_price', parseInt(e.target.value) || undefined)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Min Sq Ft
                </label>
                <Input
                  type="number"
                  placeholder="0"
                  onChange={(e) => handleFilterChange('min_square_feet', parseInt(e.target.value) || undefined)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <Select onValueChange={(value) => handleFilterChange('status', [value])}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="sold">Sold</SelectItem>
                    <SelectItem value="coming_soon">Coming Soon</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <Button variant="ghost" onClick={clearFilters} className="text-gray-600">
                <X className="h-4 w-4 mr-2" />
                Clear All Filters
              </Button>

              <Button>
                Apply Filters
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}