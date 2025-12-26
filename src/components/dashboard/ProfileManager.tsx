'use client'

import React, { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import LoadingButton from '../ui/LoadingButton'
import { useToast } from '../Toast'

export default function ProfileManager() {
    const t = useTranslations('ProfileManager')
    const { success, error: toastError } = useToast()

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        email: ''
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoading(true)
                const res = await fetch('/api/user/profile')
                const data = await res.json()
                if (res.ok && data.user) {
                    setFormData({
                        firstName: data.user.firstName || '',
                        lastName: data.user.lastName || '',
                        phone: data.user.phone || '',
                        email: data.user.email || ''
                    })
                }
            } catch (err) {
                console.error('Failed to fetch profile:', err)
                toastError(t('messages.loadError'))
            } finally {
                setLoading(false)
            }
        }
        fetchProfile()
    }, [t, toastError])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            setSaving(true)
            const res = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    phone: formData.phone
                })
            })
            if (res.ok) {
                success(t('messages.saveSuccess'))
                // Force session update or tell user to refresh
                setTimeout(() => window.location.reload(), 1500)
            } else {
                const data = await res.json()
                toastError(data.error || t('messages.saveError'))
            }
        } catch (err) {
            console.error('Failed to save profile:', err)
            toastError(t('messages.saveError'))
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="bg-card border border-border rounded-lg p-6 space-y-4 animate-pulse">
                <div className="h-4 bg-muted rounded w-1/4"></div>
                <div className="space-y-3">
                    <div className="h-10 bg-muted rounded"></div>
                    <div className="h-10 bg-muted rounded"></div>
                    <div className="h-10 bg-muted rounded"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-card border border-border rounded-lg shadow-sm p-6 max-w-2xl">
            <h3 className="text-xl font-semibold mb-6">{t('title')}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-muted-foreground mb-1">
                            {t('firstName')}
                        </label>
                        <input
                            type="text"
                            id="firstName"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>
                    <div>
                        <label htmlFor="lastName" className="block text-sm font-medium text-muted-foreground mb-1">
                            {t('lastName')}
                        </label>
                        <input
                            type="text"
                            id="lastName"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-muted-foreground mb-1">
                        {t('email')}
                    </label>
                    <input
                        type="email"
                        id="email"
                        value={formData.email}
                        disabled
                        className="w-full px-3 py-2 bg-muted border border-input rounded-md text-muted-foreground cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground mt-1">{t('emailNote')}</p>
                </div>

                <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-muted-foreground mb-1">
                        {t('phone')}
                    </label>
                    <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder={t('phonePlaceholder')}
                        className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                </div>

                <div className="pt-4 flex justify-end">
                    <LoadingButton
                        type="submit"
                        loading={saving}
                        variant="primary"
                    >
                        {t('saveButton')}
                    </LoadingButton>
                </div>
            </form>
        </div>
    )
}
