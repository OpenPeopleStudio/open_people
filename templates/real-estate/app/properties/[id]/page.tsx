import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Heart, MapPin, Bed, Bath, Square, Calendar, Share2, Phone, Mail } from 'lucide-react'
import { LeadCaptureForm } from '@/components/LeadCaptureForm'

// Mock property data - in real app, this would come from API
const mockProperty = {
  id: '1',
  agent_id: 'agent1',
  property_type: 'house',
  status: 'active',
  street_address: '123 Oak Street',
  city: 'Springfield',
  state_province: 'IL',
  postal_code: '62701',
  country: 'US',
  latitude: 39.7817,
  longitude: -89.6501,
  price: 450000,
  bedrooms: 4,
  bathrooms: 3,
  square_feet: 2500,
  lot_size: 0.25,
  year_built: 2015,
  description: `Welcome to this stunning modern home that perfectly blends contemporary design with comfortable living. This beautiful 4-bedroom, 3-bathroom home offers an open floor plan with high ceilings and abundant natural light throughout.

The main level features a gourmet kitchen with granite countertops, stainless steel appliances, and a large island perfect for entertaining. The adjacent living room opens to a covered patio, ideal for outdoor dining and relaxation.

Upstairs, you'll find four spacious bedrooms including a luxurious master suite with a walk-in closet and spa-like bathroom. The additional bedrooms provide plenty of space for family, guests, or a home office.

Recent updates include fresh paint, new flooring, and modern fixtures throughout. The property sits on a quarter-acre lot with mature landscaping and a two-car garage.

Don't miss this opportunity to own a move-in ready home in one of Springfield's most desirable neighborhoods!`,
  features: [
    'Open Floor Plan',
    'Gourmet Kitchen',
    'Master Suite',
    'Walk-in Closets',
    'Covered Patio',
    'Two-Car Garage',
    'Mature Landscaping',
    'Updated Appliances',
    'Fresh Paint',
    'New Flooring'
  ],
  title: 'Stunning Modern Home with Open Floor Plan',
  virtual_tour_url: 'https://example.com/virtual-tour',
  video_tour_url: 'https://example.com/video-tour',
  floor_plan_url: 'https://example.com/floor-plan',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  listed_at: '2024-01-01T00:00:00Z',
}

interface PropertyPageProps {
  params: {
    id: string
  }
}

export default function PropertyDetailPage({ params }: PropertyPageProps) {
  // In real app, fetch property by ID
  const property = mockProperty // Mock data

  if (!property) {
    notFound()
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
      case 'active': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'sold': return 'bg-red-100 text-red-800'
      case 'coming_soon': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Property Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Badge className={getStatusColor(property.status)}>
                  {property.status === 'active' ? 'For Sale' :
                   property.status === 'pending' ? 'Pending' :
                   property.status === 'sold' ? 'Sold' :
                   property.status}
                </Badge>
                <span className="text-sm text-gray-500 capitalize">
                  {property.property_type}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {property.title}
              </h1>
              <div className="flex items-center text-gray-600 mb-4">
                <MapPin className="h-5 w-5 mr-2" />
                <span>{property.street_address}, {property.city}, {property.state_province} {property.postal_code}</span>
              </div>
              <div className="text-4xl font-bold text-blue-600">
                {formatPrice(property.price)}
              </div>
            </div>

            <div className="flex gap-3 ml-6">
              <Button variant="outline" size="sm">
                <Heart className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>

          {/* Property Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6 pt-6 border-t">
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Bed className="h-5 w-5 text-gray-600" />
              </div>
              <div className="text-lg font-semibold">{property.bedrooms}</div>
              <div className="text-sm text-gray-600">Bedrooms</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Bath className="h-5 w-5 text-gray-600" />
              </div>
              <div className="text-lg font-semibold">{property.bathrooms}</div>
              <div className="text-sm text-gray-600">Bathrooms</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Square className="h-5 w-5 text-gray-600" />
              </div>
              <div className="text-lg font-semibold">{property.square_feet?.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Sq Ft</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Calendar className="h-5 w-5 text-gray-600" />
              </div>
              <div className="text-lg font-semibold">{property.year_built}</div>
              <div className="text-sm text-gray-600">Year Built</div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Property Images */}
            <Card>
              <CardContent className="p-0">
                <div className="aspect-video bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                  <span className="text-white text-lg">Property Images</span>
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-600">
                    High-quality photos and virtual tours available upon request.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>About This Property</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  {property.description.split('\n\n').map((paragraph, index) => (
                    <p key={index} className="mb-4 text-gray-700 leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Features */}
            <Card>
              <CardHeader>
                <CardTitle>Features & Amenities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {property.features.map((feature, index) => (
                    <div key={index} className="flex items-center">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Virtual Tours */}
            {(property.virtual_tour_url || property.video_tour_url) && (
              <Card>
                <CardHeader>
                  <CardTitle>Virtual Tours</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {property.virtual_tour_url && (
                      <Button variant="outline" className="w-full justify-start">
                        🏠 Virtual Tour
                      </Button>
                    )}
                    {property.video_tour_url && (
                      <Button variant="outline" className="w-full justify-start">
                        🎥 Video Tour
                      </Button>
                    )}
                    {property.floor_plan_url && (
                      <Button variant="outline" className="w-full justify-start">
                        📐 Floor Plan
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Agent */}
            <Card>
              <CardHeader>
                <CardTitle>Interested in This Property?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">👤</span>
                    </div>
                    <h3 className="font-semibold">Sarah Johnson</h3>
                    <p className="text-sm text-gray-600">Licensed Real Estate Agent</p>
                  </div>

                  <div className="space-y-2">
                    <Button className="w-full" size="lg">
                      <Phone className="h-4 w-4 mr-2" />
                      Call Agent
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Mail className="h-4 w-4 mr-2" />
                      Send Message
                    </Button>
                    <Button variant="outline" className="w-full">
                      Schedule Showing
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lead Capture Form */}
            <LeadCaptureForm
              title="Get More Details"
              subtitle="Receive updates about this property and similar listings"
              propertyId={property.id}
              compact={true}
            />
          </div>
        </div>
      </div>
    </div>
  )
}