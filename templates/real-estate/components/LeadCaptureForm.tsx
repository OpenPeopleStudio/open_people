'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Home, CheckCircle } from 'lucide-react'
import type { LeadFormData } from '@/types/real-estate'

interface LeadCaptureFormProps {
  title?: string
  subtitle?: string
  propertyId?: string
  compact?: boolean
}

export function LeadCaptureForm({
  title = "Get Property Alerts",
  subtitle = "Tell us what you're looking for and we'll send you matching properties",
  propertyId,
  compact = false
}: LeadCaptureFormProps) {
  const [formData, setFormData] = useState<Partial<LeadFormData>>({
    lead_type: 'buyer',
    preferred_contact_method: 'email',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleInputChange = (field: keyof LeadFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))

    setIsSubmitting(false)
    setIsSubmitted(true)
  }

  if (isSubmitted) {
    return (
      <Card className={compact ? "max-w-md" : "max-w-2xl mx-auto"}>
        <CardContent className="pt-8 pb-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Thank you for your interest!
          </h3>
          <p className="text-gray-600 mb-4">
            We've received your information and will be in touch soon with properties that match your criteria.
          </p>
          <Badge variant="outline" className="text-sm">
            Lead submitted successfully
          </Badge>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={compact ? "max-w-md" : "max-w-2xl mx-auto"}>
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <Home className="h-6 w-6 text-blue-600" />
          <CardTitle className="text-xl">{title}</CardTitle>
        </div>
        <p className="text-gray-600">{subtitle}</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name *
              </label>
              <Input
                required
                value={formData.first_name || ''}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                placeholder="John"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name *
              </label>
              <Input
                required
                value={formData.last_name || ''}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                placeholder="Smith"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <Input
              type="email"
              required
              value={formData.email || ''}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="john.smith@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <Input
              type="tel"
              value={formData.phone || ''}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="(555) 123-4567"
            />
          </div>

          {/* Lead Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              I am a...
            </label>
            <Select
              value={formData.lead_type}
              onValueChange={(value) => handleInputChange('lead_type', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="buyer">Buyer - Looking to purchase</SelectItem>
                <SelectItem value="seller">Seller - Looking to sell</SelectItem>
                <SelectItem value="renter">Renter - Looking to rent</SelectItem>
                <SelectItem value="investor">Investor - Looking to invest</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Budget Range */}
          {(formData.lead_type === 'buyer' || formData.lead_type === 'investor') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Budget
                </label>
                <Input
                  type="number"
                  value={formData.budget_min || ''}
                  onChange={(e) => handleInputChange('budget_min', parseInt(e.target.value) || undefined)}
                  placeholder="200000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Budget
                </label>
                <Input
                  type="number"
                  value={formData.budget_max || ''}
                  onChange={(e) => handleInputChange('budget_max', parseInt(e.target.value) || undefined)}
                  placeholder="500000"
                />
              </div>
            </div>
          )}

          {/* Property Types */}
          {(formData.lead_type === 'buyer' || formData.lead_type === 'renter' || formData.lead_type === 'investor') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property Types Interested In
              </label>
              <Select onValueChange={(value) => handleInputChange('property_types', [value])}>
                <SelectTrigger>
                  <SelectValue placeholder="Select property types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="house">Single Family Home</SelectItem>
                  <SelectItem value="condo">Condominium</SelectItem>
                  <SelectItem value="townhouse">Townhouse</SelectItem>
                  <SelectItem value="apartment">Apartment</SelectItem>
                  <SelectItem value="land">Land</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="multi_family">Multi-Family</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Timeline */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              When are you looking to {formData.lead_type === 'seller' ? 'sell' : formData.lead_type === 'renter' ? 'move' : 'buy'}?
            </label>
            <Select
              value={formData.timeline}
              onValueChange={(value) => handleInputChange('timeline', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select timeline" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediately">Immediately (ready now)</SelectItem>
                <SelectItem value="1_month">Within 1 month</SelectItem>
                <SelectItem value="3_months">Within 3 months</SelectItem>
                <SelectItem value="6_months">Within 6 months</SelectItem>
                <SelectItem value="1_year">Within 1 year</SelectItem>
                <SelectItem value="just_looking">Just browsing</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Preferred Contact Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Contact Method
            </label>
            <Select
              value={formData.preferred_contact_method}
              onValueChange={(value) => handleInputChange('preferred_contact_method', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="phone">Phone Call</SelectItem>
                <SelectItem value="text">Text Message</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Information
            </label>
            <Textarea
              value={formData.notes || ''}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Tell us about any specific requirements, neighborhoods you're interested in, or other details..."
              rows={3}
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Get Property Alerts'}
          </Button>

          <p className="text-xs text-gray-500 text-center">
            By submitting this form, you agree to be contacted about real estate opportunities.
            We respect your privacy and will never share your information.
          </p>
        </form>
      </CardContent>
    </Card>
  )
}