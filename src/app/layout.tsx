import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from '../components/Providers'
import Navigation from '../components/Navigation'
import ErrorBoundary from '../components/ErrorBoundary'
import { ToastProvider } from '../components/Toast'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Tutoring Calendar - Efficient Scheduling Platform',
  description: 'Professional tutoring appointment scheduling and management system with real-time booking and optimized performance',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className={inter.className} suppressHydrationWarning={true}>
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
