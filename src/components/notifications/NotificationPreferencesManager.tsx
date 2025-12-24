'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { notificationService, type NotificationPreferences } from '../../lib/services/notification.service'
import { Skeleton } from '../ui/skeleton'
import LoadingButton from '../ui/LoadingButton'
import { useToast } from '../Toast'

interface NotificationPreferencesManagerProps {
  userId: string
}

export default function NotificationPreferencesManager({ userId }: NotificationPreferencesManagerProps) {
  const t = useTranslations('NotificationPreferencesManager')
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { success, error } = useToast()

  const fetchPreferences = useCallback(async () => {
    try {
      setLoading(true)
      const prefs = await notificationService.getPreferences()
      setPreferences(prefs)
    } catch (err) {
      console.error('Failed to fetch preferences:', err)
      error(t('messages.loadError'))
    } finally {
      setLoading(false)
    }
  }, [error, t]) // Added t to dependency array

  useEffect(() => {
    fetchPreferences()
  }, [fetchPreferences])

  const handleSavePreferences = async () => {
    if (!preferences) return

    try {
      setSaving(true)
      const updatedPrefs = await notificationService.updatePreferences(preferences)
      setPreferences(updatedPrefs)
      success(t('messages.saveSuccess'))
    } catch (err) {
      console.error('Failed to save preferences:', err)
      error(t('messages.saveError'))
    } finally {
      setSaving(false)
    }
  }

  const handlePreferenceChange = (key: keyof NotificationPreferences, value: boolean | number) => {
    if (!preferences) return
    setPreferences(prev => prev ? { ...prev, [key]: value } : null)
  }

  const getReminderTimingOptions = () => [
    { value: 0, label: t('reminderTimingOptions.noReminder') },
    { value: 1, label: t('reminderTimingOptions.1hour') },
    { value: 2, label: t('reminderTimingOptions.2hours') },
    { value: 4, label: t('reminderTimingOptions.4hours') },
    { value: 8, label: t('reminderTimingOptions.8hours') },
    { value: 24, label: t('reminderTimingOptions.1day') },
    { value: 48, label: t('reminderTimingOptions.2days') },
    { value: 72, label: t('reminderTimingOptions.3days') },
    { value: 168, label: t('reminderTimingOptions.1week') }
  ]

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <Skeleton width={250} height={24} className="mb-6" />
        <div className="space-y-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div>
                <Skeleton width={200} height={20} className="mb-2" />
                <Skeleton width={300} height={16} />
              </div>
              <Skeleton width={44} height={24} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!preferences) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-8">
          <p className="text-gray-500">{t('empty.message')}</p>
          <button
            onClick={fetchPreferences}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            {t('empty.retry')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">{t('title')}</h2>
          <LoadingButton
            onClick={handleSavePreferences}
            loading={saving}
            variant="primary"
            size="sm"
          >
            {t('saveChanges')}
          </LoadingButton>
        </div>

        <div className="space-y-6">
          {/* Email Notifications */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">{t('emailNotifications.title')}</h3>
              <p className="text-sm text-gray-500">
                {t('emailNotifications.description')}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.emailNotifications}
                onChange={(e) => handlePreferenceChange('emailNotifications', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* SMS Notifications */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">{t('smsNotifications.title')}</h3>
              <p className="text-sm text-gray-500">
                {t('smsNotifications.description')}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.smsNotifications}
                onChange={(e) => handlePreferenceChange('smsNotifications', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* Assignment Reminders */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">{t('assignmentReminders.title')}</h3>
              <p className="text-sm text-gray-500">
                {t('assignmentReminders.description')}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.assignmentReminders}
                onChange={(e) => handlePreferenceChange('assignmentReminders', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* Marketing Emails */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">{t('marketingEmails.title')}</h3>
              <p className="text-sm text-gray-500">
                {t('marketingEmails.description')}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.marketingEmails}
                onChange={(e) => handlePreferenceChange('marketingEmails', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* Reminder Timing */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">{t('reminderTiming.title')}</h3>
            <p className="text-sm text-gray-500 mb-4">
              {t('reminderTiming.description')}
            </p>
            <select
              value={preferences.reminderTiming}
              onChange={(e) => handlePreferenceChange('reminderTiming', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {getReminderTimingOptions().map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Notification Channels Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">📱 {t('channelsInfo.title')}</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <p><strong>{t('channelsInfo.emailChannel')}:</strong> {t('channelsInfo.emailDesc')}</p>
              <p><strong>{t('channelsInfo.smsChannel')}:</strong> {t('channelsInfo.smsDesc')}</p>
              <p><strong>{t('channelsInfo.inAppChannel')}:</strong> {t('channelsInfo.inAppDesc')}</p>
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">🔒 {t('privacyNotice.title')}</h4>
            <p className="text-sm text-gray-600">
              {t('privacyNotice.description')}
            </p>
          </div>
        </div>

        {/* Save Button at Bottom */}
        <div className="mt-8 flex justify-end">
          <LoadingButton
            onClick={handleSavePreferences}
            loading={saving}
            variant="primary"
          >
            {t('saveNotificationPreferences')}
          </LoadingButton>
        </div>
      </div>
    </>
  )
}