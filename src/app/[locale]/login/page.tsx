'use client'

import React, { useState } from 'react'
import { useRouter, Link } from '@/i18n/routing'
import { signIn } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import LoadingButton from '../../../components/ui/LoadingButton'

export const dynamic = 'force-dynamic'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const t = useTranslations('Auth')

  // Demo user credentials from the seed data
  const demoUsers = {
    TUTOR: {
      email: 'tutor@example.com',
      password: 'tutor123',
      firstName: 'Sarah',
      lastName: 'Johnson'
    },
    STUDENT: {
      email: 'student@example.com',
      password: 'student123',
      firstName: 'Alex',
      lastName: 'Smith'
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      setError('Please enter both email and password')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password')
      } else if (result?.ok) {
        // Get the user session to determine their actual role
        const session = await fetch('/api/auth/session').then(res => res.json())
        const userRole = session?.user?.role

        // Redirect based on the actual user role from the database
        if (userRole === 'TUTOR') {
          router.push('/tutor')
        } else if (userRole === 'STUDENT') {
          router.push('/student')
        } else {
          // Default redirect
          router.push('/')
        }
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickLogin = async (role: 'TUTOR' | 'STUDENT') => {
    const demoUser = demoUsers[role]
    setLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email: demoUser.email,
        password: demoUser.password,
        redirect: false,
      })

      if (result?.error) {
        setError('Demo login failed')
      } else if (result?.ok) {
        router.push(role === 'TUTOR' ? '/tutor' : '/student')
      }
    } catch (error) {
      console.error('Quick login error:', error)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-card rounded-xl shadow-lg p-8 border border-border">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Tutoring Calendar
            </h1>
            <p className="text-muted-foreground">
              {t('loginTitle')}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            {/* Quick Demo Login Buttons */}
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center">Quick Demo Login:</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleQuickLogin('TUTOR')}
                  disabled={loading}
                  className="flex flex-col items-center p-4 border-2 border-primary/30 rounded-lg hover:border-primary hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-2">
                    <svg
                      className="w-6 h-6 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      suppressHydrationWarning={true}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <span className="font-medium text-foreground">Tutor</span>
                  <span className="text-xs text-muted-foreground">Sarah Johnson</span>
                </button>

                <button
                  onClick={() => handleQuickLogin('STUDENT')}
                  disabled={loading}
                  className="flex flex-col items-center p-4 border-2 border-accent/30 rounded-lg hover:border-accent hover:bg-accent/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center mb-2">
                    <svg
                      className="w-6 h-6 text-accent-foreground"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      suppressHydrationWarning={true}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <span className="font-medium text-foreground">Student</span>
                  <span className="text-xs text-muted-foreground">Alex Smith</span>
                </button>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-muted-foreground">{t('orManual')}</span>
              </div>
            </div>

            {/* Manual Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
                  {t('emailLabel')}
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">
                  {t('passwordLabel')}
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  placeholder="Enter your password"
                />
              </div>

              <LoadingButton
                type="submit"
                loading={loading}
                loadingText={t('signingIn')}
                variant="primary"
                className="w-full"
              >
                {t('signInButton')}
              </LoadingButton>

              <div className="text-center mt-4">
                <p className="text-sm text-muted-foreground">
                  {t('registerQuestion')}{' '}
                  <Link href="/auth/signup" className="font-medium text-primary hover:text-primary/80">
                    {t('registerAction')}
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <p>Demo Credentials:</p>
          <p>Tutor: tutor@example.com / tutor123</p>
          <p>Student: student@example.com / student123</p>
        </div>
      </div>
    </div>
  )
}
