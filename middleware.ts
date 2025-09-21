import { NextRequest, NextResponse } from 'next/server'
import { logger } from './lib/utils/logger'

// Rate limiting store (in production, use Redis)
const rateLimit = new Map<string, { count: number; resetTime: number }>()

function getRateLimitKey(req: NextRequest): string {
  // In production, use proper client IP detection
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : req.ip || 'unknown'
  return ip
}

function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const record = rateLimit.get(key)

  if (!record || now > record.resetTime) {
    rateLimit.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (record.count >= limit) {
    return false
  }

  record.count++
  return true
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const correlationId = request.headers.get('x-correlation-id') || 
    `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  // Add correlation ID to all responses
  const response = NextResponse.next()
  response.headers.set('X-Correlation-ID', correlationId)

  // Apply rate limiting to API routes
  if (pathname.startsWith('/api/')) {
    const key = getRateLimitKey(request)
    
    // Different limits for different endpoints
    let limit = 100 // requests per minute (default)
    let windowMs = 60 * 1000 // 1 minute
    
    if (pathname.includes('/auth/')) {
      limit = 5
    } else if (pathname.includes('/appointments/book')) {
      limit = 10
    } else if (pathname.includes('/files/upload')) {
      limit = 20
      windowMs = 60 * 60 * 1000 // 1 hour
    }

    if (!checkRateLimit(key, limit, windowMs)) {
      logger.warn({ 
        ip: key, 
        pathname, 
        correlationId 
      }, 'Rate limit exceeded')
      
      return new Response(JSON.stringify({
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many requests'
        }
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-Correlation-ID': correlationId,
          'Retry-After': '60'
        }
      })
    }
  }

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)',
  ],
}
