import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import SessionProviderWrapper from '../../components/SessionProviderWrapper'
import { AuthProvider } from '../../contexts/AuthContext'
import { ClientThemeProvider } from '../../components/ClientThemeProvider'
import Navigation from '../../components/Navigation'
import ErrorBoundary from '../../components/ErrorBoundary'
import { ToastProvider } from '../../components/Toast'
import '../globals.css'
import { routing } from '../../i18n/routing';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Tutoring Calendar - Efficient Scheduling Platform',
  description: 'Professional tutoring appointment scheduling and management system with real-time booking and optimized performance',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages({ locale });

  return (
    <html lang={locale}>
      <body className={inter.className}>
        <NextIntlClientProvider messages={messages} locale={locale}>
          <SessionProviderWrapper>
            <AuthProvider>
              <ClientThemeProvider>
                <ErrorBoundary>
                  <ToastProvider>
                    <Navigation />
                    {children}
                  </ToastProvider>
                </ErrorBoundary>
              </ClientThemeProvider>
            </AuthProvider>
          </SessionProviderWrapper>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
