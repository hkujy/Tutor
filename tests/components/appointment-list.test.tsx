import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import AppointmentList from '../../src/components/calendar/AppointmentList'

// Mock the date-fns functions
jest.mock('date-fns', () => ({
  format: jest.fn((date, formatStr) => {
    if (formatStr === 'PPp') return 'Oct 7, 2025 at 10:00 AM'
    if (formatStr === 'p') return '10:00 AM'
    return '2025-10-07'
  }),
  isToday: jest.fn(() => false),
  isBefore: jest.fn(() => false),
  isAfter: jest.fn(() => true),
  startOfDay: jest.fn((date) => date),
  endOfDay: jest.fn((date) => date),
}))

const mockAppointments = [
  {
    id: 'apt-1',
    startTime: '2025-10-15T10:00:00Z',
    endTime: '2025-10-15T11:00:00Z',
    subject: 'Mathematics',
    status: 'SCHEDULED',
    tutor: {
      firstName: 'John',
      lastName: 'Doe',
    },
    student: {
      firstName: 'Jane',
      lastName: 'Smith',
    },
  },
  {
    id: 'apt-2',
    startTime: '2025-10-16T14:00:00Z',
    endTime: '2025-10-16T15:00:00Z',
    subject: 'Physics',
    status: 'CONFIRMED',
    tutor: {
      firstName: 'Bob',
      lastName: 'Wilson',
    },
    student: {
      firstName: 'Alice',
      lastName: 'Johnson',
    },
  },
]

describe('AppointmentList Hydration Tests', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks()

    // Mock fetch to return appointments
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ appointments: mockAppointments }),
    })
  })

  test('renders without hydration mismatch warnings', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { })

    render(<AppointmentList />)

    // Wait for component to hydrate and load data
    await waitFor(() => {
      expect(screen.getByText('Mathematics')).toBeInTheDocument()
    })

    // Check that no hydration warnings were logged
    const hydrationErrors = consoleSpy.mock.calls.filter(call =>
      call[0]?.includes?.('Hydration') || call[0]?.includes?.('hydration')
    )
    expect(hydrationErrors).toHaveLength(0)

    consoleSpy.mockRestore()
  })

  test('status icons only render after hydration', async () => {
    render(<AppointmentList />)

    // Initially, status icons should not be present (before hydration)
    await act(async () => {
      // Simulate initial render before hydration
      expect(screen.queryByText('Mathematics')).not.toBeInTheDocument()
    })

    // After hydration and data loading, status icons should appear
    await waitFor(() => {
      expect(screen.getByText('Mathematics')).toBeInTheDocument()
      expect(screen.getByText('Physics')).toBeInTheDocument()
    })

    // Verify status indicators are present
    expect(screen.getByText('status.scheduled')).toBeInTheDocument()
    expect(screen.getByText('status.confirmed')).toBeInTheDocument()
  })

  test('handles currentTime state properly to avoid SSR mismatch', async () => {
    // Mock Date to control time-based rendering
    const mockDate = new Date('2025-10-07T12:00:00Z')
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate)

    render(<AppointmentList />)

    await waitFor(() => {
      expect(screen.getByText('Mathematics')).toBeInTheDocument()
    })

    // Verify that time-sensitive logic works correctly
    expect(global.fetch).toHaveBeenCalledWith('/api/appointments?page=1&limit=10')
  })

  test('sorting functionality works without hydration issues', async () => {
    const user = userEvent.setup()

    render(<AppointmentList />)

    await waitFor(() => {
      expect(screen.getByText('Mathematics')).toBeInTheDocument()
    })

    // Test sorting by subject
    const sortSelect = screen.getByDisplayValue('sort.date')
    await user.selectOptions(sortSelect, 'subject')

    // Verify appointments are still rendered correctly after sorting
    expect(screen.getByText('Mathematics')).toBeInTheDocument()
    expect(screen.getByText('Physics')).toBeInTheDocument()
  })

  test('filters work correctly after hydration', async () => {
    const user = userEvent.setup()

    render(<AppointmentList />)

    await waitFor(() => {
      expect(screen.getByText('Mathematics')).toBeInTheDocument()
    })

    // Test status filter
    const statusFilter = screen.getByDisplayValue('filters.upcoming')
    await user.selectOptions(statusFilter, 'all')

    // All appointments should be visible
    expect(screen.getByText('Mathematics')).toBeInTheDocument()
    expect(screen.getByText('Physics')).toBeInTheDocument()
  })

  test('handles loading state without hydration conflicts', () => {
    // Mock fetch to simulate loading
    global.fetch = jest.fn().mockImplementation(() => new Promise(() => { }))

    render(<AppointmentList />)

    // Should show loading skeleton without hydration warnings
    expect(screen.getByTestId('skeleton-list')).toBeInTheDocument()
  })

  test('error handling works correctly', async () => {
    // Mock fetch to simulate error
    global.fetch = jest.fn().mockRejectedValue(new Error('API Error'))

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { })

    render(<AppointmentList />)

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch appointments:', expect.any(Error))
    })

    consoleSpy.mockRestore()
  })
})

describe('AppointmentList Accessibility', () => {
  test('has proper ARIA labels and roles', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ appointments: mockAppointments }),
    })

    render(<AppointmentList />)

    await waitFor(() => {
      expect(screen.getByText('Mathematics')).toBeInTheDocument()
    })

    // Check for proper semantic structure - there are multiple comboboxes so check for multiple
    expect(screen.getAllByRole('combobox')).toHaveLength(2) // filter and sort dropdowns
    expect(screen.getAllByRole('button').length).toBeGreaterThan(0)
  })
})