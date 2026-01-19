import { NextResponse } from 'next/server'

export async function GET() {
  const apiKey = process.env.GOOGLE_IMAGE_API_KEY
  const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID

  // Build the URL exactly as we would for a real search
  const url = new URL('https://www.googleapis.com/customsearch/v1')
  url.searchParams.set('key', apiKey || '')
  url.searchParams.set('cx', searchEngineId || '')
  url.searchParams.set('searchType', 'image')
  url.searchParams.set('q', 'Nike Air Force 1 sneaker')
  url.searchParams.set('num', '3')

  const diagnosticInfo = {
    hasApiKey: !!apiKey,
    hasSearchId: !!searchEngineId,
    apiKeyPrefix: apiKey?.substring(0, 10) + '...',
    searchEngineId: searchEngineId,
    requestUrl: url.toString().replace(apiKey || '', 'API_KEY_HIDDEN')
  }

  try {
    console.log('Testing Google API with:', diagnosticInfo)
    
    const res = await fetch(url.toString())
    const data = await res.json()

    if (!res.ok) {
      return NextResponse.json({
        success: false,
        status: res.status,
        error: data.error?.message || 'Unknown error',
        errorDetails: data.error,
        diagnostic: diagnosticInfo
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      imagesCount: data.items?.length || 0,
      sampleImage: data.items?.[0] ? {
        title: data.items[0].title,
        link: data.items[0].link,
        thumbnail: data.items[0].image?.thumbnailLink
      } : null,
      diagnostic: diagnosticInfo
    })

  } catch (error) {
    console.error('Google test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Test failed',
      diagnostic: diagnosticInfo
    }, { status: 500 })
  }
}