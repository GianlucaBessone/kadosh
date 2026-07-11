import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'KADOSH',
    short_name: 'KADOSH',
    description: 'Administrá con sabiduría. Aplicación de finanzas personales basada en principios bíblicos.',
    start_url: '/home',
    display: 'standalone',
    background_color: '#FAF9F7',
    theme_color: '#FAF9F7',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
      // You should add 192x192 and 512x512 icons in the public folder.
    ],
  }
}
