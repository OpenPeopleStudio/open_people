import { Hero } from '@/components/Hero'
import { FeaturedProperties } from '@/components/FeaturedProperties'
import { Services } from '@/components/Services'
import { About } from '@/components/About'
import { Contact } from '@/components/Contact'
import { Newsletter } from '@/components/Newsletter'
import { LeadCaptureForm } from '@/components/LeadCaptureForm'

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Hero />
      <FeaturedProperties />
      <Services />
      <About />
      <Contact />
      <LeadCaptureForm />
      <Newsletter />
    </main>
  )
}