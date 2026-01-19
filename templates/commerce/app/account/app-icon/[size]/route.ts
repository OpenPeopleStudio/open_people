import React from 'react'
import { ImageResponse } from 'next/og'
import type { NextRequest } from 'next/server'

export const runtime = 'edge'

function asSize(sizeParam: string | undefined) {
  const size = Number(sizeParam)
  if (size === 192 || size === 512) return size
  return 512
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ size: string }> }
) {
  const { size: sizeParam } = await params
  const size = asSize(sizeParam)

  const image = new ImageResponse(
    React.createElement(
      'div',
      {
        style: {
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0E0E0E',
        },
      },
      React.createElement(
        'div',
        {
          style: {
            width: Math.round(size * 0.82),
            height: Math.round(size * 0.82),
            borderRadius: Math.round(size * 0.18),
            background: '#171717',
            border: '1px solid #2A2A2A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          },
        },
        React.createElement(
          'div',
          {
            style: {
              fontSize: Math.round(size * 0.32),
              fontWeight: 900,
              letterSpacing: '-0.08em',
              color: '#F2F2F2',
              display: 'flex',
              alignItems: 'baseline',
              gap: Math.round(size * 0.02),
            },
          },
          React.createElement('span', null, '709'),
          React.createElement(
            'span',
            {
              style: {
                color: '#E10600',
                fontSize: Math.round(size * 0.16),
                fontWeight: 800,
                letterSpacing: '-0.02em',
              },
            },
            'SUPPORT'
          )
        )
      )
    ),
    { width: size, height: size }
  )

  image.headers.set('Cache-Control', 'public, max-age=604800, immutable')
  return image
}
