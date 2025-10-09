'use client'

import { useEffect, useState } from 'react'

interface NoSSRProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * NoSSR Component - Prevents server-side rendering of wrapped components
 * Useful for components that have hydration mismatches due to:
 * - Browser extensions modifying DOM
 * - Client-only APIs (window, localStorage, etc.)
 * - Dynamic content that differs between server and client
 */
export default function NoSSR({ children, fallback = null }: NoSSRProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return <>{fallback}</>
  }

  return <>{children}</>
}