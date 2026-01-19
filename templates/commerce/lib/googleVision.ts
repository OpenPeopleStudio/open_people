type VisionRequestImage = {
  id: string
  name: string
  content: string
}

type VisionTextResult = {
  id: string
  name: string
  text: string
  error?: string
}

function getVisionApiKey() {
  return process.env.GOOGLE_VISION_API_KEY || process.env.GOOGLE_IMAGE_API_KEY
}

export async function extractDocumentTextFromImages(
  images: VisionRequestImage[]
): Promise<VisionTextResult[]> {
  const apiKey = getVisionApiKey()

  if (!apiKey) {
    throw new Error(
      'Google Vision is not configured. Set GOOGLE_VISION_API_KEY in your environment variables.'
    )
  }

  if (images.length === 0) {
    return []
  }

  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: images.map((image) => ({
          image: { content: image.content },
          features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
          imageContext: { languageHints: ['en'] },
        })),
      }),
    }
  )

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    const message =
      payload?.error?.message || `Google Vision error (${response.status})`
    throw new Error(message)
  }

  const responses = Array.isArray(payload?.responses)
    ? payload.responses
    : []

  return images.map((image, index) => {
    const result = responses[index] || {}
    const text =
      result.fullTextAnnotation?.text ||
      result.textAnnotations?.[0]?.description ||
      ''

    return {
      id: image.id,
      name: image.name,
      text,
      error: result.error?.message,
    }
  })
}
