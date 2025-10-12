'use client'

import React, { useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useRouter } from 'next/navigation'

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
    <div className="h-screen flex items-center justify-center">
      <div className="animate-spin h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
    </div>
  )
}
