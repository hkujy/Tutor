'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useAuth } from '../contexts/AuthContext'

export default function Navigation() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  // Don't show navigation on login page
  if (pathname === '/login') {
    return null
  }

  type NavItem = {
    href: string
    label: string
    icon: string
  }

  const getNavItems = (): NavItem[] => {
    if (!user) {
      return [{ href: '/login', label: 'Sign In', icon: '🔐' }]
    }

    const baseItems = [
      { href: '/', label: 'Home', icon: '🏠' }
    ]

    if (user.role === 'TUTOR') {
      baseItems.push({ href: '/tutor', label: 'Tutor Dashboard', icon: '👨‍🏫' })
    } else if (user.role === 'STUDENT') {
      baseItems.push({ href: '/student', label: 'Student Dashboard', icon: '👨‍🎓' })
    } else if (user.role === 'ADMIN') {
      baseItems.push(
        { href: '/tutor', label: 'Tutor Dashboard', icon: '👨‍🏫' },
        { href: '/student', label: 'Student Dashboard', icon: '👨‍🎓' }
      )
    }

    return baseItems
  }

  const navItems = getNavItems()

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <Image 
              src="/logo.png" 
              alt="Tutoring Calendar Logo" 
              width={40} 
              height={40}
              className="rounded-lg shadow-sm"
            />
            <Link href="/" className="text-xl font-bold text-indigo-600">
              Tutoring Calendar
            </Link>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href as any}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === item.href
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
              
              {user && (
                <div className="flex items-center space-x-4 ml-6">
                  <span className="text-sm text-gray-600">
                    {user.firstName} {user.lastName}
                  </span>
                  <button
                    onClick={logout}
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button className="text-gray-600 hover:text-gray-900">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}