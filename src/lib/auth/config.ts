import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { compare } from 'bcryptjs'
import { db } from '../db/client'
import { env } from '../config/env'

// In-memory rate limiting (Edge runtime compatible)
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>()

const MAX_LOGIN_ATTEMPTS = 5 // Safe production limit
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes
const ATTEMPT_WINDOW = 15 * 60 * 1000 // 15 minutes in milliseconds

// Security validation functions - kept these strict after previous XSS issues
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 254
}

const isValidPassword = (password: string): boolean => {
  return password.length >= 8 && password.length <= 128
}

const sanitizeEmail = (email: string): string => {
  return email.toLowerCase().trim()
}

const checkRateLimit = (ip: string): boolean => {
  const now = Date.now()
  const attempts = loginAttempts.get(ip)

  if (!attempts) {
    loginAttempts.set(ip, { count: 1, lastAttempt: now })
    return true
  }

  if (now - attempts.lastAttempt > ATTEMPT_WINDOW) {
    loginAttempts.set(ip, { count: 1, lastAttempt: now })
    return true
  }

  if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
    if (now - attempts.lastAttempt < LOCKOUT_DURATION) {
      return false
    } else {
      loginAttempts.set(ip, { count: 1, lastAttempt: now })
      return true
    }
  }

  attempts.count++
  attempts.lastAttempt = now
  return true
}

const recordFailedAttempt = (ip: string): void => {
  // Attempts are already tracked in checkRateLimit
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours (reduced from 30 days for security)
    updateAge: 60 * 60, // Update session every hour
  },
  jwt: {
    secret: env.NEXTAUTH_SECRET,
    maxAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        try {
          // Input validation
          if (!credentials?.email || !credentials?.password) {
            throw new Error('AUTH_ERROR_REQUIRED_FIELDS')
          }

          if (!isValidEmail(credentials.email)) {
            throw new Error('AUTH_ERROR_INVALID_EMAIL_FORMAT')
          }

          if (!isValidPassword(credentials.password)) {
            throw new Error('AUTH_ERROR_INVALID_PASSWORD_FORMAT')
          }

          // Rate limiting check
          const clientIP = req?.headers?.['x-forwarded-for'] || req?.headers?.['x-real-ip'] || 'unknown'
          const ip = Array.isArray(clientIP) ? clientIP[0] : clientIP

          if (!checkRateLimit(ip)) {
            throw new Error('AUTH_ERROR_TOO_MANY_ATTEMPTS')
          }

          const sanitizedEmail = sanitizeEmail(credentials.email)

          // Find user with security checks - optimized query
          const user = await db.user.findUnique({
            where: {
              email: sanitizedEmail,
              isActive: true // Only allow active users
            },
            select: {
              id: true,
              email: true,
              password: true,
              role: true,
              firstName: true,
              lastName: true,
              isActive: true,
              isVerified: true,
              lastLoginAt: true,
              avatar: true,
              student: {
                select: {
                  id: true
                }
              },
              tutor: {
                select: {
                  id: true
                }
              },
            },
          })

          if (!user || !user.password) {
            recordFailedAttempt(ip)
            throw new Error('AUTH_ERROR_INVALID_CREDENTIALS')
          }

          // Verify password
          const isPasswordValid = await compare(credentials.password, user.password)

          if (!isPasswordValid) {
            recordFailedAttempt(ip)
            throw new Error('AUTH_ERROR_INVALID_CREDENTIALS')
          }

          // Additional security checks
          if (!user.isActive) {
            throw new Error('AUTH_ERROR_ACCOUNT_DEACTIVATED')
          }

          // Check for suspicious activity
          const now = new Date()
          const lastLogin = user.lastLoginAt

          if (lastLogin) {
            const timeDiff = now.getTime() - lastLogin.getTime()
            const hoursDiff = timeDiff / (1000 * 60 * 60)

            // Log suspicious rapid logins
            if (hoursDiff < 0.1) { // Less than 6 minutes
              console.warn(`Rapid login detected for user ${user.email}`)
            }
          }

          // Update last login with additional security info
          await db.user.update({
            where: { id: user.id },
            data: {
              lastLoginAt: now,
              // Could add more tracking fields like loginIP, userAgent, etc.
            },
          })

          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            role: user.role,
            image: user.avatar,
            isVerified: user.isVerified,
            studentId: user.student?.id,
            tutorId: user.tutor?.id,
          }
        } catch (error) {
          console.error('Authentication error:', error)
          // Always throw a generic error code to avoid leaking internal error details
          throw new Error('AUTH_ERROR_GENERAL')
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = user.role
        token.isVerified = user.isVerified
        token.studentId = user.studentId
        token.tutorId = user.tutorId
        token.iat = Math.floor(Date.now() / 1000) // Track token creation time
      }

      // Validate token age for security
      if (token.iat) {
        const tokenAge = Math.floor(Date.now() / 1000) - (token.iat as number)
        const maxAge = 24 * 60 * 60 // 24 hours

        if (tokenAge > maxAge) {
          console.warn('Token expired, forcing re-authentication')
          // Return minimal token to force re-authentication
          return {
            ...token,
            expired: true
          }
        }
      }

      // Handle session update with validation
      if (trigger === 'update' && session) {
        // Only allow specific fields to be updated
        const allowedUpdates = ['name', 'image']
        const filteredSession = Object.keys(session)
          .filter(key => allowedUpdates.includes(key))
          .reduce((obj, key) => {
            obj[key] = session[key]
            return obj
          }, {} as any)

        token = { ...token, ...filteredSession }
      }

      return token
    },
    async session({ session, token }) {
      if (token && session.user && !token.expired) {
        session.user.id = token.sub as string
        session.user.role = token.role as 'STUDENT' | 'TUTOR' | 'ADMIN'
        session.user.isVerified = token.isVerified as boolean
        session.user.studentId = token.studentId as string | undefined
        session.user.tutorId = token.tutorId as string | undefined

          // Add security metadata (extending session in types would be better)
          ; (session as any).tokenCreatedAt = token.iat as number
      }

      return session
    },
    async redirect({ url, baseUrl }) {
      // Enhanced redirect security with i18n support
      if (url.startsWith('/')) {
        // Validate relative URLs for safety, allowing for optional locale prefix
        // Matches: /tutor, /en/tutor, /zh/tutor, etc.
        const safeRelativePaths = ['/student', '/tutor', '/dashboard', '/profile', '/settings']

        // Regex to check if path starts with optional locale (/en or /zh) followed by a safe path
        const isAllowedPath = safeRelativePaths.some(path => {
          // Matches ^/en/tutor... or ^/tutor...
          const regex = new RegExp(`^(\/(en|zh))?${path}`)
          return regex.test(url)
        })

        if (isAllowedPath) {
          // If the url is relative, return it directly to be appended by next-auth or used as is
          // Note: NextAuth `redirect` callback usually expects a full URL or a relative URL. 
          // If we return just `url`, NextAuth constructs the full URL.
          if (url.startsWith('/')) return url
          return `${baseUrl}${url}`
        }
        return baseUrl
      }

      // Enhanced origin validation
      try {
        const urlObj = new URL(url)
        const baseUrlObj = new URL(baseUrl)

        if (urlObj.origin === baseUrlObj.origin) {
          return url
        }

        // Additional check for subdomain security
        if (urlObj.hostname.endsWith(`.${baseUrlObj.hostname}`)) {
          return url
        }
      } catch (error) {
        console.warn('Invalid redirect URL:', url)
      }

      return baseUrl
    },
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      // Enhanced logging with security context
      const timestamp = new Date().toISOString()
      console.log(`[${timestamp}] User ${user.email} signed in`, {
        isNewUser,
        provider: account?.provider,
        userId: user.id
      })

      // Log new user registrations for monitoring
      if (isNewUser) {
        console.log(`[${timestamp}] New user registration: ${user.email}`)
      }
    },
    async signOut({ session, token }) {
      const timestamp = new Date().toISOString()
      console.log(`[${timestamp}] User signed out`, {
        userId: token?.sub,
        sessionDuration: token?.iat ? Date.now() / 1000 - (token.iat as number) : 'unknown'
      })
    },
    async session({ session, token }) {
      // Log session access for monitoring (optional - can be verbose)
      if (env.NODE_ENV === 'development') {
        console.debug('Session accessed', { userId: token?.sub })
      }
    },
  },
  debug: env.NODE_ENV === 'development',
}
