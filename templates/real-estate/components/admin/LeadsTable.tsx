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
import { Search, MoreHorizontal, Mail, Phone, MessageSquare, Calendar } from 'lucide-react'
import type { Lead } from '@/types/real-estate'

// Mock data - in real app, this would come from API
const mockLeads: Lead[] = [
  {
    id: '1',
    agent_id: 'agent1',
    lead_type: 'buyer',
    status: 'qualified',
    first_name: 'Sarah',
    last_name: 'Johnson',
    email: 'sarah.j@email.com',
    phone: '(555) 123-4567',
    preferred_contact_method: 'email',
    budget_min: 300000,
    budget_max: 500000,
    property_types: ['house', 'condo'],
    preferred_locations: ['Springfield', 'Nearby suburbs'],
    timeline: '3_months',
    financing_status: 'pre_approved',
    notes: 'Looking for a family home with good schools',
    lead_source: 'website',
    source_details: 'Property search form',
    last_contacted_at: '2024-01-15T10:00:00Z',
    next_follow_up_at: '2024-01-20T14:00:00Z',
    follow_up_notes: 'Send property alerts for homes under $450k',
    created_at: '2024-01-10T00:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    agent_id: 'agent1',
    lead_type: 'seller',
    status: 'contacted',
    first_name: 'Mike',
    last_name: 'Chen',
    email: 'mike.chen@email.com',
    phone: '(555) 234-5678',
    preferred_contact_method: 'phone',
    budget_min: null,
    budget_max: null,
    property_types: null,
    preferred_locations: null,
    timeline: null,
    financing_status: null,
    notes: 'Inherited family home, considering downsizing',
    lead_source: 'referral',
    source_details: 'Referred by John Smith',
    last_contacted_at: '2024-01-12T15:30:00Z',
    next_follow_up_at: '2024-01-18T10:00:00Z',
    follow_up_notes: 'Schedule property evaluation',
    created_at: '2024-01-08T00:00:00Z',
    updated_at: '2024-01-12T15:30:00Z',
  },
  {
    id: '3',
    agent_id: 'agent1',
    lead_type: 'buyer',
    status: 'new',
    first_name: 'Lisa',
    last_name: 'Rodriguez',
    email: 'lisa.r@email.com',
    phone: '(555) 345-6789',
    preferred_contact_method: 'email',
    budget_min: 200000,
    budget_max: 350000,
    property_types: ['condo', 'townhouse'],
    preferred_locations: ['Downtown', 'Arts District'],
    timeline: 'immediately',
    financing_status: 'not_yet',
    notes: 'First-time buyer, needs pre-approval guidance',
    lead_source: 'social_media',
    source_details: 'Facebook ad campaign',
    last_contacted_at: null,
    next_follow_up_at: '2024-01-17T09:00:00Z',
    follow_up_notes: 'Welcome email sent, follow up on pre-approval',
    created_at: '2024-01-14T00:00:00Z',
    updated_at: '2024-01-14T00:00:00Z',
  },
  {
    id: '4',
    agent_id: 'agent1',
    lead_type: 'investor',
    status: 'qualified',
    first_name: 'David',
    last_name: 'Williams',
    email: 'david.w@email.com',
    phone: '(555) 456-7890',
    preferred_contact_method: 'phone',
    budget_min: 500000,
    budget_max: 2000000,
    property_types: ['multi_family', 'commercial'],
    preferred_locations: ['Growing neighborhoods'],
    timeline: '1_year',
    financing_status: 'cash_buyer',
    notes: 'Experienced investor looking for rental properties',
    lead_source: 'networking',
    source_details: 'Real estate investor meetup',
    last_contacted_at: '2024-01-13T11:00:00Z',
    next_follow_up_at: '2024-01-25T16:00:00Z',
    follow_up_notes: 'Send market analysis report',
    created_at: '2024-01-05T00:00:00Z',
    updated_at: '2024-01-13T11:00:00Z',
  },
]

export function LeadsTable() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  const formatBudget = (min: number | null, max: number | null) => {
    if (!min && !max) return 'Not specified'
    if (min && max) {
      return `$${min.toLocaleString()} - $${max.toLocaleString()}`
    }
    if (min) return `$${min.toLocaleString()}+`
    if (max) return `Up to $${max.toLocaleString()}`
    return 'Not specified'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800'
      case 'contacted': return 'bg-yellow-100 text-yellow-800'
      case 'qualified': return 'bg-green-100 text-green-800'
      case 'proposal': return 'bg-purple-100 text-purple-800'
      case 'negotiating': return 'bg-orange-100 text-orange-800'
      case 'closed': return 'bg-emerald-100 text-emerald-800'
      case 'lost': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getLeadTypeColor = (type: string) => {
    switch (type) {
      case 'buyer': return 'bg-blue-100 text-blue-800'
      case 'seller': return 'bg-green-100 text-green-800'
      case 'renter': return 'bg-purple-100 text-purple-800'
      case 'investor': return 'bg-orange-100 text-orange-800'
      case 'agent': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredLeads = mockLeads.filter(lead => {
    const fullName = `${lead.first_name} ${lead.last_name}`.toLowerCase()
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) ||
                         lead.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter
    const matchesType = typeFilter === 'all' || lead.lead_type === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className="bg-white rounded-lg border">
      {/* Filters */}
      <div className="p-6 border-b">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search leads..."
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
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="qualified">Qualified</SelectItem>
              <SelectItem value="proposal">Proposal</SelectItem>
              <SelectItem value="negotiating">Negotiating</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="buyer">Buyer</SelectItem>
              <SelectItem value="seller">Seller</SelectItem>
              <SelectItem value="renter">Renter</SelectItem>
              <SelectItem value="investor">Investor</SelectItem>
              <SelectItem value="agent">Agent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lead</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Budget</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Last Contact</TableHead>
              <TableHead>Next Follow-up</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLeads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell>
                  <div>
                    <div className="font-medium text-gray-900">
                      {lead.first_name} {lead.last_name}
                    </div>
                    <div className="text-sm text-gray-500">{lead.email}</div>
                    <div className="text-sm text-gray-500">{lead.phone}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getLeadTypeColor(lead.lead_type)}>
                    {lead.lead_type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(lead.status)}>
                    {lead.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {formatBudget(lead.budget_min, lead.budget_max)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div className="font-medium capitalize">{lead.lead_source?.replace('_', ' ')}</div>
                    {lead.source_details && (
                      <div className="text-gray-500 text-xs">{lead.source_details}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {formatDate(lead.last_contacted_at)}
                </TableCell>
                <TableCell className="text-sm">
                  {lead.next_follow_up_at ? (
                    <div className="text-blue-600">
                      {formatDate(lead.next_follow_up_at)}
                    </div>
                  ) : (
                    <span className="text-gray-400">Not scheduled</span>
                  )}
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
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Send Message
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Mail className="h-4 w-4 mr-2" />
                        Send Email
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Phone className="h-4 w-4 mr-2" />
                        Call
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Calendar className="h-4 w-4 mr-2" />
                        Schedule Follow-up
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
          Showing {filteredLeads.length} of {mockLeads.length} leads
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