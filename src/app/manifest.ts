import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'KADOSH',
    short_name: 'KADOSH',
    description: 'Administrá con sabiduría. Aplicación de finanzas personales basada en principios bíblicos.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FAF9F7',
    theme_color: '#FAF9F7',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      }
    ],
  }
}