'use client'

import { useState, useEffect } from 'react'
import type { 
  RestaurantSettings, 
  RestaurantFeatureFlags, 
  MenuCategory, 
  MenuItem,
  BusinessHours 
} from '@/types/tenant'

type Tab = 'general' | 'content' | 'menu' | 'hours' | 'reservations' | 'features' | 'social' | 'careers'

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('general')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  
  // General settings
  const [name, setName] = useState('')
  const [tagline, setTagline] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  
  // Theme colors
  const [bgColor, setBgColor] = useState('#f5f5f0')
  const [textColor, setTextColor] = useState('#1a1a1a')
  const [textSecondary, setTextSecondary] = useState('#666666')
  const [accentColor, setAccentColor] = useState('#1a1a1a')
  
  // Typography
  const [textTransform, setTextTransform] = useState<'lowercase' | 'none' | 'uppercase'>('lowercase')
  
  // Content
  const [heroHeadline, setHeroHeadline] = useState('')
  const [heroSubheadline, setHeroSubheadline] = useState('')
  const [aboutTitle, setAboutTitle] = useState('')
  const [aboutContent, setAboutContent] = useState('')
  const [philosophyEnabled, setPhilosophyEnabled] = useState(true)
  const [philosophyTitle, setPhilosophyTitle] = useState('')
  const [philosophyContent, setPhilosophyContent] = useState('')
  const [statusEnabled, setStatusEnabled] = useState(true)
  const [statusTitle, setStatusTitle] = useState('')
  const [statusContent, setStatusContent] = useState('')
  
  // Location
  const [addressLine1, setAddressLine1] = useState('')
  const [city, setCity] = useState('')
  const [region, setRegion] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [country, setCountry] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  
  // Hours
  const [hours, setHours] = useState<BusinessHours[]>([
    { day: 'monday', closed: true },
    { day: 'tuesday', closed: false, open: '17:00', close: '22:00' },
    { day: 'wednesday', closed: false, open: '17:00', close: '22:00' },
    { day: 'thursday', closed: false, open: '17:00', close: '22:00' },
    { day: 'friday', closed: false, open: '17:00', close: '23:00' },
    { day: 'saturday', closed: false, open: '17:00', close: '23:00' },
    { day: 'sunday', closed: false, open: '17:00', close: '21:00' },
  ])
  
  // Features
  const [features, setFeatures] = useState<RestaurantFeatureFlags>({
    reservations: false,
    newsletter: true,
    careers: true,
    events: false,
    menu_prices: true,
    gallery: false,
  })
  
  // Reservations
  const [resProvider, setResProvider] = useState<'internal' | 'external'>('internal')
  const [resExternalUrl, setResExternalUrl] = useState('')
  const [resMaxParty, setResMaxParty] = useState(10)
  const [resCancellationPolicy, setResCancellationPolicy] = useState('')
  
  // Social
  const [instagram, setInstagram] = useState('')
  const [facebook, setFacebook] = useState('')
  const [twitter, setTwitter] = useState('')
  const [yelp, setYelp] = useState('')
  
  // Menu
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([])
  const [menuShowPrices, setMenuShowPrices] = useState(true)
  const [menuCurrency, setMenuCurrency] = useState('$')
  const [menuDisclaimer, setMenuDisclaimer] = useState('')
  
  // Careers
  const [careersTitle, setCareersTitle] = useState('')
  const [careersDescription, setCareersDescription] = useState('')
  const [careersEmail, setCareersEmail] = useState('')

  // Newsletter
  const [newsletterTitle, setNewsletterTitle] = useState('updates')
  const [newsletterDescription, setNewsletterDescription] = useState('')
  const [newsletterSuccessMessage, setNewsletterSuccessMessage] = useState('')

  useEffect(() => {
    // Load settings from API
    fetch('/api/admin/settings')
      .then(res => res.json())
      .then(data => {
        if (data.settings) {
          const s = data.settings as RestaurantSettings
          // Populate state from settings
          setName(s.theme?.name || '')
          setTagline(s.theme?.tagline || '')
          setLogoUrl(s.theme?.logo_url || '')
          setBgColor(s.theme?.colors?.bg_primary || '#f5f5f0')
          setTextColor(s.theme?.colors?.text_primary || '#1a1a1a')
          setTextSecondary(s.theme?.colors?.text_secondary || '#666666')
          setAccentColor(s.theme?.colors?.accent || '#1a1a1a')
          setTextTransform(s.theme?.typography?.text_transform || 'lowercase')
          
          setHeroHeadline(s.content?.hero?.headline || '')
          setHeroSubheadline(s.content?.hero?.subheadline || '')
          setAboutTitle(s.content?.about?.title || '')
          setAboutContent(s.content?.about?.content || '')
          setPhilosophyEnabled(s.content?.philosophy?.enabled !== false)
          setPhilosophyTitle(s.content?.philosophy?.title || '')
          setPhilosophyContent(s.content?.philosophy?.content || '')
          setStatusEnabled(s.content?.status?.enabled !== false)
          setStatusTitle(s.content?.status?.title || '')
          setStatusContent(s.content?.status?.content || '')
          
          setAddressLine1(s.location?.address_line1 || '')
          setCity(s.location?.city || '')
          setRegion(s.location?.region || '')
          setPostalCode(s.location?.postal_code || '')
          setCountry(s.location?.country || '')
          setPhone(s.location?.phone || '')
          setEmail(s.location?.email || '')
          if (s.location?.hours) setHours(s.location.hours)
          
          setFeatures(s.features || {})
          
          if (s.reservations) {
            setResProvider(s.reservations.provider === 'internal' ? 'internal' : 'external')
            setResExternalUrl(s.reservations.external_url || '')
            setResMaxParty(s.reservations.max_party_size || 10)
            setResCancellationPolicy(s.reservations.cancellation_policy || '')
          }
          
          setInstagram(s.social?.instagram || '')
          setFacebook(s.social?.facebook || '')
          setTwitter(s.social?.twitter || '')
          setYelp(s.social?.yelp || '')
          
          if (s.menu) {
            setMenuCategories(s.menu.categories || [])
            setMenuShowPrices(s.menu.show_prices !== false)
            setMenuCurrency(s.menu.currency_symbol || '$')
            setMenuDisclaimer(s.menu.disclaimer || '')
          }
          
          setCareersTitle(s.careers?.title || '')
          setCareersDescription(s.careers?.description || '')
          setCareersEmail(s.careers?.application_email || '')
          
          setNewsletterTitle(s.newsletter?.title || 'updates')
          setNewsletterDescription(s.newsletter?.description || '')
          setNewsletterSuccessMessage(s.newsletter?.success_message || '')
        }
      })
      .catch(console.error)
  }, [])

  const saveSettings = async () => {
    setSaving(true)
    setMessage('')

    const settings: RestaurantSettings = {
      theme: {
        name,
        tagline,
        logo_url: logoUrl || null,
        colors: {
          bg_primary: bgColor,
          text_primary: textColor,
          text_secondary: textSecondary,
          accent: accentColor,
        },
        typography: {
          text_transform: textTransform,
        },
      },
      content: {
        hero: {
          headline: heroHeadline,
          subheadline: heroSubheadline,
        },
        about: {
          title: aboutTitle,
          content: aboutContent,
        },
        philosophy: {
          enabled: philosophyEnabled,
          title: philosophyTitle,
          content: philosophyContent,
        },
        status: {
          enabled: statusEnabled,
          title: statusTitle,
          content: statusContent,
        },
      },
      location: {
        address_line1: addressLine1,
        city,
        region,
        postal_code: postalCode,
        country,
        phone,
        email,
        hours,
      },
      features,
      reservations: features.reservations ? {
        enabled: true,
        provider: resProvider,
        external_url: resExternalUrl,
        max_party_size: resMaxParty,
        cancellation_policy: resCancellationPolicy,
      } : undefined,
      social: {
        instagram: instagram || undefined,
        facebook: facebook || undefined,
        twitter: twitter || undefined,
        yelp: yelp || undefined,
      },
      menu: {
        enabled: true,
        categories: menuCategories,
        show_prices: menuShowPrices,
        currency_symbol: menuCurrency,
        disclaimer: menuDisclaimer,
      },
      careers: features.careers ? {
        enabled: true,
        title: careersTitle,
        description: careersDescription,
        application_email: careersEmail,
      } : undefined,
      newsletter: features.newsletter ? {
        enabled: true,
        title: newsletterTitle,
        description: newsletterDescription,
        success_message: newsletterSuccessMessage,
        allow_message: true,
      } : undefined,
    }

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      })

      if (!res.ok) throw new Error('Failed to save')
      setMessage('settings saved successfully')
    } catch (error) {
      console.error(error)
      setMessage('failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'general', label: 'General' },
    { id: 'content', label: 'Content' },
    { id: 'menu', label: 'Menu' },
    { id: 'hours', label: 'Hours & Location' },
    { id: 'reservations', label: 'Reservations' },
    { id: 'features', label: 'Features' },
    { id: 'social', label: 'Social' },
    { id: 'careers', label: 'Careers' },
  ]

  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ marginBottom: '2rem' }}>Restaurant Settings</h1>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #ccc',
              borderRadius: '4px',
              background: activeTab === tab.id ? '#1a1a1a' : 'white',
              color: activeTab === tab.id ? 'white' : '#1a1a1a',
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ background: '#f9f9f9', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
        
        {activeTab === 'general' && (
          <div style={{ display: 'grid', gap: '1rem' }}>
            <h2>Brand & Theme</h2>
            <Field label="Restaurant Name" value={name} onChange={setName} />
            <Field label="Tagline" value={tagline} onChange={setTagline} placeholder="e.g., opening spring 2026" />
            <Field label="Logo URL" value={logoUrl} onChange={setLogoUrl} placeholder="https://..." />
            
            <h3 style={{ marginTop: '1rem' }}>Colors</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              <ColorField label="Background" value={bgColor} onChange={setBgColor} />
              <ColorField label="Primary Text" value={textColor} onChange={setTextColor} />
              <ColorField label="Secondary Text" value={textSecondary} onChange={setTextSecondary} />
              <ColorField label="Accent" value={accentColor} onChange={setAccentColor} />
            </div>
            
            <h3 style={{ marginTop: '1rem' }}>Typography</h3>
            <SelectField
              label="Text Transform"
              value={textTransform}
              onChange={(v) => setTextTransform(v as typeof textTransform)}
              options={[
                { value: 'lowercase', label: 'lowercase' },
                { value: 'none', label: 'Normal' },
                { value: 'uppercase', label: 'UPPERCASE' },
              ]}
            />
          </div>
        )}

        {activeTab === 'content' && (
          <div style={{ display: 'grid', gap: '1rem' }}>
            <h2>Hero Section</h2>
            <Field label="Headline" value={heroHeadline} onChange={setHeroHeadline} placeholder="Use <br> for line breaks" />
            <Field label="Subheadline" value={heroSubheadline} onChange={setHeroSubheadline} />
            
            <h2 style={{ marginTop: '1.5rem' }}>About Section</h2>
            <Field label="Title" value={aboutTitle} onChange={setAboutTitle} />
            <TextArea label="Content" value={aboutContent} onChange={setAboutContent} placeholder="Use <br> for line breaks" />
            
            <h2 style={{ marginTop: '1.5rem' }}>Philosophy Section</h2>
            <Checkbox label="Enable Philosophy Section" checked={philosophyEnabled} onChange={setPhilosophyEnabled} />
            {philosophyEnabled && (
              <>
                <Field label="Title" value={philosophyTitle} onChange={setPhilosophyTitle} />
                <TextArea label="Content" value={philosophyContent} onChange={setPhilosophyContent} />
              </>
            )}
            
            <h2 style={{ marginTop: '1.5rem' }}>Status Section</h2>
            <Checkbox label="Enable Status Section" checked={statusEnabled} onChange={setStatusEnabled} />
            {statusEnabled && (
              <>
                <Field label="Title" value={statusTitle} onChange={setStatusTitle} />
                <TextArea label="Content" value={statusContent} onChange={setStatusContent} />
              </>
            )}

            <h2 style={{ marginTop: '1.5rem' }}>Newsletter</h2>
            <Field label="Title" value={newsletterTitle} onChange={setNewsletterTitle} />
            <Field label="Description" value={newsletterDescription} onChange={setNewsletterDescription} />
            <Field label="Success Message" value={newsletterSuccessMessage} onChange={setNewsletterSuccessMessage} />
          </div>
        )}

        {activeTab === 'menu' && (
          <div style={{ display: 'grid', gap: '1rem' }}>
            <h2>Menu Settings</h2>
            <Checkbox label="Show Prices" checked={menuShowPrices} onChange={setMenuShowPrices} />
            <Field label="Currency Symbol" value={menuCurrency} onChange={setMenuCurrency} placeholder="$" />
            <Field label="Disclaimer" value={menuDisclaimer} onChange={setMenuDisclaimer} placeholder="Prices subject to change" />
            
            <h3 style={{ marginTop: '1rem' }}>Categories</h3>
            <p style={{ fontSize: '0.875rem', color: '#666' }}>
              Menu categories and items can be managed in the full admin dashboard.
            </p>
            <p style={{ fontSize: '0.875rem', color: '#666' }}>
              Current categories: {menuCategories.length}
            </p>
          </div>
        )}

        {activeTab === 'hours' && (
          <div style={{ display: 'grid', gap: '1rem' }}>
            <h2>Location</h2>
            <Field label="Address" value={addressLine1} onChange={setAddressLine1} />
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
              <Field label="City" value={city} onChange={setCity} />
              <Field label="Province/State" value={region} onChange={setRegion} />
              <Field label="Postal Code" value={postalCode} onChange={setPostalCode} />
            </div>
            <Field label="Country" value={country} onChange={setCountry} />
            <Field label="Phone" value={phone} onChange={setPhone} />
            <Field label="Email" value={email} onChange={setEmail} type="email" />
            
            <h2 style={{ marginTop: '1.5rem' }}>Business Hours</h2>
            {hours.map((h, i) => (
              <div key={h.day} style={{ display: 'grid', gridTemplateColumns: '100px 80px 100px 100px', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ textTransform: 'capitalize' }}>{h.day}</span>
                <Checkbox label="Closed" checked={h.closed || false} onChange={(v) => {
                  const newHours = [...hours]
                  newHours[i] = { ...newHours[i], closed: v }
                  setHours(newHours)
                }} />
                {!h.closed && (
                  <>
                    <input
                      type="time"
                      value={h.open || ''}
                      onChange={(e) => {
                        const newHours = [...hours]
                        newHours[i] = { ...newHours[i], open: e.target.value }
                        setHours(newHours)
                      }}
                      style={{ padding: '0.25rem' }}
                    />
                    <input
                      type="time"
                      value={h.close || ''}
                      onChange={(e) => {
                        const newHours = [...hours]
                        newHours[i] = { ...newHours[i], close: e.target.value }
                        setHours(newHours)
                      }}
                      style={{ padding: '0.25rem' }}
                    />
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'reservations' && (
          <div style={{ display: 'grid', gap: '1rem' }}>
            <h2>Reservations</h2>
            <Checkbox 
              label="Enable Reservations" 
              checked={features.reservations || false} 
              onChange={(v) => setFeatures({ ...features, reservations: v })} 
            />
            
            {features.reservations && (
              <>
                <SelectField
                  label="Provider"
                  value={resProvider}
                  onChange={(v) => setResProvider(v as typeof resProvider)}
                  options={[
                    { value: 'internal', label: 'Built-in Form' },
                    { value: 'external', label: 'External Link (OpenTable, Resy, etc.)' },
                  ]}
                />
                {resProvider === 'external' && (
                  <Field label="External Booking URL" value={resExternalUrl} onChange={setResExternalUrl} placeholder="https://..." />
                )}
                <Field 
                  label="Max Party Size" 
                  value={String(resMaxParty)} 
                  onChange={(v) => setResMaxParty(parseInt(v) || 10)} 
                  type="number" 
                />
                <TextArea label="Cancellation Policy" value={resCancellationPolicy} onChange={setResCancellationPolicy} />
              </>
            )}
          </div>
        )}

        {activeTab === 'features' && (
          <div style={{ display: 'grid', gap: '1rem' }}>
            <h2>Feature Toggles</h2>
            <Checkbox label="Reservations" checked={features.reservations || false} onChange={(v) => setFeatures({ ...features, reservations: v })} />
            <Checkbox label="Newsletter Signup" checked={features.newsletter !== false} onChange={(v) => setFeatures({ ...features, newsletter: v })} />
            <Checkbox label="Careers Page" checked={features.careers !== false} onChange={(v) => setFeatures({ ...features, careers: v })} />
            <Checkbox label="Events Section" checked={features.events || false} onChange={(v) => setFeatures({ ...features, events: v })} />
            <Checkbox label="Show Menu Prices" checked={features.menu_prices !== false} onChange={(v) => setFeatures({ ...features, menu_prices: v })} />
            <Checkbox label="Photo Gallery" checked={features.gallery || false} onChange={(v) => setFeatures({ ...features, gallery: v })} />
            <Checkbox label="Online Ordering" checked={features.online_ordering || false} onChange={(v) => setFeatures({ ...features, online_ordering: v })} />
            <Checkbox label="Gift Cards" checked={features.gift_cards || false} onChange={(v) => setFeatures({ ...features, gift_cards: v })} />
            <Checkbox label="Private Dining" checked={features.private_dining || false} onChange={(v) => setFeatures({ ...features, private_dining: v })} />
          </div>
        )}

        {activeTab === 'social' && (
          <div style={{ display: 'grid', gap: '1rem' }}>
            <h2>Social Media</h2>
            <Field label="Instagram" value={instagram} onChange={setInstagram} placeholder="https://instagram.com/..." />
            <Field label="Facebook" value={facebook} onChange={setFacebook} placeholder="https://facebook.com/..." />
            <Field label="X (Twitter)" value={twitter} onChange={setTwitter} placeholder="https://x.com/..." />
            <Field label="Yelp" value={yelp} onChange={setYelp} placeholder="https://yelp.com/..." />
          </div>
        )}

        {activeTab === 'careers' && (
          <div style={{ display: 'grid', gap: '1rem' }}>
            <h2>Careers Page</h2>
            <Field label="Page Title" value={careersTitle} onChange={setCareersTitle} placeholder="join our team" />
            <TextArea label="Description" value={careersDescription} onChange={setCareersDescription} />
            <Field label="Application Email" value={careersEmail} onChange={setCareersEmail} type="email" />
            <p style={{ fontSize: '0.875rem', color: '#666' }}>
              Job positions can be managed in the full admin dashboard.
            </p>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <button
          onClick={saveSettings}
          disabled={saving}
          style={{
            padding: '0.75rem 2rem',
            background: '#1a1a1a',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.5 : 1,
          }}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
        {message && <span style={{ color: message.includes('failed') ? 'red' : 'green' }}>{message}</span>}
      </div>
    </div>
  )
}

// Form Components
function Field({ label, value, onChange, placeholder, type = 'text' }: { 
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string 
}) {
  return (
    <div>
      <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
      />
    </div>
  )
}

function TextArea({ label, value, onChange, placeholder }: { 
  label: string; value: string; onChange: (v: string) => void; placeholder?: string 
}) {
  return (
    <div>
      <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px', resize: 'vertical' }}
      />
    </div>
  )
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  )
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>{label}</label>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: '40px', height: '32px', padding: 0, border: '1px solid #ccc', borderRadius: '4px' }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ flex: 1, padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
        />
      </div>
    </div>
  )
}

function SelectField({ label, value, onChange, options }: { 
  label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] 
}) {
  return (
    <div>
      <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}
