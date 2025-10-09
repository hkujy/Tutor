'use client'

import { signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function UnauthorizedPage() {
  const { data: session } = useSession()
  const router = useRouter()

  useEffect(() => {
    // Redirect to appropriate dashboard if user has valid session
    if (session?.user?.role) {
      switch (session.user.role) {
        case 'STUDENT':
          router.push('/student')
          break
        case 'TUTOR':
          router.push('/tutor')
          break
        case 'ADMIN':
          router.push('/')
          break
        default:
          router.push('/')
      }
    }
  }, [session, router])

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Access Denied
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            You don&apos;t have permission to access this page.
          </p>
        </div>
        
        <div className="mt-8 space-y-4">
          {session?.user ? (
            <>
              <p className="text-center text-sm text-gray-500">
                Signed in as: {session.user.email} ({session.user.role})
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => router.back()}
                  className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Go Back
                </button>
                <button
                  onClick={handleSignOut}
                  className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Sign Out
                </button>
              </div>
            </>
          ) : (
            <div className="text-center">
              <button
                onClick={() => router.push('/login')}
                className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}