import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import OpenAI from 'openai'
import { searchGoogleImages, type GoogleImageResult } from '@/lib/imageSources/google'

function normalizeOpenAIKey(raw?: string) {
  const trimmed = (raw ?? '').trim()
  if (!trimmed) return ''
  // Common mistake: putting the key in quotes in .env.local
  return trimmed.replace(/^['"]|['"]$/g, '')
}

function getOpenAIClient() {
  const apiKey = normalizeOpenAIKey(process.env.OPENAI_API_KEY)
  if (!apiKey) {
    throw new Error(
      'OPENAI_API_KEY is missing (or empty). Add it to `.env.local` without quotes and restart `npm run dev`.'
    )
  }
  return new OpenAI({ apiKey })
}

// Model configuration - change here for different speed/accuracy tradeoffs
const VISION_MODEL = process.env.OPENAI_VISION_MODEL || 'gpt-4o-mini' // Options: 'gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo'
const PRICING_MODEL = process.env.OPENAI_PRICING_MODEL || 'gpt-4o-mini'

interface ProductRecognitionResult {
  brand?: string
  model?: string
  colorway?: string
  style_code?: string
  year?: number
  category?: string
  confidence: number
  description?: string
}

interface PriceData {
  source: string
  price_usd?: number
  price_cad?: number
  condition: string
  url: string
  last_updated: string
}

interface ProductIntelligence {
  product: ProductRecognitionResult
  market_prices: PriceData[]
  stock_images?: GoogleImageResult[]
  suggested_price_cad: number
  price_range: { min: number; max: number }
  avg_price: number
  trending: 'up' | 'down' | 'stable'
  demand_score: number // 0-100
}

function extractJsonFromText(text: string): any {
  const trimmed = text.trim()
  if (!trimmed) return null
  try {
    return JSON.parse(trimmed)
  } catch {
    // Try to extract the first JSON object/array from mixed text
    const firstObj = trimmed.indexOf('{')
    const firstArr = trimmed.indexOf('[')
    const start =
      firstObj === -1 ? firstArr : firstArr === -1 ? firstObj : Math.min(firstObj, firstArr)
    if (start === -1) return null
    const slice = trimmed.slice(start)
    // Heuristic: find last closing brace/bracket
    const lastObj = slice.lastIndexOf('}')
    const lastArr = slice.lastIndexOf(']')
    const end = Math.max(lastObj, lastArr)
    if (end === -1) return null
    const candidate = slice.slice(0, end + 1)
    try {
      return JSON.parse(candidate)
    } catch {
      return null
    }
  }
}

/**
 * AI Product Recognition using OpenAI Vision
 * Identifies products from uploaded images
 */
async function recognizeProductFromImage(imageUrl: string): Promise<ProductRecognitionResult> {
  try {
    const apiKey = normalizeOpenAIKey(process.env.OPENAI_API_KEY)
    if (!apiKey) {
      console.error('OPENAI_API_KEY is not set (or is empty/quoted)')
      return { confidence: 0 }
    }

    const openai = getOpenAIClient()
    
    const response = await openai.chat.completions.create({
      model: VISION_MODEL, // Configurable vision model
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this product image and extract:
- Brand (Nike, Adidas, Jordan, Yeezy, New Balance, etc.)
- Model name (full name)
- Colorway (if visible)
- Style code / SKU (look for tags, boxes, labels)
- Year/release year (if identifiable)
- Category (sneakers, apparel, accessories)
- Brief description

Return as JSON with keys: brand, model, colorway, style_code, year, category, description.
Be specific and accurate. If unsure, indicate low confidence.`,
            },
            {
              type: 'image_url',
              image_url: { url: imageUrl },
            },
          ],
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 500,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      console.error('No content in OpenAI response')
      return { confidence: 0 }
    }

    const parsed = JSON.parse(content)
    
    return {
      brand: parsed.brand || '',
      model: parsed.model || '',
      colorway: parsed.colorway,
      style_code: parsed.style_code,
      year: parsed.year ? parseInt(parsed.year) : undefined,
      category: parsed.category || 'sneakers',
      confidence: 0.9, // OpenAI Vision is highly accurate
      description: parsed.description || '',
    }
  } catch (error) {
    console.error('Product recognition error:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    return { confidence: 0 }
  }
}

/**
 * Fetch competitive pricing using OpenAI web search
 * Queries multiple marketplaces and aggregates results
 */
async function fetchMarketPrices(
  brand: string,
  model: string,
  styleCode?: string,
  condition?: string
): Promise<PriceData[]> {
  try {
    const apiKey = normalizeOpenAIKey(process.env.OPENAI_API_KEY)
    if (!apiKey) {
      console.error('OPENAI_API_KEY is not set (or is empty/quoted) - skipping market pricing')
      return []
    }

    const openai = getOpenAIClient()
    const query = styleCode 
      ? `${brand} ${model} ${styleCode}` 
      : `${brand} ${model}`
    
    const searchQuery = `Search current resale market prices for "${query}" in ${condition || 'new'} condition. 
Find prices from:
- StockX
- GOAT
- eBay sold listings
- Grailed
- Stadium Goods
- Flight Club

For each source, provide:
- source name
- price in USD
- condition
- URL (if available)
- how recent (today, this week, etc)

Return ONLY valid JSON in this exact shape:
{
  "prices": [
    { "source": "StockX", "price_usd": 123, "condition": "New", "url": "https://...", "recency": "today" }
  ]
}
Find at least 5-10 prices if possible.`

    // Preferred: Responses API with web search tool (real-time)
    let parsed: any = null
    try {
      const resp = await openai.responses.create({
        model: PRICING_MODEL,
        tools: [{ type: 'web_search_preview', search_context_size: 'low' }],
        input: searchQuery,
      })
      parsed = extractJsonFromText((resp as any).output_text || '')
    } catch (e) {
      // Fallback: no web tool available; try normal completion (may be stale)
      const fallback = await openai.chat.completions.create({
        model: PRICING_MODEL,
        messages: [
          {
            role: 'system',
            content:
              'You are a sneaker/streetwear market research assistant. If you cannot browse, respond with best-effort estimates and set url="" and recency="unknown".',
          },
          { role: 'user', content: searchQuery },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 2000,
      })
      parsed = extractJsonFromText(fallback.choices[0]?.message?.content || '')
    }

    const pricesRaw = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.prices)
        ? parsed.prices
        : []
    
    // Convert to PriceData format
    return pricesRaw.map((p: any) => ({
      source: p.source || 'Unknown',
      price_usd: parseFloat(p.price_usd) || 0,
      price_cad: p.price_usd ? parseFloat(p.price_usd) * 1.35 : 0, // Convert to CAD
      condition: p.condition || condition || 'New',
      url: p.url || '',
      last_updated: p.recency?.includes('today') 
        ? new Date().toISOString()
        : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // Assume within last week
    }))
  } catch (error) {
    console.error('Market price fetch error:', error)
    return []
  }
}

/**
 * Calculate suggested pricing based on market data
 */
function calculateSuggestedPrice(
  prices: PriceData[],
  condition: string
): { suggested: number; range: { min: number; max: number }; avg: number } {
  if (prices.length === 0) {
    return { suggested: 0, range: { min: 0, max: 0 }, avg: 0 }
  }
  
  // Convert to CAD (assume 1.35 exchange rate)
  const cadPrices = prices.map(p => (p.price_cad || (p.price_usd || 0) * 1.35))
  
  // Filter by similar condition
  const conditionMap: Record<string, string[]> = {
    'DS': ['New', 'Brand New', 'DS', 'BNIB'],
    'VNDS': ['Near New', 'VNDS', 'Excellent'],
    '8/10': ['Very Good', 'Good', 'Used'],
    '6/10': ['Fair', 'Acceptable'],
  }
  
  const similarConditions = conditionMap[condition] || []
  const relevantPrices = prices
    .filter(p => similarConditions.some(c => p.condition.includes(c)))
    .map(p => p.price_cad || (p.price_usd || 0) * 1.35)
  
  const pricesForCalc = relevantPrices.length > 0 ? relevantPrices : cadPrices
  
  const avg = pricesForCalc.reduce((sum, p) => sum + p, 0) / pricesForCalc.length
  const min = Math.min(...pricesForCalc)
  const max = Math.max(...pricesForCalc)
  
  // Suggest slightly below average for competitive pricing
  const suggested = Math.round(avg * 0.95)
  
  return {
    suggested,
    range: { min: Math.round(min), max: Math.round(max) },
    avg: Math.round(avg),
  }
}

/**
 * Main API endpoint for product intelligence
 */
export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.error('Intelligence API: No user authenticated')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('709_profiles')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single()

    if (!profile || !['staff', 'admin', 'owner'].includes(profile.role)) {
      console.error('Intelligence API: User not authorized, role:', profile?.role)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { imageUrl, brand, model, styleCode, condition } = await request.json()
    console.log('Intelligence API called with:', { imageUrl: imageUrl ? 'provided' : 'none', brand, model, styleCode, condition })

    let productData: ProductRecognitionResult = { confidence: 0 }

    // Step 1: Recognize product from image (if provided)
    if (imageUrl) {
      productData = await recognizeProductFromImage(imageUrl)
    } else if (brand && model) {
      // Use provided data
      productData = {
        brand,
        model,
        style_code: styleCode,
        confidence: 1.0,
      }
    } else {
      return NextResponse.json(
        { error: 'Provide either imageUrl or brand+model' },
        { status: 400 }
      )
    }

    // Step 2: Fetch market prices
    const marketPrices = await fetchMarketPrices(
      productData.brand || brand || '',
      productData.model || model || '',
      productData.style_code || styleCode,
      condition || 'DS'
    )

    // Step 2b: Fetch stock images (optional; requires Google env vars)
    let stockImages: GoogleImageResult[] = []
    try {
      if (productData.brand && productData.model) {
        stockImages = await searchGoogleImages({
          brand: productData.brand,
          model: productData.model,
          color: productData.colorway,
          limit: 12,
        })
      }
    } catch (e) {
      // If Google search isn't configured, try OpenAI web search as a fallback.
      try {
        const openai = getOpenAIClient()
        const q = `${productData.brand || ''} ${productData.model || ''} ${productData.style_code || ''}`.trim()
        const prompt = `Find high-quality studio product photos (white/clean background) for: "${q}".\n\nReturn ONLY JSON in this shape:\n{\n  \"images\": [\n    {\"imageUrl\": \"https://...\", \"sourcePage\": \"https://...\"}\n  ]\n}\nPrefer official brand/retailer images when possible. Return 6-10 results.`
        const resp = await openai.responses.create({
          model: PRICING_MODEL,
          tools: [{ type: 'web_search_preview', search_context_size: 'low' }],
          input: prompt,
        })
        const parsed = extractJsonFromText((resp as any).output_text || '')
        const imgs = Array.isArray(parsed?.images) ? parsed.images : []
        stockImages = imgs
          .filter((x: any) => typeof x?.imageUrl === 'string')
          .slice(0, 10)
          .map((x: any) => ({
            imageUrl: x.imageUrl,
            thumbnail: x.imageUrl,
            width: 0,
            height: 0,
            sourcePage: x.sourcePage || '',
          }))
      } catch {
        stockImages = []
      }
    }

    // Step 3: Calculate suggested pricing
    const pricing = calculateSuggestedPrice(
      marketPrices,
      condition || 'DS'
    )

    // Step 4: Calculate demand score (based on price volatility and listing count)
    const demandScore = marketPrices.length > 5 ? 75 : marketPrices.length * 10

    // Step 5: Detect trend (prices increasing/decreasing)
    const recentPrices = marketPrices
      .sort((a, b) => new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime())
      .slice(0, 5)
      .map(p => p.price_usd || 0)
    
    let trending: 'up' | 'down' | 'stable' = 'stable'
    if (recentPrices.length >= 3) {
      const recent = recentPrices[0]
      const older = recentPrices[recentPrices.length - 1]
      if (recent > older * 1.1) trending = 'up'
      else if (recent < older * 0.9) trending = 'down'
    }

    const intelligence: ProductIntelligence = {
      product: productData,
      market_prices: marketPrices.slice(0, 10), // Top 10 most relevant
      stock_images: stockImages,
      suggested_price_cad: pricing.suggested,
      price_range: pricing.range,
      avg_price: pricing.avg,
      trending,
      demand_score: demandScore,
    }

    return NextResponse.json({ intelligence })
  } catch (error) {
    console.error('Product intelligence error:', error)
    const status = (error as any)?.status
    if (status === 401) {
      return NextResponse.json(
        {
          error:
            'OpenAI authentication failed (401). Double-check `OPENAI_API_KEY` (no quotes, no whitespace) and restart the dev server.',
        },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to fetch product intelligence' },
      { status: 500 }
    )
  }
}
