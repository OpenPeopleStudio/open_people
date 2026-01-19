import { getRestaurantSettings } from '@/lib/tenant'
import { Hero } from '@/components/Hero'
import { Section } from '@/components/Section'
import { Newsletter } from '@/components/Newsletter'
import { Footer } from '@/components/Footer'
import { SectionObserver } from '@/components/SectionObserver'

export default async function Home() {
  const tenant = await getRestaurantSettings()
  const settings = tenant?.settings
  const content = settings?.content
  const features = settings?.features

  return (
    <main>
      <SectionObserver />
      
      {/* Hero Section */}
      <Hero
        headline={content?.hero?.headline}
        subheadline={content?.hero?.subheadline}
        backgroundImage={content?.hero?.background_image}
        ctaPrimary={content?.hero?.cta_primary}
        ctaSecondary={content?.hero?.cta_secondary}
        showEvents={features?.events}
        showCareers={features?.careers}
      />

      {/* About Section */}
      {content?.about && (
        <>
          <Section
            title={content.about.title}
            content={content.about.content}
            layout={content.about.layout}
            imageUrl={content.about.image_url}
          />
          <div className="section-spacer" />
        </>
      )}

      {/* Philosophy Section */}
      {content?.philosophy?.enabled !== false && content?.philosophy && (
        <>
          <Section
            title={content.philosophy.title}
            content={content.philosophy.content}
          />
          <div className="section-spacer" />
        </>
      )}

      {/* Custom Sections */}
      {content?.custom_sections
        ?.filter(s => s.enabled !== false)
        .sort((a, b) => a.order - b.order)
        .map(section => (
          <div key={section.id}>
            <Section
              title={section.title}
              content={section.content}
            />
            <div className="section-spacer" />
          </div>
        ))}

      {/* Status Section */}
      {content?.status?.enabled !== false && content?.status?.content && (
        <>
          <Section
            title={content.status.title}
            content={content.status.content}
          />
          <div className="section-spacer" />
        </>
      )}

      {/* Newsletter Section */}
      {features?.newsletter !== false && settings?.newsletter?.enabled !== false && (
        <Newsletter
          title={settings?.newsletter?.title}
          description={settings?.newsletter?.description}
          successMessage={settings?.newsletter?.success_message}
          allowMessage={settings?.newsletter?.allow_message}
        />
      )}

      {/* Footer */}
      <Footer
        name={settings?.theme?.name}
        location={settings?.location}
        social={settings?.social}
        footerText={content?.footer_text}
      />
    </main>
  )
}
