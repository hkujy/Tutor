'use client'

import { useTheme, type Theme } from '@/contexts/ThemeContext'
import { useState, useRef, useEffect } from 'react'

export function ThemeToggle() {
    const { theme, setTheme } = useTheme()
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const themes: { value: Theme; label: string; icon: string }[] = [
        { value: 'light', label: 'Light', icon: '☀️' },
        { value: 'dark', label: 'Dark', icon: '🌙' },
        { value: 'ocean', label: 'Ocean', icon: '🌊' },
    ]

    const currentTheme = themes.find((t) => t.value === theme) || themes[0]

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
                aria-label="Toggle theme"
                aria-expanded={isOpen}
            >
                <span className="text-lg">{currentTheme.icon}</span>
                <span className="hidden sm:inline text-sm font-medium">{currentTheme.label}</span>
                <svg
                    className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-40 rounded-lg bg-card border border-border shadow-lg overflow-hidden z-50">
                    {themes.map((themeOption) => (
                        <button
                            key={themeOption.value}
                            onClick={() => {
                                setTheme(themeOption.value)
                                setIsOpen(false)
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-accent transition-colors ${theme === themeOption.value ? 'bg-accent/50' : ''
                                }`}
                        >
                            <span className="text-lg">{themeOption.icon}</span>
                            <span className="text-sm font-medium">{themeOption.label}</span>
                            {theme === themeOption.value && (
                                <svg
                                    className="w-4 h-4 ml-auto text-primary"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
