import { NextRequest, NextResponse } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

const intlMiddleware = createMiddleware(routing)

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

export async function middleware(request: NextRequest) {
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

        return response
    }

    // ==========================================
    // 2. Page Routes Handling (With localization)
    // ==========================================

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
