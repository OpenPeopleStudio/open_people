import { LeadsTable } from '@/components/admin/LeadsTable'
import { Button } from '@/components/ui/button'
import { Plus, Download } from 'lucide-react'

export default function AdminLeadsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-gray-600">Manage your client leads and prospects</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Lead
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border">
          <div className="text-2xl font-bold text-blue-600">47</div>
          <div className="text-sm text-gray-600">Total Leads</div>
          <div className="text-xs text-green-600 mt-1">+8% from last month</div>
        </div>
        <div className="bg-white p-6 rounded-lg border">
          <div className="text-2xl font-bold text-green-600">12</div>
          <div className="text-sm text-gray-600">Qualified Leads</div>
          <div className="text-xs text-green-600 mt-1">Ready for proposals</div>
        </div>
        <div className="bg-white p-6 rounded-lg border">
          <div className="text-2xl font-bold text-yellow-600">23</div>
          <div className="text-sm text-gray-600">In Progress</div>
          <div className="text-xs text-gray-600 mt-1">Need follow-up</div>
        </div>
        <div className="bg-white p-6 rounded-lg border">
          <div className="text-2xl font-bold text-purple-600">8</div>
          <div className="text-sm text-gray-600">Converted</div>
          <div className="text-xs text-green-600 mt-1">This month</div>
        </div>
      </div>

      {/* Lead Pipeline */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Lead Pipeline</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">15</div>
            <div className="text-sm text-gray-600">New</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div className="bg-gray-400 h-2 rounded-full" style={{ width: '100%' }}></div>
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">18</div>
            <div className="text-sm text-gray-600">Contacted</div>
            <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: '75%' }}></div>
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">8</div>
            <div className="text-sm text-gray-600">Qualified</div>
            <div className="w-full bg-yellow-200 rounded-full h-2 mt-2">
              <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '50%' }}></div>
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">4</div>
            <div className="text-sm text-gray-600">Proposal</div>
            <div className="w-full bg-orange-200 rounded-full h-2 mt-2">
              <div className="bg-orange-500 h-2 rounded-full" style={{ width: '25%' }}></div>
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">2</div>
            <div className="text-sm text-gray-600">Closed</div>
            <div className="w-full bg-green-200 rounded-full h-2 mt-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: '10%' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <LeadsTable />
    </div>
  )
}