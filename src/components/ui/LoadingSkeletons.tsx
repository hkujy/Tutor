import React, { Suspense } from 'react'

// Loading skeleton component - makes the app feel faster while data loads
// Inspired by GitHub's loading states, but adapted for our dashboard layout
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Stats cards - 4 on desktop, stack on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-200 rounded-lg h-24"></div>
        ))}
      </div>
      {/* Main content area - side by side on large screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-200 rounded-lg h-64"></div>
        <div className="bg-gray-200 rounded-lg h-64"></div>
      </div>
      <div className="bg-gray-200 rounded-lg h-48"></div>
    </div>
  )
}

// Loading skeleton for appointment list
export function AppointmentSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="border rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <div className="bg-gray-200 h-4 w-48 rounded"></div>
              <div className="bg-gray-200 h-3 w-32 rounded"></div>
            </div>
            <div className="bg-gray-200 h-8 w-20 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Loading skeleton for availability form
export function AvailabilitySkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="bg-gray-200 h-8 w-48 rounded"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-200 h-10 rounded"></div>
        <div className="bg-gray-200 h-10 rounded"></div>
      </div>
      <div className="bg-gray-200 h-32 rounded"></div>
      <div className="bg-gray-200 h-10 w-24 rounded"></div>
    </div>
  )
}

// Loading skeleton for notes
export function NotesSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="bg-gray-200 h-6 w-32 rounded"></div>
        <div className="bg-gray-200 h-8 w-20 rounded"></div>
      </div>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="border rounded-lg p-4 space-y-2">
          <div className="bg-gray-200 h-4 w-full rounded"></div>
          <div className="bg-gray-200 h-4 w-3/4 rounded"></div>
          <div className="bg-gray-200 h-3 w-24 rounded"></div>
        </div>
      ))}
    </div>
  )
}

// Generic loading skeleton
export function LoadingSkeleton({ 
  rows = 3, 
  height = 'h-4',
  className = '' 
}: { 
  rows?: number
  height?: string
  className?: string 
}) {
  return (
    <div className={`space-y-3 animate-pulse ${className}`}>
      {[...Array(rows)].map((_, i) => (
        <div 
          key={i} 
          className={`bg-gray-200 ${height} rounded ${
            i === rows - 1 ? 'w-3/4' : 'w-full'
          }`}
        ></div>
      ))}
    </div>
  )
}

// Suspense wrapper with error boundary
export function SuspenseWrapper({ 
  children, 
  fallback 
}: { 
  children: React.ReactNode
  fallback?: React.ReactNode 
}) {
  return (
    <Suspense fallback={fallback || <LoadingSkeleton />}>
      {children}
    </Suspense>
  )
}