'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Search, Filter, MoreHorizontal, Edit, Eye, Trash2, Home } from 'lucide-react'
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
    status: 'pending',
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
    description: 'Luxury downtown condo with city views',
    features: ['Pool', 'Gym', 'Concierge'],
    title: 'Luxury Downtown Condo',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    listed_at: '2024-01-02T00:00:00Z',
  },
  {
    id: '3',
    agent_id: 'agent1',
    property_type: 'house',
    status: 'sold',
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

export function PropertiesTable() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')

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
      case 'active': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'sold': return 'bg-red-100 text-red-800'
      case 'off_market': return 'bg-gray-100 text-gray-800'
      case 'coming_soon': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredProperties = mockProperties.filter(property => {
    const matchesSearch = property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.street_address.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || property.status === statusFilter
    const matchesType = typeFilter === 'all' || property.property_type === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  return (
    <div className="bg-white rounded-lg border">
      {/* Filters */}
      <div className="p-6 border-b">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search properties..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="sold">Sold</SelectItem>
              <SelectItem value="off_market">Off Market</SelectItem>
              <SelectItem value="coming_soon">Coming Soon</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="house">House</SelectItem>
              <SelectItem value="condo">Condo</SelectItem>
              <SelectItem value="townhouse">Townhouse</SelectItem>
              <SelectItem value="apartment">Apartment</SelectItem>
              <SelectItem value="land">Land</SelectItem>
              <SelectItem value="commercial">Commercial</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Property</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Beds/Baths</TableHead>
              <TableHead>Square Ft</TableHead>
              <TableHead>Listed</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProperties.map((property) => (
              <TableRow key={property.id}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Home className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{property.title}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {property.street_address}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="capitalize">{property.property_type}</span>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(property.status)}>
                    {property.status === 'active' ? 'For Sale' :
                     property.status === 'pending' ? 'Pending' :
                     property.status === 'sold' ? 'Sold' :
                     property.status === 'coming_soon' ? 'Coming Soon' :
                     property.status}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">
                  {formatPrice(property.price)}
                </TableCell>
                <TableCell>
                  {property.bedrooms && property.bathrooms
                    ? `${property.bedrooms}/${property.bathrooms}`
                    : 'N/A'}
                </TableCell>
                <TableCell>
                  {property.square_feet?.toLocaleString() || 'N/A'}
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {new Date(property.listed_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Property
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 border-t flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Showing {filteredProperties.length} of {mockProperties.length} properties
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" disabled>
            Previous
          </Button>
          <Button variant="outline" size="sm">
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}