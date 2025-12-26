import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

// Create next-intl middleware
const intlMiddleware = createMiddleware(routing)

// Security headers
const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-XSS-Protection': '1; mode=block',
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Skip proxy for static files and API routes - let them pass through
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname.includes('.') // static files like favicon.ico, images, etc.
  ) {
    const response = NextResponse.next()
    // Add security headers to all responses
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
    return response
  }

  // Explicitly redirect root to /en
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/en', request.url))
  }

  // Run next-intl middleware for page routes
  const response = intlMiddleware(request)

  // Add security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  return response
}

export const config = {
  matcher: [
    // Match all paths except static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}