'use client'

type SectionProps = {
  id?: string
  title?: string
  content?: string
  layout?: 'text-only' | 'text-image' | 'image-text'
  imageUrl?: string
  className?: string
}

export function Section({
  id,
  title,
  content,
  layout = 'text-only',
  imageUrl,
  className = '',
}: SectionProps) {
  // Render content with basic HTML support
  const renderContent = (text?: string) => {
    if (!text) return null
    return <span dangerouslySetInnerHTML={{ __html: text }} />
  }

  if (layout === 'text-only' || !imageUrl) {
    return (
      <section id={id} className={`section ${className}`}>
        {title && <h2>{title}</h2>}
        {content && <p>{renderContent(content)}</p>}
      </section>
    )
  }

  // Layout with image
  return (
    <section
      id={id}
      className={`section section-with-image ${className}`}
      style={{
        display: 'grid',
        gridTemplateColumns: layout === 'text-image' ? '1fr 1fr' : '1fr 1fr',
        gap: 'var(--space-lg)',
        maxWidth: '1000px',
      }}
    >
      {layout === 'image-text' && (
        <div className="section-image">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: 'var(--radius-soft)',
            }}
          />
        </div>
      )}
      <div className="section-text">
        {title && <h2>{title}</h2>}
        {content && <p>{renderContent(content)}</p>}
      </div>
      {layout === 'text-image' && (
        <div className="section-image">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: 'var(--radius-soft)',
            }}
          />
        </div>
      )}
    </section>
  )
}
