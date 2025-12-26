'use client'

import { Suspense } from 'react'
import { useTranslations } from 'next-intl'
import NotificationManager from '@/components/notifications/NotificationManager'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function NotificationsPage() {
    const t = useTranslations('Notifications')
    const { data: session, status } = useSession()
    const router = useRouter()

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/en/login')
        }
    }, [status, router])

    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Loading...</p>
                </div>
            </div>
        )
    }

    if (!session) {
        return null
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
                    <p className="mt-2 text-muted-foreground">{t('subtitle')}</p>
                </div>

                <Suspense fallback={
                    <div className="flex items-center justify-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                }>
                    <NotificationManager
                        userId={session.user.id}
                        userRole={session.user.role.toLowerCase() as 'student' | 'tutor'}
                    />
                </Suspense>
            </div>
        </div>
    )
}
