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
      </div>
    </div>
  )
}
