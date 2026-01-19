'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Badge from './Badge'
import { useTenant } from '@/context/TenantContext'

export interface ProductCardData {
  id: string
  name: string
  brand: string
  slug: string
  lowest_price_cents: number
  primary_image: string | null
  is_drop?: boolean
  drop_ends_at?: string | null
  created_at?: string
  last_sold_cents?: number | null
  sizes_available?: string[]
  conditions_available?: string[]
}

interface ProductCardProps {
  product: ProductCardData
  currentTime?: number
  showWishlist?: boolean
  onWishlistClick?: (productId: string) => void
  isWishlisted?: boolean
  /** Compact mode hides secondary info like sizes/conditions */
  compact?: boolean
  /** Size variant for different contexts */
  size?: 'default' | 'small'
}

export default function ProductCard({ 
  product, 
  currentTime = Date.now(),
  showWishlist = true,
  onWishlistClick,
  isWishlisted = false,
  compact = false,
  size = 'default'
}: ProductCardProps) {
  const { settings } = useTenant()
  const [imageError, setImageError] = useState(false)
  const typography = settings?.theme?.typography?.product_card
  
  // Calculate badge states
  const isDropEnding = product.is_drop && product.drop_ends_at && 
    new Date(product.drop_ends_at).getTime() - currentTime < 24 * 60 * 60 * 1000
  
  const priceDropped = product.last_sold_cents && 
    product.lowest_price_cents < product.last_sold_cents
  
  const isNew = product.created_at && 
    new Date(product.created_at).getTime() > currentTime - 7 * 24 * 60 * 60 * 1000

  // Typography mappings
  const spacingMap = {
    compact: 'gap-1',
    default: 'gap-1.5',
    comfortable: 'gap-2',
    spacious: 'gap-3'
  }
  
  const brandSizeMap = {
    xs: 'text-[9px]',
    default: 'text-[10px]',
    sm: 'text-[11px]',
    md: 'text-xs'
  }
  
  const nameSizeMap = {
    xs: 'text-[10px] leading-[12px]',
    default: 'text-[11px] leading-[13px]',
    sm: 'text-xs leading-[14px]',
    md: 'text-[13px] leading-[15px]',
    lg: 'text-sm leading-4'
  }
  
  const priceSizeMap = {
    sm: 'text-sm',
    default: 'text-base',
    md: 'text-lg',
    lg: 'text-xl'
  }
  
  const fontFamilyMap = {
    default: 'font-sans',
    system: 'font-system',
    serif: 'font-serif',
    mono: 'font-mono'
  }
  
  const spacing = spacingMap[typography?.spacing as keyof typeof spacingMap] || spacingMap.default
  const brandSize = brandSizeMap[typography?.brand_size as keyof typeof brandSizeMap] || (size === 'small' ? brandSizeMap.xs : brandSizeMap.default)
  const nameSize = nameSizeMap[typography?.name_size as keyof typeof nameSizeMap] || (size === 'small' ? nameSizeMap.xs : nameSizeMap.default)
  const priceSize = priceSizeMap[typography?.price_size as keyof typeof priceSizeMap] || (size === 'small' ? priceSizeMap.sm : priceSizeMap.default)
  const fontFamily = fontFamilyMap[typography?.font_family as keyof typeof fontFamilyMap] || fontFamilyMap.default

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onWishlistClick?.(product.id)
  }

  return (
    <Link href={`/product/${product.slug}`} className="group block h-full flex flex-col">
      {/* Image Container - Graceful fallback if external images break */}
      <div className="relative aspect-square bg-[var(--bg-secondary)] rounded-xl md:rounded-2xl overflow-hidden mb-3 md:mb-5 border border-[var(--glass-border)] group-hover:border-[var(--border-glow)] transition-all duration-300 flex-shrink-0">
        {product.primary_image && !imageError ? (
          <Image
            src={product.primary_image}
            alt={product.name}
            fill
            className="object-cover transition-all duration-500 group-hover:scale-110"
            sizes={size === 'small' ? '(max-width: 768px) 40vw, 200px' : '(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw'}
            unoptimized
            onError={() => setImageError(true)}
          />
        ) : (
          /* Shoe silhouette placeholder - site works even if images break */
          <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)] bg-[var(--bg-tertiary)]">
            <svg 
              viewBox="0 0 100 60" 
              className="w-1/2 h-auto opacity-30"
              fill="currentColor"
            >
              <path d="M5 45 Q5 35 15 30 L25 28 Q35 25 45 25 L70 25 Q85 25 90 35 L95 45 Q95 50 90 52 L10 52 Q5 52 5 45 Z" />
              <ellipse cx="20" cy="48" rx="8" ry="4" opacity="0.3" />
              <ellipse cx="75" cy="48" rx="10" ry="5" opacity="0.3" />
            </svg>
          </div>
        )}
        
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Badges - Top Left */}
        <div className="absolute top-1.5 left-1.5 flex flex-col gap-1">
          {product.is_drop && (
            isDropEnding 
              ? <Badge variant="time">Ending Soon</Badge>
              : <Badge variant="primary">Drop</Badge>
          )}
          {priceDropped && <Badge variant="success">Price Drop</Badge>}
          {isNew && !product.is_drop && <Badge variant="info">New</Badge>}
        </div>

        {/* Wishlist Button - Top Right */}
        {showWishlist && (
          <button
            onClick={handleWishlistClick}
            className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-xl ${
              isWishlisted 
                ? 'bg-gradient-to-r from-[var(--neon-magenta)] to-[var(--neon-cyan)] opacity-100 shadow-[0_0_20px_rgba(255,0,255,0.5)]' 
                : 'bg-black/30 border border-white/20 opacity-0 group-hover:opacity-100'
            }`}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <svg 
              className="w-3.5 h-3.5 text-white" 
              fill={isWishlisted ? 'currentColor' : 'none'} 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
              />
            </svg>
          </button>
        )}
      </div>

      {/* Product Info */}
      <div className={`flex flex-col ${spacing} ${fontFamily} flex-shrink-0`}>
        {/* Brand */}
        <p className={`font-semibold uppercase tracking-wide text-[var(--text-muted)] ${brandSize} leading-tight truncate`}>
          {product.brand}
        </p>
        
        {/* Name - Clean 2-line with ellipsis */}
        <h3 className={`font-medium text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors line-clamp-2 ${nameSize}`}>
          {product.name}
        </h3>
        
        {/* Price */}
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`font-bold text-[var(--text-primary)] ${priceSize}`}>
            ${(product.lowest_price_cents / 100).toFixed(0)}
          </span>
          {/* Old Price (if applicable) */}
          {product.last_sold_cents && product.last_sold_cents !== product.lowest_price_cents && (
            <span className="text-xs text-[var(--text-muted)] line-through">
              ${(product.last_sold_cents / 100).toFixed(0)}
            </span>
          )}
        </div>

        {/* Secondary info - Only show on desktop in non-compact mode */}
        {!compact && product.sizes_available && product.sizes_available.length > 0 && (
          <p className="text-[10px] text-[var(--text-muted)] hidden md:block leading-tight mt-1">
            {product.sizes_available.length} sizes available
          </p>
        )}
      </div>
    </Link>
  )
}

// Skeleton loader for ProductCard
export function ProductCardSkeleton({ size = 'default' }: { size?: 'default' | 'small' }) {
  return (
    <div className="animate-pulse flex flex-col h-full">
      <div className="aspect-square bg-[var(--bg-secondary)] rounded-xl md:rounded-2xl mb-3 md:mb-5 border border-[var(--glass-border)] flex-shrink-0" />
      <div className="space-y-2 flex-shrink-0">
        <div className="bg-[var(--bg-secondary)] rounded h-2.5 w-1/3" />
        <div className="bg-[var(--bg-secondary)] rounded h-3.5 w-full" />
        <div className="bg-[var(--bg-secondary)] rounded h-3.5 w-2/3" />
        <div className="bg-[var(--bg-secondary)] rounded h-4 w-1/4 mt-1" />
      </div>
    </div>
  )
}
