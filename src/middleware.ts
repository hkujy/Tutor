import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth') || request.nextUrl.pathname === '/login'
  const isApiAuthRoute = request.nextUrl.pathname.startsWith('/api/auth')
  const isHealthRoute = request.nextUrl.pathname === '/api/health'

  // Allow auth pages and api routes without token
  if (isAuthPage || isApiAuthRoute || isHealthRoute) {
    return NextResponse.next()
  }

  // Protect API routes that require authentication
  if (request.nextUrl.pathname.startsWith('/api/')) {
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
  }

  // Redirect unauthenticated users to login for protected pages
  if (!token && !isAuthPage) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', request.nextUrl.href)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
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
