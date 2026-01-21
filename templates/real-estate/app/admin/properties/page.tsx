import { PropertiesTable } from '@/components/admin/PropertiesTable'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default function AdminPropertiesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
          <p className="text-gray-600">Manage your property listings and inventory</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Property
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border">
          <div className="text-2xl font-bold text-blue-600">24</div>
          <div className="text-sm text-gray-600">Total Properties</div>
        </div>
        <div className="bg-white p-6 rounded-lg border">
          <div className="text-2xl font-bold text-green-600">18</div>
          <div className="text-sm text-gray-600">Active Listings</div>
        </div>
        <div className="bg-white p-6 rounded-lg border">
          <div className="text-2xl font-bold text-yellow-600">4</div>
          <div className="text-sm text-gray-600">Pending Sales</div>
        </div>
        <div className="bg-white p-6 rounded-lg border">
          <div className="text-2xl font-bold text-red-600">2</div>
          <div className="text-sm text-gray-600">Sold This Month</div>
        </div>
      </div>

      {/* Properties Table */}
      <PropertiesTable />
    </div>
  )
}