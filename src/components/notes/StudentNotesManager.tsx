'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

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
  student: {
    user: {
      firstName: string
      lastName: string
      email: string
    }
  }
  tutor: {
    user: {
      firstName: string
      lastName: string
    }
  }
}

interface StudentNotesProps {
  studentId?: string
  tutorId?: string
}

const NOTE_TYPES = [
  { value: 'GENERAL', label: 'General Note', color: 'bg-gray-100 text-gray-800' },
  { value: 'SESSION_FEEDBACK', label: 'Session Feedback', color: 'bg-blue-100 text-blue-800' },
  { value: 'PROGRESS_UPDATE', label: 'Progress Update', color: 'bg-green-100 text-green-800' },
  { value: 'BEHAVIORAL', label: 'Behavioral Note', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'ACADEMIC_CONCERN', label: 'Academic Concern', color: 'bg-red-100 text-red-800' },
  { value: 'ACHIEVEMENT', label: 'Achievement', color: 'bg-purple-100 text-purple-800' },
  { value: 'PARENT_COMMUNICATION', label: 'Parent Communication', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'HOMEWORK_REMINDER', label: 'Homework Reminder', color: 'bg-orange-100 text-orange-800' },
] as const

const PRIORITY_LEVELS = [
  { value: 'LOW', label: 'Low', color: 'text-gray-500', icon: '⬇️' },
  { value: 'NORMAL', label: 'Normal', color: 'text-blue-500', icon: '➡️' },
  { value: 'HIGH', label: 'High', color: 'text-orange-500', icon: '⬆️' },
  { value: 'URGENT', label: 'Urgent', color: 'text-red-500', icon: '🚨' },
] as const

export default function StudentNotesManager({ studentId, tutorId }: StudentNotesProps) {
  const { data: session } = useSession()
  const [notes, setNotes] = useState<StudentNote[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingNote, setEditingNote] = useState<StudentNote | null>(null)
  const [filter, setFilter] = useState({
    type: '',
    priority: '',
    isPrivate: '',
  })

  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    type: 'GENERAL' as const,
    priority: 'NORMAL' as const,
    isPrivate: false,
    tags: [] as string[],
    sessionDate: '',
  })

  useEffect(() => {
    fetchNotes()
  }, [studentId, tutorId, filter])

  const fetchNotes = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (studentId) params.append('studentId', studentId)
      if (tutorId) params.append('tutorId', tutorId)
      if (filter.type) params.append('type', filter.type)
      if (filter.priority) params.append('priority', filter.priority)
      if (filter.isPrivate) params.append('isPrivate', filter.isPrivate)

      const response = await fetch(`/api/notes?${params}`)
      if (response.ok) {
        const data = await response.json()
        setNotes(data.notes || [])
      } else {
        console.error('Failed to fetch notes')
      }
    } catch (error) {
      console.error('Error fetching notes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!studentId) return

    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newNote,
          studentId,
          tags: newNote.tags.filter(tag => tag.trim()),
        }),
      })

      if (response.ok) {
        setNewNote({
          title: '',
          content: '',
          type: 'GENERAL',
          priority: 'NORMAL',
          isPrivate: false,
          tags: [],
          sessionDate: '',
        })
        setShowCreateForm(false)
        fetchNotes()
      } else {
        console.error('Failed to create note')
      }
    } catch (error) {
      console.error('Error creating note:', error)
    }
  }

  const handleUpdateNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingNote) return

    try {
      const response = await fetch('/api/notes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingNote.id,
          title: editingNote.title,
          content: editingNote.content,
          type: editingNote.type,
          priority: editingNote.priority,
          isPrivate: editingNote.isPrivate,
          tags: editingNote.tags,
          sessionDate: editingNote.sessionDate,
        }),
      })

      if (response.ok) {
        setEditingNote(null)
        fetchNotes()
      } else {
        console.error('Failed to update note')
      }
    } catch (error) {
      console.error('Error updating note:', error)
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return

    try {
      const response = await fetch(`/api/notes?id=${noteId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchNotes()
      } else {
        console.error('Failed to delete note')
      }
    } catch (error) {
      console.error('Error deleting note:', error)
    }
  }

  const addTag = (tag: string) => {
    if (tag.trim() && !newNote.tags.includes(tag.trim())) {
      setNewNote(prev => ({
        ...prev,
        tags: [...prev.tags, tag.trim()]
      }))
    }
  }

  const removeTag = (tagToRemove: string) => {
    setNewNote(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const getTypeInfo = (type: string) => {
    return NOTE_TYPES.find(t => t.value === type) || NOTE_TYPES[0]
  }

  const getPriorityInfo = (priority: string) => {
    return PRIORITY_LEVELS.find(p => p.value === priority) || PRIORITY_LEVELS[1]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Student Notes</h2>
        {session?.user?.role === 'TUTOR' && studentId && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Add Note
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border space-y-4">
        <h3 className="font-semibold text-gray-700">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={filter.type}
              onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              {NOTE_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={filter.priority}
              onChange={(e) => setFilter(prev => ({ ...prev, priority: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Priorities</option>
              {PRIORITY_LEVELS.map(priority => (
                <option key={priority.value} value={priority.value}>{priority.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Privacy</label>
            <select
              value={filter.isPrivate}
              onChange={(e) => setFilter(prev => ({ ...prev, isPrivate: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Notes</option>
              <option value="false">Public Notes</option>
              <option value="true">Private Notes</option>
            </select>
          </div>
        </div>
      </div>

      {/* Create Note Form */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Create New Note</h3>
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
                  Create Note
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {editingNote.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm flex items-center"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => {
                          setEditingNote(prev => prev ? {
                            ...prev,
                            tags: prev.tags.filter((_, i) => i !== index)
                          } : null)
                        }}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Add tag and press Enter"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      const tag = e.currentTarget.value.trim()
                      if (tag && editingNote && !editingNote.tags.includes(tag)) {
                        setEditingNote(prev => prev ? {
                          ...prev,
                          tags: [...prev.tags, tag]
                        } : null)
                        e.currentTarget.value = ''
                      }
                    }
                  }}
                />
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

      {/* Notes List */}
      <div className="space-y-4">
        {notes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No notes found. {session?.user?.role === 'TUTOR' && studentId && 'Create your first note!'}
          </div>
        ) : (
          notes.map((note) => {
            const typeInfo = getTypeInfo(note.type)
            const priorityInfo = getPriorityInfo(note.priority)
            
            return (
              <div
                key={note.id}
                className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-semibold text-gray-900">{note.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}>
                      {typeInfo.label}
                    </span>
                    <span className={`flex items-center space-x-1 text-sm font-medium ${priorityInfo.color}`}>
                      <span>{priorityInfo.icon}</span>
                      <span>{priorityInfo.label}</span>
                    </span>
                    {note.isPrivate && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                        🔒 Private
                      </span>
                    )}
                  </div>
                  {session?.user?.role === 'TUTOR' && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingNote(note)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
                
                <p className="text-gray-700 mb-3 whitespace-pre-wrap">{note.content}</p>
                
                {note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {note.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <div className="space-x-4">
                    <span>By: {note.tutor.user.firstName} {note.tutor.user.lastName}</span>
                    {note.sessionDate && (
                      <span>Session: {formatDate(note.sessionDate)}</span>
                    )}
                  </div>
                  <span>Created: {formatDate(note.createdAt)}</span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}