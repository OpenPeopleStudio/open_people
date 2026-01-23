import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import { hasAdminAccess } from '../lib/roles'
import { extractDocumentTextFromImages } from '@/lib/googleVision'
import { getTenantFromRequest } from '../lib/tenant'

type ParsedRow = {
  brand: string
  model: string
  size: string
  condition: string
  price: string
  stock: string
  source?: string
  confidence?: number
}

const CONDITION_CODES = ['DS', 'VNDS', 'PADS', 'USED', 'BEATER']

function normalizePrice(value: string) {
  const numeric = parseFloat(value.replace(/[$,]/g, ''))
  if (Number.isNaN(numeric)) return ''
  return numeric.toFixed(2)
}

function extractCondition(line: string) {
  const upper = line.toUpperCase()
  return CONDITION_CODES.find((code) => new RegExp(`\\b${code}\\b`).test(upper)) || ''
}

function extractPrice(line: string) {
  const withDecimals = line.match(/\$?\d{2,5}(?:\.\d{2})/g)
  if (withDecimals?.length) {
    return normalizePrice(withDecimals[withDecimals.length - 1])
  }

  const numbers = line.match(/\b\d{2,5}\b/g) || []
  const candidates = numbers
    .map((value) => parseInt(value, 10))
    .filter((value) => value >= 20)

  if (!candidates.length) return ''

  const max = Math.max(...candidates)
  return normalizePrice(max.toString())
}

function extractStock(line: string) {
  const labelMatch = line.match(
    /(qty|quantity|stock|on hand|onhand)\s*[:\-]?\s*(\d+)/i
  )
  if (labelMatch?.[2]) return labelMatch[2]

  const xMatch = line.match(/\bx\s*(\d+)\b/i)
  if (xMatch?.[1]) return xMatch[1]

  return ''
}

function extractSize(line: string, price: string) {
  const labeled = line.match(/(?:size|sz)\s*[:\-]?\s*([0-9]{1,2}(?:\.\d)?(?:Y|W)?)/i)
  if (labeled?.[1]) return labeled[1].toUpperCase()

  const tokens = line.match(/\b[0-9]{1,2}(?:\.\d)?(?:Y|W)?\b/gi) || []
  const priceValue = price ? parseFloat(price) : null
  const candidates = tokens.filter((token) => {
    const numeric = parseFloat(token)
    if (Number.isNaN(numeric)) return false
    if (numeric > 20) return false
    if (priceValue && Math.abs(priceValue - numeric) < 0.01) return false
    return true
  })

  if (candidates.length) return candidates[0].toUpperCase()

  const wordTokens = line.match(/\b(?:XS|S|M|L|XL|XXL|OS)\b/gi) || []
  const wordToken = wordTokens[0]
  if (wordToken) return wordToken.toUpperCase()

  return ''
}

function isHeaderLine(line: string) {
  const upper = line.toUpperCase()
  return (
    (upper.includes('SIZE') ||
      upper.includes('PRICE') ||
      upper.includes('STOCK') ||
      upper.includes('QTY') ||
      upper.includes('CONDITION')) &&
    !/\$?\d/.test(line)
  )
}

function splitBrandModel(value: string) {
  const trimmed = value.trim()
  if (!trimmed) {
    return { brand: '', model: '' }
  }

  const separators = [' - ', ' | ', ' / ', ':']
  for (const separator of separators) {
    if (trimmed.includes(separator)) {
      const [brand, ...rest] = trimmed.split(separator)
      return { brand: brand.trim(), model: rest.join(separator).trim() }
    }
  }

  const parts = trimmed.split(' ')
  if (parts.length === 1) {
    return { brand: parts[0], model: '' }
  }

  return { brand: parts[0], model: parts.slice(1).join(' ') }
}

function extractBrandModel(line: string, fields: { price: string; size: string; condition: string; stock: string }) {
  let cleaned = line
  if (fields.price) {
    cleaned = cleaned.replace(fields.price, '')
  }
  if (fields.size) {
    cleaned = cleaned.replace(fields.size, '')
  }
  if (fields.condition) {
    cleaned = cleaned.replace(new RegExp(`\\b${fields.condition}\\b`, 'i'), '')
  }
  if (fields.stock) {
    cleaned = cleaned.replace(new RegExp(`\\b${fields.stock}\\b`, 'i'), '')
  }

  cleaned = cleaned
    .replace(/\b(qty|quantity|stock|on hand|onhand|size|sz|price)\b/gi, '')
    .replace(/[$]/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/[|/\\]+/g, ' ')
    .trim()

  if (!cleaned || !/[a-z]/i.test(cleaned)) {
    return ''
  }

  return cleaned
}

function parseOcrTextToRows(text: string, source?: string): ParsedRow[] {
  const rows: ParsedRow[] = []
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  let currentBrandModel = ''

  for (const line of lines) {
    if (isHeaderLine(line)) continue

    const condition = extractCondition(line)
    const price = extractPrice(line)
    const size = extractSize(line, price)
    const stock = extractStock(line)

    const fields = { price, size, condition, stock }
    const brandModel = extractBrandModel(line, fields)

    if (brandModel) {
      currentBrandModel = brandModel
    }

    const rowBrandModel = brandModel || currentBrandModel

    if (!rowBrandModel || (!price && !size && !stock && !condition)) {
      continue
    }

    const split = splitBrandModel(rowBrandModel)

    const confidence =
      (rowBrandModel ? 0.4 : 0) +
      (price ? 0.25 : 0) +
      (size ? 0.2 : 0) +
      (stock ? 0.1 : 0) +
      (condition ? 0.05 : 0)

    rows.push({
      brand: split.brand,
      model: split.model,
      size: size || '',
      condition: condition || '',
      price: price || '',
      stock: stock || '',
      source,
      confidence: Math.min(1, confidence),
    })
  }

  return rows
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServer()
  const tenant = await getTenantFromRequest(request)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .eq('tenant_id', tenant?.id)
    .single()

  if (!hasAdminAccess(profile?.role)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  try {
    const formData = await request.formData()
    const files = formData
      .getAll('files')
      .filter((entry): entry is File => entry instanceof File)

    if (!files.length) {
      return NextResponse.json({ error: 'No screenshots uploaded' }, { status: 400 })
    }

    if (files.length > 12) {
      return NextResponse.json({ error: 'Limit 12 screenshots per upload' }, { status: 400 })
    }

    const images = await Promise.all(
      files.map(async (file, index) => ({
        id: `image-${index}`,
        name: file.name || `screenshot-${index + 1}`,
        content: Buffer.from(await file.arrayBuffer()).toString('base64'),
      }))
    )

    const visionResults = await extractDocumentTextFromImages(images)

    const sources = visionResults.map((result) => ({
      name: result.name,
      text: result.text,
      error: result.error,
    }))

    const rows = visionResults.flatMap((result) =>
      parseOcrTextToRows(result.text, result.name)
    )

    return NextResponse.json({
      success: true,
      rows,
      sources,
    })
  } catch (error) {
    console.error('Screenshot OCR error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'OCR failed' },
      { status: 500 }
    )
  }
}
