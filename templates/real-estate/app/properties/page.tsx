import { PropertiesList } from '@/components/PropertiesList'
import { PropertyFilters } from '@/components/PropertyFilters'

export default function PropertiesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Property Listings
            </h1>
            <p className="text-xl text-gray-600">
              Find your perfect property from our curated selection
            </p>
          </div>

          <PropertyFilters />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <PropertiesList />
      </div>
    </div>
  )
}