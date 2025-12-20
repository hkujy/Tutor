'use client'

import React, { useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useRouter } from '@/i18n/routing'

export default function Home() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login')
    } else if (!isLoading && user) {
      // Immediate redirect without showing loading screen
      const targetRoute = user.role === 'TUTOR' ? '/tutor' : '/student'
      router.replace(targetRoute)
    }
  }, [user, isLoading, router])

  // Minimal loading spinner - no heavy UI components
  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Tutoring Calendar
        </h1>
        <div className="animate-spin h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  )
}