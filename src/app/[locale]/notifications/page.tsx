'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

export default function NotificationsPage() {
    const router = useRouter()
    const { data: session } = useSession()

    useEffect(() => {
        // Redirect to appropriate dashboard based on role
        if (session?.user?.role === 'STUDENT') {
            router.push('/en/student')
        } else if (session?.user?.role === 'TUTOR') {
            router.push('/en/tutor')
        } else {
            router.push('/en/login')
        }
    }, [session, router])

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Redirecting to dashboard...</p>
            </div>
        </div>
    )
}
