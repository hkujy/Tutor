import React from 'react'

interface ErrorFallbackProps {
  title?: string
  message?: string
  retry?: () => void
}

export const WidgetError = ({ title = 'Widget Error', message = 'This content could not be loaded.', retry }: ErrorFallbackProps) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center h-full flex flex-col items-center justify-center min-h-[150px]">
    <span className="text-2xl mb-2">⚠️</span>
    <h3 className="text-sm font-medium text-red-800 mb-1">{title}</h3>
    <p className="text-xs text-red-600 mb-3">{message}</p>
    {retry && (
      <button
        onClick={retry}
        className="text-xs bg-white border border-red-300 text-red-700 px-3 py-1 rounded-md hover:bg-red-50 transition-colors"
      >
        Retry
      </button>
    )}
  </div>
)

export const SectionError = ({ title = 'Section Error', message = 'There was a problem loading this section.', retry }: ErrorFallbackProps) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <span className="text-2xl">⚠️</span>
    </div>
    <h3 className="text-lg font-medium text-red-800 mb-2">{title}</h3>
    <p className="text-sm text-red-600 mb-6 max-w-md mx-auto">{message}</p>
    {retry && (
      <button
        onClick={retry}
        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors shadow-sm"
      >
        Try Again
      </button>
    )}
  </div>
)
