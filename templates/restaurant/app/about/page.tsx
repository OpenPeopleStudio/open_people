import { getRestaurantSettings } from '@/lib/tenant'
import { Section } from '@/components/Section'
import { Footer } from '@/components/Footer'
import Link from 'next/link'

export const metadata = {
  title: 'About',
}

export default async function AboutPage() {
  const tenant = await getRestaurantSettings()
  const settings = tenant?.settings
  const content = settings?.content

  return (
    <main>
      <header className="hero" style={{ minHeight: '40vh' }}>
        <nav className="site-nav">
          <Link href="/">home</Link>
          <Link href="/menu">menu</Link>
        </nav>
        <div className="hero-content">
          <h1>about</h1>
        </div>
      </header>

      {/* About Section */}
      {content?.about && (
        <Section
          title={content.about.title}
          content={content.about.content}
          layout={content.about.layout}
          imageUrl={content.about.image_url}
        />
      )}

      {/* Philosophy Section */}
      {content?.philosophy?.enabled !== false && content?.philosophy?.content && (
        <>
          <div className="section-spacer" />
          <Section
            title={content.philosophy.title}
            content={content.philosophy.content}
          />
        </>
      )}

      {/* Team Section - placeholder for future expansion */}
      {/* 
      <div className="section-spacer" />
      <section className="section">
        <h2>the team</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)' }}>
          {settings?.team?.members?.map(member => (
            <div key={member.id}>
              <img src={member.photo_url} alt={member.name} />
              <h3>{member.name}</h3>
              <p>{member.role}</p>
            </div>
          ))}
        </div>
      </section>
      */}

      <Footer
        name={settings?.theme?.name}
        location={settings?.location}
        social={settings?.social}
        footerText={content?.footer_text}
      />
    </main>
  )
}
