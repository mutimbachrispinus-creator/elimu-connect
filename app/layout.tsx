import type { Metadata } from 'next'
import { Playfair_Display, DM_Sans } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/context/AuthContext'
import './globals.css'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  title: { default: 'ElimuConnect – Kenya\'s Premier Learning Hub', template: '%s | ElimuConnect' },
  description: 'Connect with qualified tutors across all Kenyan and international curricula. Live classes, paid video courses, and a rich resource library — all in one platform.',
  keywords: ['Kenya education', 'online tutoring', 'CBC', 'Cambridge', 'IB', 'Montessori', 'e-learning Kenya'],
  authors: [{ name: 'ElimuConnect' }],
  openGraph: {
    title: 'ElimuConnect – Connecting Learners to Excellence',
    description: 'Kenya\'s leading tutoring and e-learning platform',
    url: 'https://elimuconnect.co.ke',
    siteName: 'ElimuConnect',
    locale: 'en_KE',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable}`}>
      <body className="font-body bg-white text-gray-900 antialiased">
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              className: '',
              style: { borderRadius: '10px', background: '#fff', color: '#1a1a1a', boxShadow: '0 4px 24px rgba(0,0,0,.1)' },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  )
}
