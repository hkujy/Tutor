import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import StudentNotesManager from '../../src/components/notes/StudentNotesManager'

// Mock next-auth
jest.mock('next-auth/react')

// Mock fetch
global.fetch = jest.fn()

describe('StudentNotesManager Component', () => {
  const mockUseSession = useSession as jest.MockedFunction<typeof useSession>

  beforeEach(() => {
    jest.clearAllMocks()
    // Reset fetch mock
    ;(global.fetch as jest.Mock).mockClear()
  })

  it('should render for tutor with create note functionality', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: 'tutor-1',
          role: 'TUTOR',
          tutorId: 'tutor-1',
          isVerified: true,
          name: 'Jane Smith',
          email: 'jane@example.com'
        },
        expires: '2024-12-31T23:59:59.999Z'
      },
      status: 'authenticated',
      update: jest.fn()
    })

    const mockNotes = {
      notes: [
        {
          id: 'note-1',
          title: 'Test Note',
          content: 'Test content',
          type: 'GENERAL',
          priority: 'NORMAL',
          isPrivate: false,
          tags: ['test'],
          sessionDate: '2025-10-15',
          createdAt: '2025-10-10T10:00:00Z',
          updatedAt: '2025-10-10T10:00:00Z',
          student: {
            user: {
              firstName: 'John',
              lastName: 'Doe',
              email: 'john@example.com'
            }
          },
          tutor: {
            user: {
              firstName: 'Jane',
              lastName: 'Smith'
            }
          }
        }
      ]
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockNotes
    })

    render(<StudentNotesManager studentId="student-1" />)

    // Wait for notes to load
    await waitFor(() => {
      expect(screen.getByText('Student Notes')).toBeInTheDocument()
    })

    // Should show the "Add Note" button for tutors
    expect(screen.getByText('+ Add Note')).toBeInTheDocument()

    // Should show the test note
    expect(screen.getByText('Test Note')).toBeInTheDocument()
    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('should render for student without create note functionality', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: 'student-1',
          role: 'STUDENT',
          studentId: 'student-1',
          isVerified: true,
          name: 'John Doe',
          email: 'john@example.com'
        },
        expires: '2024-12-31T23:59:59.999Z'
      },
      status: 'authenticated',
      update: jest.fn()
    })

    const mockNotes = {
      notes: [
        {
          id: 'note-1',
          title: 'Public Note',
          content: 'This is a public note',
          type: 'PROGRESS_UPDATE',
          priority: 'HIGH',
          isPrivate: false,
          tags: ['progress'],
          createdAt: '2025-10-10T10:00:00Z',
          student: {
            user: {
              firstName: 'John',
              lastName: 'Doe',
              email: 'john@example.com'
            }
          },
          tutor: {
            user: {
              firstName: 'Jane',
              lastName: 'Smith'
            }
          }
        }
      ]
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockNotes
    })

    render(<StudentNotesManager studentId="student-1" />)

    // Wait for notes to load
    await waitFor(() => {
      expect(screen.getByText('Student Notes')).toBeInTheDocument()
    })

    // Should NOT show the "Add Note" button for students
    expect(screen.queryByText('+ Add Note')).not.toBeInTheDocument()

    // Should show the public note
    expect(screen.getByText('Public Note')).toBeInTheDocument()
    expect(screen.getByText('This is a public note')).toBeInTheDocument()
  })

  it('should handle empty state when no notes exist', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: 'tutor-1',
          role: 'TUTOR',
          tutorId: 'tutor-1',
          isVerified: true,
          name: 'Jane Smith',
          email: 'jane@example.com'
        },
        expires: '2024-12-31T23:59:59.999Z'
      },
      status: 'authenticated',
      update: jest.fn()
    })

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ notes: [] })
    })

    render(<StudentNotesManager studentId="student-1" />)

    // Wait for empty state to show
    await waitFor(() => {
      expect(screen.getByText(/No notes found/)).toBeInTheDocument()
    })

    expect(screen.getByText(/Create your first note!/)).toBeInTheDocument()
  })

  it('should show loading state initially', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: 'tutor-1',
          role: 'TUTOR',
          tutorId: 'tutor-1',
          isVerified: true,
          name: 'Jane Smith',
          email: 'jane@example.com'
        },
        expires: '2024-12-31T23:59:59.999Z'
      },
      status: 'authenticated',
      update: jest.fn()
    })

    // Mock fetch to never resolve (simulating loading)
    ;(global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}))

    render(<StudentNotesManager studentId="student-1" />)

    // Should show loading spinner (check for the CSS class)
    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })
})