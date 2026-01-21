import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  TrendingUp,
  TrendingDown,
  Users,
  Building,
  Calendar,
  DollarSign,
  Eye,
  MessageSquare
} from 'lucide-react'

// Mock data - in real app, this would come from API
const stats = [
  {
    title: 'Total Properties',
    value: '24',
    change: '+12%',
    changeType: 'increase' as const,
    icon: Building,
  },
  {
    title: 'Active Leads',
    value: '47',
    change: '+8%',
    changeType: 'increase' as const,
    icon: Users,
  },
  {
    title: 'Appointments This Week',
    value: '12',
    change: '+23%',
    changeType: 'increase' as const,
    icon: Calendar,
  },
  {
    title: 'Monthly Revenue',
    value: '$45,231',
    change: '-4%',
    changeType: 'decrease' as const,
    icon: DollarSign,
  },
]

const recentProperties = [
  {
    id: '1',
    title: 'Modern Downtown Condo',
    price: 320000,
    status: 'active',
    views: 145,
    inquiries: 3,
  },
  {
    id: '2',
    title: 'Family Home in Suburbs',
    price: 450000,
    status: 'pending',
    views: 89,
    inquiries: 7,
  },
  {
    id: '3',
    title: 'Luxury Townhouse',
    price: 395000,
    status: 'active',
    views: 203,
    inquiries: 12,
  },
]

const recentLeads = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.j@email.com',
    type: 'buyer',
    status: 'qualified',
    lastContact: '2 hours ago',
  },
  {
    id: '2',
    name: 'Mike Chen',
    email: 'mike.chen@email.com',
    type: 'seller',
    status: 'contacted',
    lastContact: '1 day ago',
  },
  {
    id: '3',
    name: 'Lisa Rodriguez',
    email: 'lisa.r@email.com',
    type: 'buyer',
    status: 'new',
    lastContact: '3 days ago',
  },
]

export default function AdminDashboard() {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(price)
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, Agent Smith!</h1>
        <p className="text-gray-600">Here's what's happening with your real estate business today.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                {stat.changeType === 'increase' ? (
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                )}
                <span className={stat.changeType === 'increase' ? 'text-green-500' : 'text-red-500'}>
                  {stat.change}
                </span>
                <span className="ml-1">from last month</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Properties */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Properties</CardTitle>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentProperties.map((property) => (
                <div key={property.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{property.title}</h4>
                    <p className="text-sm text-gray-600">{formatPrice(property.price)}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <Badge variant={property.status === 'active' ? 'default' : 'secondary'}>
                        {property.status}
                      </Badge>
                      <div className="flex items-center">
                        <Eye className="h-3 w-3 mr-1" />
                        {property.views} views
                      </div>
                      <div className="flex items-center">
                        <MessageSquare className="h-3 w-3 mr-1" />
                        {property.inquiries} inquiries
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Leads */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Leads</CardTitle>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentLeads.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{lead.name}</h4>
                    <p className="text-sm text-gray-600">{lead.email}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <Badge variant="outline">
                        {lead.type}
                      </Badge>
                      <Badge variant={
                        lead.status === 'qualified' ? 'default' :
                        lead.status === 'contacted' ? 'secondary' :
                        'outline'
                      }>
                        {lead.status}
                      </Badge>
                      <span>Last contact: {lead.lastContact}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    View
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button className="h-20 flex flex-col items-center justify-center">
              <Building className="h-6 w-6 mb-2" />
              Add Property
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
              <Users className="h-6 w-6 mb-2" />
              Add Lead
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
              <Calendar className="h-6 w-6 mb-2" />
              Schedule Showing
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
              <MessageSquare className="h-6 w-6 mb-2" />
              Send Message
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}