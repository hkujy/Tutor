'use client'

import React, { useState, useEffect, useCallback } from 'react'

interface StudentNote {
  id: string
  title: string
  content: string
  type: 'GENERAL' | 'SESSION_FEEDBACK' | 'PROGRESS_UPDATE' | 'BEHAVIORAL' | 'ACADEMIC_CONCERN' | 'ACHIEVEMENT' | 'PARENT_COMMUNICATION' | 'HOMEWORK_REMINDER'
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  isPrivate: boolean
  tags: string[]
  sessionDate?: string
  createdAt: string
  updatedAt: string
}

interface StudentNotesModalProps {
  studentId: string
  studentName: string
  tutorId: string
  isOpen: boolean
  onClose: () => void
}

const NOTE_TYPES = [
  { value: 'GENERAL', label: 'General' },
  { value: 'SESSION_FEEDBACK', label: 'Session Feedback' },
  { value: 'PROGRESS_UPDATE', label: 'Progress Update' },
  { value: 'BEHAVIORAL', label: 'Behavioral' },
  { value: 'ACADEMIC_CONCERN', label: 'Academic Concern' },
  { value: 'ACHIEVEMENT', label: 'Achievement' },
  { value: 'PARENT_COMMUNICATION', label: 'Parent Communication' },
  { value: 'HOMEWORK_REMINDER', label: 'Homework Reminder' }
]

const PRIORITY_LEVELS = [
  { value: 'LOW', label: 'Low' },
  { value: 'NORMAL', label: 'Normal' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' }
]

export default function StudentNotesModal({ studentId, studentName, tutorId, isOpen, onClose }: StudentNotesModalProps) {
  const [notes, setNotes] = useState<StudentNote[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingNote, setEditingNote] = useState<StudentNote | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    type: 'GENERAL' as const,
    priority: 'NORMAL' as const,
    isPrivate: false,
    tags: [] as string[],
    sessionDate: ''
  })

  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/students/${studentId}/notes`)
      const data = await response.json()
      
      if (response.ok) {
        setNotes(data.notes || [])
      } else {
        console.error('Failed to fetch notes:', data.error)
      }
    } catch (error) {
      console.error('Error fetching notes:', error)
    } finally {
      setLoading(false)
    }
  }, [studentId])

  useEffect(() => {
    if (isOpen && studentId) {
      fetchNotes()
    }
  }, [isOpen, studentId, fetchNotes])

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch(`/api/students/${studentId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newNote,
          tutorId
        }),
      })

      if (response.ok) {
        await fetchNotes()
        setNewNote({
          title: '',
          content: '',
          type: 'GENERAL',
          priority: 'NORMAL',
          isPrivate: false,
          tags: [],
          sessionDate: ''
        })
        setShowCreateForm(false)
      } else {
        const data = await response.json()
        console.error('Failed to create note:', data.error)
      }
    } catch (error) {
      console.error('Error creating note:', error)
    }
  }

  const handleUpdateNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingNote) return

    try {
      const response = await fetch(`/api/students/${studentId}/notes/${editingNote.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingNote),
      })

      if (response.ok) {
        await fetchNotes()
        setEditingNote(null)
      } else {
        const data = await response.json()
        console.error('Failed to update note:', data.error)
      }
    } catch (error) {
      console.error('Error updating note:', error)
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return

    try {
      const response = await fetch(`/api/students/${studentId}/notes/${noteId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchNotes()
      } else {
        const data = await response.json()
        console.error('Failed to delete note:', data.error)
      }
    } catch (error) {
      console.error('Error deleting note:', error)
    }
  }

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || note.type === filterType
    return matchesSearch && matchesType
  })

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'text-red-600 bg-red-100'
      case 'HIGH': return 'text-orange-600 bg-orange-100'
      case 'NORMAL': return 'text-yellow-600 bg-yellow-100'
      case 'LOW': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'SESSION_FEEDBACK': return 'text-blue-600 bg-blue-100'
      case 'PROGRESS_UPDATE': return 'text-green-600 bg-green-100'
      case 'BEHAVIORAL': return 'text-purple-600 bg-purple-100'
      case 'HOMEWORK_REMINDER': return 'text-yellow-600 bg-yellow-100'
      case 'ACADEMIC_CONCERN': return 'text-red-600 bg-red-100'
      case 'ACHIEVEMENT': return 'text-emerald-600 bg-emerald-100'
      case 'PARENT_COMMUNICATION': return 'text-indigo-600 bg-indigo-100'
      case 'GENERAL': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">
              Notes for {studentName}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
          
          {/* Controls */}
          <div className="mt-4 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                {NOTE_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Note
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading notes...</p>
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No notes found</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="mt-2 text-blue-600 hover:text-blue-800"
              >
                Create your first note
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotes.map((note) => (
                <div key={note.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{note.title}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(note.type)}`}>
                          {NOTE_TYPES.find(t => t.value === note.type)?.label}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(note.priority)}`}>
                          {PRIORITY_LEVELS.find(p => p.value === note.priority)?.label}
                        </span>
                        {note.isPrivate && (
                          <span className="px-2 py-1 rounded text-xs font-medium text-purple-600 bg-purple-100">
                            Private
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => setEditingNote(note)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="Edit note"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Delete note"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-3">{note.content}</p>
                  
                  {note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {note.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>Created: {new Date(note.createdAt).toLocaleDateString()}</span>
                    {note.sessionDate && (
                      <span>Session: {new Date(note.sessionDate).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Note Form */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold mb-4">Add New Note</h3>
              <form onSubmit={handleCreateNote} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={newNote.title}
                    onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={newNote.type}
                      onChange={(e) => setNewNote(prev => ({ ...prev, type: e.target.value as any }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {NOTE_TYPES.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select
                      value={newNote.priority}
                      onChange={(e) => setNewNote(prev => ({ ...prev, priority: e.target.value as any }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {PRIORITY_LEVELS.map(priority => (
                        <option key={priority.value} value={priority.value}>{priority.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                  <textarea
                    value={newNote.content}
                    onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                    rows={4}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Session Date (Optional)</label>
                    <input
                      type="date"
                      value={newNote.sessionDate}
                      onChange={(e) => setNewNote(prev => ({ ...prev, sessionDate: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isPrivate"
                      checked={newNote.isPrivate}
                      onChange={(e) => setNewNote(prev => ({ ...prev, isPrivate: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isPrivate" className="ml-2 block text-sm text-gray-700">
                      Private Note (Only visible to tutors)
                    </label>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Save Note
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Note Form */}
        {editingNote && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold mb-4">Edit Note</h3>
              <form onSubmit={handleUpdateNote} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={editingNote.title}
                    onChange={(e) => setEditingNote(prev => prev ? { ...prev, title: e.target.value } : null)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={editingNote.type}
                      onChange={(e) => setEditingNote(prev => prev ? { ...prev, type: e.target.value as any } : null)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {NOTE_TYPES.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select
                      value={editingNote.priority}
                      onChange={(e) => setEditingNote(prev => prev ? { ...prev, priority: e.target.value as any } : null)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {PRIORITY_LEVELS.map(priority => (
                        <option key={priority.value} value={priority.value}>{priority.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                  <textarea
                    value={editingNote.content}
                    onChange={(e) => setEditingNote(prev => prev ? { ...prev, content: e.target.value } : null)}
                    rows={4}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Session Date (Optional)</label>
                    <input
                      type="date"
                      value={editingNote.sessionDate || ''}
                      onChange={(e) => setEditingNote(prev => prev ? { ...prev, sessionDate: e.target.value } : null)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="editIsPrivate"
                      checked={editingNote.isPrivate}
                      onChange={(e) => setEditingNote(prev => prev ? { ...prev, isPrivate: e.target.checked } : null)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="editIsPrivate" className="ml-2 block text-sm text-gray-700">
                      Private Note (Only visible to tutors)
                    </label>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setEditingNote(null)}
                    className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Update Note
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}