'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import LoadingButton from '../../components/ui/LoadingButton'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Tutoring Calendar
            </h1>
            <p className="text-gray-600">
              Welcome back! Please sign in to your account.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            {/* Quick Demo Login Buttons */}
            <div className="space-y-3">
              <p className="text-sm text-gray-600 text-center">Quick Demo Login:</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleQuickLogin('TUTOR')}
                  disabled={loading}
                  className="flex flex-col items-center p-4 border-2 border-blue-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <span className="font-medium text-gray-900">Tutor</span>
                  <span className="text-xs text-gray-500">Sarah Johnson</span>
                </button>

                <button
                  onClick={() => handleQuickLogin('STUDENT')}
                  disabled={loading}
                  className="flex flex-col items-center p-4 border-2 border-green-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <span className="font-medium text-gray-900">Student</span>
                  <span className="text-xs text-gray-500">Alex Smith</span>
                </button>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or sign in manually</span>
              </div>
            </div>

            {/* Manual Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your password"
                />
              </div>

              <LoadingButton
                type="submit"
                loading={loading}
                loadingText="Signing in..."
                variant="primary"
                className="w-full"
              >
                Sign In
              </LoadingButton>
            </form>
          </div>
        </div>

        <div className="text-center text-sm text-gray-600">
          <p>Demo Credentials:</p>
          <p>Tutor: tutor@example.com / tutor123</p>
          <p>Student: student@example.com / student123</p>
        </div>
      </div>
    </div>
  )
}