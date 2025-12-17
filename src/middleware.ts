import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

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

// Rate limiting for API routes
const requestCounts = new Map<string, { count: number; timestamp: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 300 // Increased limit for dev/demo

const checkRateLimit = (ip: string): boolean => {
  const now = Date.now()
  const record = requestCounts.get(ip)
  
  if (!record) {
    requestCounts.set(ip, { count: 1, timestamp: now })
    return true
  }
  
  if (now - record.timestamp > RATE_LIMIT_WINDOW) {
    requestCounts.set(ip, { count: 1, timestamp: now })
    return true
  }
  
  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false
  }
  
  record.count++
  return true
}

const getClientIP = (request: NextRequest): string => {
  const forwarded = request.headers.get('x-forwarded-for')
  const real = request.headers.get('x-real-ip')
  return forwarded?.split(',')[0] || real || 'unknown'
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Apply security headers to all responses
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  const clientIP = getClientIP(request)
  const pathname = request.nextUrl.pathname
  
  // Rate limiting for API routes
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')) {
    if (!checkRateLimit(clientIP)) {
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
  
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  const isAuthPage = pathname.startsWith('/auth') || pathname === '/login'
  const isApiAuthRoute = pathname.startsWith('/api/auth')
  const isHealthRoute = pathname === '/api/health'
  const isPublicRoute = pathname.startsWith('/public') || pathname === '/favicon.ico'

  // Allow public routes
  if (isAuthPage || isApiAuthRoute || isHealthRoute || isPublicRoute) {
    return response
  }

  // Protect API routes that require authentication
  if (pathname.startsWith('/api/')) {
    if (!token) {
      return new NextResponse(
        JSON.stringify({ error: 'Authentication required' }),
        { 
          status: 401,
          headers: { 
            'Content-Type': 'application/json',
            ...securityHeaders
          }
        }
      )
    }
    
    // Check token validity
    if (token.expired) {
      return new NextResponse(
        JSON.stringify({ error: 'Token expired' }),
        { 
          status: 401,
          headers: { 
            'Content-Type': 'application/json',
            ...securityHeaders
          }
        }
      )
    }
    
    // Role-based API access control
    if (pathname.startsWith('/api/admin/') && token.role !== 'ADMIN') {
      return new NextResponse(
        JSON.stringify({ error: 'Admin access required' }),
        { 
          status: 403,
          headers: { 
            'Content-Type': 'application/json',
            ...securityHeaders
          }
        }
      )
    }
    
    return response
  }

  // Redirect unauthenticated users to login for protected pages
  if (!token && !isAuthPage) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', request.nextUrl.href)
    return NextResponse.redirect(loginUrl)
  }

  // Role-based page access control
  if (token) {
    // For now, only check tutor and student specific routes
    // Admin routes can be added when admin pages are created
    
    if (pathname.startsWith('/tutor') && token.role !== 'TUTOR' && token.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
    
    if (pathname.startsWith('/student') && token.role !== 'STUDENT' && token.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
