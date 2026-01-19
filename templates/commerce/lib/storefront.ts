import type { TenantSettings } from '@/types/tenant'

/**
 * Default storefront terminology for generic commerce
 */
const DEFAULT_TERMS = {
  productSingular: 'product',
  productPlural: 'products',
  brand: 'brand',
  category: 'category',
}

/**
 * Get storefront terminology for a tenant
 * Falls back to generic terms if not configured
 */
export function getStorefrontTerms(settings?: TenantSettings) {
  const storefront = settings?.storefront
  
  return {
    productSingular: storefront?.product_term_singular || DEFAULT_TERMS.productSingular,
    productPlural: storefront?.product_term_plural || DEFAULT_TERMS.productPlural,
    brand: storefront?.brand_term || DEFAULT_TERMS.brand,
    category: storefront?.category_term || DEFAULT_TERMS.category,
  }
}

/**
 * Capitalize first letter of a string
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Get capitalized product term (singular)
 */
export function getProductTerm(settings?: TenantSettings, options?: { capitalize?: boolean }): string {
  const term = getStorefrontTerms(settings).productSingular
  return options?.capitalize ? capitalize(term) : term
}

/**
 * Get capitalized products term (plural)
 */
export function getProductsTerm(settings?: TenantSettings, options?: { capitalize?: boolean }): string {
  const term = getStorefrontTerms(settings).productPlural
  return options?.capitalize ? capitalize(term) : term
}

/**
 * Replace storefront placeholders in text
 * Placeholders: {{product}}, {{products}}, {{Product}}, {{Products}}, {{brand}}, {{Brand}}
 */
export function replaceStorefrontPlaceholders(text: string, settings?: TenantSettings): string {
  const terms = getStorefrontTerms(settings)
  
  return text
    .replace(/\{\{product\}\}/g, terms.productSingular)
    .replace(/\{\{products\}\}/g, terms.productPlural)
    .replace(/\{\{Product\}\}/g, capitalize(terms.productSingular))
    .replace(/\{\{Products\}\}/g, capitalize(terms.productPlural))
    .replace(/\{\{brand\}\}/g, terms.brand)
    .replace(/\{\{Brand\}\}/g, capitalize(terms.brand))
    .replace(/\{\{category\}\}/g, terms.category)
    .replace(/\{\{Category\}\}/g, capitalize(terms.category))
}
