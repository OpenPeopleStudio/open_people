import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Home, Search, FileText, Calculator, Camera, Users } from 'lucide-react'

const services = [
  {
    icon: Search,
    title: 'Property Search',
    description: 'Advanced search tools to find your perfect property with detailed filters and maps.'
  },
  {
    icon: Home,
    title: 'Property Management',
    description: 'Comprehensive property listings with professional photos, virtual tours, and detailed information.'
  },
  {
    icon: Calculator,
    title: 'Market Analysis',
    description: 'Real-time market data, pricing trends, and comparative market analysis for informed decisions.'
  },
  {
    icon: FileText,
    title: 'Transaction Management',
    description: 'Complete transaction coordination from offer to closing with document management.'
  },
  {
    icon: Camera,
    title: 'Professional Photography',
    description: 'High-quality property photography and virtual staging to showcase homes at their best.'
  },
  {
    icon: Users,
    title: 'Client Representation',
    description: 'Dedicated representation ensuring your interests are protected throughout the process.'
  }
]

export function Services() {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Our Services
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Comprehensive real estate services tailored to meet your unique needs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <service.icon className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-xl">{service.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{service.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}