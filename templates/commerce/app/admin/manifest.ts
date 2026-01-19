import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '709 Admin',
    short_name: '709 Admin',
    description: '709 Exclusive Admin Console',
    start_url: '/admin/messages',
    scope: '/admin/',
    display: 'standalone',
    background_color: '#0E0E0E',
    theme_color: '#0E0E0E',
    icons: [
      { src: '/admin/app-icon/192', sizes: '192x192', type: 'image/png' },
      { src: '/admin/app-icon/512', sizes: '512x512', type: 'image/png' },
      { src: '/admin/app-icon/512', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}

