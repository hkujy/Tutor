'use client'

import { useEffect, useState } from 'react'

interface HydrationSafeProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  className?: string
}

/**
 * HydrationSafe Component - Provides a safe wrapper for content that may be
 * modified by browser extensions during hydration
 * 
 * This component:
 * - Delays rendering until after hydration
 * - Suppresses hydration warnings
 * - Provides fallback content during SSR
 */
export default function HydrationSafe({ 
  children, 
  fallback = null, 
  className 
}: HydrationSafeProps) {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    // Set hydrated state after component mounts
    setIsHydrated(true)
  }, [])

  // During SSR and initial hydration, show fallback
  if (!isHydrated) {
    return fallback ? (
      <div className={className} suppressHydrationWarning={true}>
        {fallback}
      </div>
    ) : null
  }

  // After hydration, show actual content
  return (
    <div className={className} suppressHydrationWarning={true}>
      {children}
    </div>
  )
}