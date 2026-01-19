import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '709 Support',
    short_name: 'Support',
    description: 'Chat with 709 Exclusive support',
    start_url: '/account/messages',
    scope: '/account/',
    display: 'standalone',
    background_color: '#0E0E0E',
    theme_color: '#0E0E0E',
    icons: [
      { src: '/account/app-icon/192', sizes: '192x192', type: 'image/png' },
      { src: '/account/app-icon/512', sizes: '512x512', type: 'image/png' },
      { src: '/account/app-icon/512', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
