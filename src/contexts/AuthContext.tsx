'use client'

import React, { createContext, useContext } from 'react'
import { useSession, signOut } from 'next-auth/react'

export interface User {
  id: string
  email: string
  role: 'TUTOR' | 'STUDENT' | 'ADMIN'
  firstName?: string
  lastName?: string
  name?: string
  isVerified?: boolean
  studentId?: string
  tutorId?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  
  const user: User | null = session?.user ? {
    id: session.user.id,
    email: session.user.email || '',
    role: session.user.role || 'STUDENT',
    name: session.user.name || '',
    isVerified: session.user.isVerified || false,
    studentId: session.user.studentId,
    tutorId: session.user.tutorId,
  } : null

  const isLoading = status === 'loading'

  const logout = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}