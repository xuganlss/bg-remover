import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Free Image Background Remover - Remove Background Online | AI Powered',
  description: 'Remove background from any image in seconds. Free online AI background remover — no signup required. Perfect for product photos, portraits, and more.',
  keywords: 'image background remover, remove background from image, free background remover, AI background remover, remove white background, transparent background',
  openGraph: {
    title: 'Free Image Background Remover — Instant & AI Powered',
    description: 'Remove image backgrounds in seconds for free. Upload any photo and get a clean transparent PNG instantly.',
    type: 'website',
    url: 'https://img-bgremove.susanliu.site',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Free Image Background Remover',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Image Background Remover',
    description: 'Remove image backgrounds instantly with AI — free, no signup.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>{children}</body>
    </html>
  )
}
