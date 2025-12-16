'use client'

import React from 'react'
import { useTheme, type Theme } from '../../contexts/ThemeContext'

interface ThemeOption {
    value: Theme
    label: string
    icon: string
    colors: {
        primary: string
        secondary: string
    }
}

const themeOptions: ThemeOption[] = [
    {
        value: 'light',
        label: 'Light',
        icon: '☀️',
        colors: {
            primary: 'bg-blue-500',
            secondary: 'bg-gray-100'
        }
    },
    {
        value: 'dark',
        label: 'Dark',
        icon: '🌙',
        colors: {
            primary: 'bg-blue-400',
            secondary: 'bg-gray-800'
        }
    },
    {
        value: 'ocean',
        label: 'Ocean',
        icon: '🌊',
        colors: {
            primary: 'bg-cyan-500',
            secondary: 'bg-teal-900'
        }
    }
]

export default function ThemeSelector() {
    const { theme, setTheme } = useTheme()

    return (
        <div className="flex items-center gap-2 p-1 bg-muted/50 rounded-lg transition-all duration-300">
            {themeOptions.map((option) => (
                <button
                    key={option.value}
                    onClick={() => setTheme(option.value)}
                    className={`
            relative group flex items-center gap-2 px-3 py-2 rounded-md
            transition-all duration-300 ease-in-out
            ${theme === option.value
                            ? 'bg-card shadow-md scale-105 ring-1 ring-primary/20'
                            : 'hover:bg-card/50 hover:scale-102'
                        }
          `}
                    aria-label={`Switch to ${option.label} theme`}
                    title={`${option.label} theme`}
                >
                    {/* Theme Icon */}
                    <span className="text-lg transition-transform duration-300 group-hover:scale-110">
                        {option.icon}
                    </span>

                    {/* Color Preview Circles */}
                    <div className="flex gap-1">
                        <div className={`w-3 h-3 rounded-full ${option.colors.primary} ring-1 ring-border transition-transform duration-300 group-hover:scale-110`} />
                        <div className={`w-3 h-3 rounded-full ${option.colors.secondary} ring-1 ring-border transition-transform duration-300 group-hover:scale-110`} />
                    </div>

                    {/* Active Indicator */}
                    {theme === option.value && (
                        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full animate-pulse" />
                    )}

                    {/* Tooltip on hover - hidden on mobile */}
                    <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap hidden sm:block shadow-lg border border-border">
                        {option.label}
                    </span>
                </button>
            ))}
        </div>
    )
}
