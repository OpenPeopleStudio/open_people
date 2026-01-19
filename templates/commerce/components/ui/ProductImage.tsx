'use client'

import { useState } from 'react'
import Image from 'next/image'

interface ProductImageProps {
  src: string | null
  alt: string
  fill?: boolean
  width?: number
  height?: number
  className?: string
  sizes?: string
  priority?: boolean
}

/**
 * ProductImage with graceful fallback
 * 
 * MVP principle: Site must work if external images break.
 * This component:
 * - Renders the image if available
 * - Shows placeholder if no image
 * - Falls back to placeholder on load error
 */
export default function ProductImage({
  src,
  alt,
  fill = true,
  width,
  height,
  className = '',
  sizes = '(max-width: 768px) 50vw, 33vw',
  priority = false
}: ProductImageProps) {
  const [hasError, setHasError] = useState(false)

  if (!src || hasError) {
    return (
      <div className={`w-full h-full flex items-center justify-center bg-[var(--bg-secondary)] ${className}`}>
        <svg 
          viewBox="0 0 100 60" 
          className="w-1/2 h-auto text-[var(--text-muted)] opacity-30"
          fill="currentColor"
        >
          {/* Shoe silhouette placeholder */}
          <path d="M5 45 Q5 35 15 30 L25 28 Q35 25 45 25 L70 25 Q85 25 90 35 L95 45 Q95 50 90 52 L10 52 Q5 52 5 45 Z" />
          <ellipse cx="20" cy="48" rx="8" ry="4" opacity="0.3" />
          <ellipse cx="75" cy="48" rx="10" ry="5" opacity="0.3" />
        </svg>
      </div>
    )
  }

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className={className}
        sizes={sizes}
        priority={priority}
        unoptimized
        onError={() => setHasError(true)}
      />
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width || 300}
      height={height || 300}
      className={className}
      sizes={sizes}
      priority={priority}
      unoptimized
      onError={() => setHasError(true)}
    />
  )
}
