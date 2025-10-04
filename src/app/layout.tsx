import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from '../components/Providers'
import Navigation from '../components/Navigation'
import ErrorBoundary from '../components/ErrorBoundary'
import { ToastProvider } from '../components/Toast'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Tutoring Calendar',
  description:
    'A comprehensive tutoring calendar and appointment management system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          <ToastProvider>
            <Providers>
              <Navigation />
              {children}
            </Providers>
          </ToastProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
