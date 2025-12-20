import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'
import { redis } from './lib/redis'

const intlMiddleware = createMiddleware(routing)

// Initialize Redis client for rate limiting
// Using shared client from lib/redis


// Security headers
const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-XSS-Protection': '1; mode=block',
  'Content-Security-Policy': 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self'; " +
    "connect-src 'self' ws: wss:; " +
    "frame-ancestors 'none';",
}

const RATE_LIMIT_WINDOW = 60 // 1 minute window
const RATE_LIMIT_MAX_REQUESTS = 3000 

const checkRateLimit = async (ip: string): Promise<boolean> => {
  try {
    const key = `rate_limit:${ip}`
    const current = await redis.incr(key)
    
    if (current === 1) {
      await redis.expire(key, RATE_LIMIT_WINDOW)
    }
    
    return current <= RATE_LIMIT_MAX_REQUESTS
  } catch (error) {
    console.error('Redis rate limit error:', error)
    return true // Fail open to not block users if Redis is down
  }
}

const getClientIP = (request: NextRequest): string => {
  const forwarded = request.headers.get('x-forwarded-for')
  const real = request.headers.get('x-real-ip')
  return forwarded?.split(',')[0] || real || 'unknown'
}

export async function middleware(request: NextRequest) {
  const clientIP = getClientIP(request)
  const pathname = request.nextUrl.pathname

  // Generate or retrieve Correlation ID
  const correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID()
  
  // Clone request headers to pass correlation ID downstream
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-correlation-id', correlationId)
  
  // ==========================================
  // 1. API Routes Handling (No localization)
  // ==========================================
  if (pathname.startsWith('/api/')) {
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
    
    // Set Correlation ID on response
    response.headers.set('X-Correlation-ID', correlationId)
    
    // Apply security headers
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    // Skip rate limiting for auth endpoints (handled internally)
    if (!pathname.startsWith('/api/auth/')) {
      const isAllowed = await checkRateLimit(clientIP)
      if (!isAllowed) {
        return new NextResponse(
          JSON.stringify({ error: 'Rate limit exceeded' }),
          { 
            status: 429, 
            headers: { 
              'Content-Type': 'application/json',
              ...securityHeaders
            }
          }
        )
      }
    }

    // API Authentication Check
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    
    // Allow public API routes
    const isApiAuthRoute = pathname.startsWith('/api/auth')
    const isHealthRoute = pathname === '/api/health'
    
    if (isApiAuthRoute || isHealthRoute) {
      return response
    }

    if (!token) {
      return new NextResponse(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...securityHeaders } }
      )
    }

    if (token.expired) {
      return new NextResponse(
        JSON.stringify({ error: 'Token expired' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...securityHeaders } }
      )
    }

    if (pathname.startsWith('/api/admin/') && token.role !== 'ADMIN') {
      return new NextResponse(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { 'Content-Type': 'application/json', ...securityHeaders } }
      )
    }

    return response
  }

  // ==========================================
  // 2. Page Routes Handling (With localization)
  // ==========================================

  // Explicitly redirect root to /en
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/en', request.url))
  }
  
  // Normalize path by removing locale prefix for security checks
  const publicPathname = pathname.replace(/^\/(en|zh)/, '') || '/'
  
  // Extract current locale for redirects
  const currentLocale = pathname.match(/^\/(en|zh)/)?.[1] || 'en'

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  
  const isAuthPage = publicPathname.startsWith('/auth') || publicPathname === '/login'
  const isPublicRoute = publicPathname.startsWith('/public') || publicPathname === '/favicon.ico'

  // If user is unauthenticated and trying to access protected page
  if (!token && !isAuthPage && !isPublicRoute) {
    const loginUrl = new URL(`/${currentLocale}/login`, request.url)
    loginUrl.searchParams.set('callbackUrl', request.nextUrl.href)
    return NextResponse.redirect(loginUrl)
  }

  // Role-based Access Control
  if (token) {
    if (publicPathname.startsWith('/tutor') && token.role !== 'TUTOR' && token.role !== 'ADMIN') {
      return NextResponse.redirect(new URL(`/${currentLocale}/unauthorized`, request.url))
    }
    
    if (publicPathname.startsWith('/student') && token.role !== 'STUDENT' && token.role !== 'ADMIN') {
      return NextResponse.redirect(new URL(`/${currentLocale}/unauthorized`, request.url))
    }
  }

  // Run next-intl middleware
  const response = intlMiddleware(request)

  // Set Correlation ID on response
  response.headers.set('X-Correlation-ID', correlationId)

  // Apply security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}