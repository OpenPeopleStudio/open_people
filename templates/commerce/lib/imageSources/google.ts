export interface GoogleImageResult {
  imageUrl: string
  thumbnail: string
  width: number
  height: number
  sourcePage: string
}

export async function searchGoogleImages({
  brand,
  model,
  color,
  limit = 10
}: {
  brand: string
  model: string
  color?: string
  limit?: number
}): Promise<GoogleImageResult[]> {
  // Check for required environment variables
  const apiKey = process.env.GOOGLE_IMAGE_API_KEY
  const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID

  if (!apiKey || !searchEngineId) {
    throw new Error(
      'Google Image Search is not configured. Please add GOOGLE_IMAGE_API_KEY and GOOGLE_SEARCH_ENGINE_ID to your environment variables.'
    )
  }

  // Build search query with optional color
  const colorPart = color ? ` "${color}"` : ''
  const query = `"${brand} ${model}"${colorPart} product studio white background`

  const url = new URL('https://www.googleapis.com/customsearch/v1')
  url.searchParams.set('key', apiKey)
  url.searchParams.set('cx', searchEngineId)
  url.searchParams.set('searchType', 'image')
  url.searchParams.set('q', query)
  url.searchParams.set('imgType', 'photo')
  url.searchParams.set('imgSize', 'large')
  url.searchParams.set('safe', 'active')
  url.searchParams.set('num', limit.toString())

  const res = await fetch(url.toString())
  if (!res.ok) {
    const errorText = await res.text()
    let errorMessage = `Google API error (${res.status})`
    
    try {
      const errorJson = JSON.parse(errorText)
      if (errorJson.error?.message) {
        errorMessage = errorJson.error.message
        
        // Add helpful context for common errors
        if (errorMessage.includes('invalid argument')) {
          errorMessage += ' — Check that your GOOGLE_SEARCH_ENGINE_ID is correct and that "Image search" is enabled in your Programmable Search Engine settings.'
        }
      }
    } catch {
      // Use status-based message
      if (res.status === 403) {
        errorMessage = 'Google API access denied. Check your API key permissions or quota.'
      } else if (res.status === 400) {
        errorMessage = 'Invalid request. Verify your Search Engine ID and that image search is enabled.'
      } else if (res.status === 429) {
        errorMessage = 'Google API rate limit exceeded. Try again later.'
      }
    }
    
    throw new Error(errorMessage)
  }

  const json = await res.json()

  return (json.items || []).map((item: {
    link: string
    image: {
      thumbnailLink: string
      width: number
      height: number
      contextLink: string
    }
  }) => ({
    imageUrl: item.link,
    thumbnail: item.image.thumbnailLink,
    width: item.image.width,
    height: item.image.height,
    sourcePage: item.image.contextLink
  }))
}