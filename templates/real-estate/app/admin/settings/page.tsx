'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { User, Building, MapPin, Phone, Mail, Globe } from 'lucide-react'

export default function AdminSettingsPage() {
  const [profile, setProfile] = useState({
    full_name: 'Sarah Johnson',
    phone: '(555) 123-4567',
    email: 'sarah@johnsonrealty.com',
    license_number: 'CA-DRE-12345678',
    brokerage_name: 'Premier Realty Group',
    bio: 'Experienced real estate professional with 8+ years helping families find their dream homes.',
    specialties: ['Residential', 'First-time Buyers', 'Investment Properties'],
    languages: ['English', 'Spanish'],
    profile_image_url: '',
  })

  const [business, setBusiness] = useState({
    company_name: 'Johnson Realty',
    website: 'https://johnsonrealty.com',
    address: '123 Main Street, Springfield, IL 62701',
    phone: '(555) 123-4567',
    email: 'info@johnsonrealty.com',
    service_areas: ['Springfield', 'Nearby suburbs', 'Greater Metro Area'],
  })

  const handleProfileUpdate = () => {
    // Save profile changes
    console.log('Saving profile:', profile)
  }

  const handleBusinessUpdate = () => {
    // Save business changes
    console.log('Saving business:', business)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your profile and business information</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <Input
                    value={profile.full_name}
                    onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    License Number
                  </label>
                  <Input
                    value={profile.license_number}
                    onChange={(e) => setProfile(prev => ({ ...prev, license_number: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <Input
                    value={profile.phone}
                    onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brokerage Name
                </label>
                <Input
                  value={profile.brokerage_name}
                  onChange={(e) => setProfile(prev => ({ ...prev, brokerage_name: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <Textarea
                  value={profile.bio}
                  onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                  rows={3}
                  placeholder="Tell clients about your experience and approach..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specialties
                </label>
                <div className="flex flex-wrap gap-2">
                  {profile.specialties.map((specialty, index) => (
                    <Badge key={index} variant="secondary">
                      {specialty}
                    </Badge>
                  ))}
                </div>
                <Input
                  className="mt-2"
                  placeholder="Add specialty (press Enter)"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const value = e.currentTarget.value.trim()
                      if (value) {
                        setProfile(prev => ({
                          ...prev,
                          specialties: [...prev.specialties, value]
                        }))
                        e.currentTarget.value = ''
                      }
                    }
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Languages Spoken
                </label>
                <div className="flex flex-wrap gap-2">
                  {profile.languages.map((language, index) => (
                    <Badge key={index} variant="outline">
                      {language}
                    </Badge>
                  ))}
                </div>
              </div>

              <Button onClick={handleProfileUpdate}>
                Save Profile
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="business" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Business Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name
                  </label>
                  <Input
                    value={business.company_name}
                    onChange={(e) => setBusiness(prev => ({ ...prev, company_name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  <Input
                    type="url"
                    value={business.website}
                    onChange={(e) => setBusiness(prev => ({ ...prev, website: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Address
                </label>
                <Textarea
                  value={business.address}
                  onChange={(e) => setBusiness(prev => ({ ...prev, address: e.target.value }))}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Phone
                  </label>
                  <Input
                    value={business.phone}
                    onChange={(e) => setBusiness(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Email
                  </label>
                  <Input
                    type="email"
                    value={business.email}
                    onChange={(e) => setBusiness(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Areas
                </label>
                <div className="flex flex-wrap gap-2">
                  {business.service_areas.map((area, index) => (
                    <Badge key={index} variant="secondary">
                      {area}
                    </Badge>
                  ))}
                </div>
                <Input
                  className="mt-2"
                  placeholder="Add service area (press Enter)"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const value = e.currentTarget.value.trim()
                      if (value) {
                        setBusiness(prev => ({
                          ...prev,
                          service_areas: [...prev.service_areas, value]
                        }))
                        e.currentTarget.value = ''
                      }
                    }
                  }}
                />
              </div>

              <Button onClick={handleBusinessUpdate}>
                Save Business Info
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API Integrations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Mail className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">Email Service</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Connect your email service for automated communications
                  </p>
                  <Button variant="outline" size="sm">
                    Configure Email
                  </Button>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Phone className="h-5 w-5 text-green-600" />
                    <span className="font-medium">SMS Service</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Send text messages to leads and clients
                  </p>
                  <Button variant="outline" size="sm">
                    Configure SMS
                  </Button>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <MapPin className="h-5 w-5 text-red-600" />
                    <span className="font-medium">MLS Integration</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Import listings from MLS databases
                  </p>
                  <Button variant="outline" size="sm">
                    Configure MLS
                  </Button>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Globe className="h-5 w-5 text-purple-600" />
                    <span className="font-medium">CRM Integration</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Sync data with external CRM systems
                  </p>
                  <Button variant="outline" size="sm">
                    Configure CRM
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}