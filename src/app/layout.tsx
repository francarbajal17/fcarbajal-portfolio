import type { Metadata } from 'next'
import { Cormorant_Garamond, DM_Sans } from 'next/font/google'
import './globals.css'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: 'Francisco Carbajal — Fotografía',
  description: 'Portfolio fotográfico de Francisco Carbajal. Paisaje, urbana y retrato desde Montevideo.',
  openGraph: {
    title: 'Francisco Carbajal — Fotografía',
    description: 'Portfolio fotográfico. Paisaje, urbana y retrato desde Montevideo.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${cormorant.variable} ${dmSans.variable}`}>
      <body>{children}</body>
    </html>
  )
}
