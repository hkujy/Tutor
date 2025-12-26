'use client'

import React, { useState } from 'react'
import { Link, usePathname } from '@/i18n/routing'
import { useAuth } from '../contexts/AuthContext'
import { useTranslations } from 'next-intl'
import LanguageSwitcher from './LanguageSwitcher'

export default function Navigation() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const t = useTranslations('Navigation')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

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
      return [{ href: '/login', label: t('login'), icon: '🔐' }]
    }

    const baseItems = [
      { href: '/', label: t('home'), icon: '🏠' }
    ]

    if (user.role === 'TUTOR') {
      baseItems.push({ href: '/tutor', label: t('dashboard'), icon: '👨‍🏫' })
    } else if (user.role === 'STUDENT') {
      baseItems.push({ href: '/student', label: t('dashboard'), icon: '👨‍🎓' })
    } else if (user.role === 'ADMIN') {
      baseItems.push(
        { href: '/tutor', label: t('tutorDashboard'), icon: '👨‍🏫' },
        { href: '/student', label: t('studentDashboard'), icon: '👨‍🎓' }
      )
    }

    return baseItems
  }

  const navItems = getNavItems()

  return (
    <nav className="bg-card border-b border-border shadow-sm transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-primary hover:opacity-80 transition-opacity">
              Tutoring Calendar
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href as any}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${pathname === item.href
                    ? 'bg-primary/10 text-primary ring-1 ring-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                    }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </Link>
              ))}

              <div className="ml-4 border-l pl-4 border-border">
                <LanguageSwitcher />
              </div>

              {user && (
                <div className="flex items-center space-x-4 ml-6">
                  <span className="text-sm text-muted-foreground">
                    {user.firstName} {user.lastName}
                  </span>
                  <button
                    onClick={logout}
                    data-testid="logout-button"
                    aria-label="Logout"
                    className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-200"
                  >
                    {t('logout')}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <div className="flex items-center space-x-4">
              <LanguageSwitcher />
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-muted-foreground hover:text-foreground transition-colors p-2"
                aria-label="Toggle mobile menu"
                aria-expanded={isMobileMenuOpen}
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href as any}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-all duration-200 ${pathname === item.href
                    ? 'bg-primary/10 text-primary ring-1 ring-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                    }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </Link>
              ))}

              {user && (
                <>
                  <div className="px-3 py-2 text-sm text-muted-foreground border-t border-border mt-2 pt-2">
                    {user.firstName} {user.lastName}
                  </div>
                  <button
                    onClick={() => {
                      logout()
                      setIsMobileMenuOpen(false)
                    }}
                    data-testid="logout-button-mobile"
                    aria-label="Logout"
                    className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-200"
                  >
                    {t('logout')}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
