import type { Metadata } from 'next'
import { Heebo } from 'next/font/google'
import './globals.css'

const heebo = Heebo({
  subsets: ['latin', 'hebrew'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-heebo',
})

export const metadata: Metadata = {
  title: 'PBL Question Lab',
  description: 'הופכים נושא לימודי לשאלת PBL שאי אפשר לפתור עם ChatGPT.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="he" dir="rtl" className={heebo.variable}>
      <body className={`${heebo.className} bg-slate-950 text-white antialiased`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:right-4 focus:z-50 focus:px-4 focus:py-2 focus:rounded-lg focus:bg-violet-600 focus:text-white focus:text-sm"
        >
          דלג לתוכן הראשי
        </a>
        {children}
      </body>
    </html>
  )
}
