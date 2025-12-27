import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AppointmentManagement from '@/components/calendar/AppointmentManagement';
import { useSocketEvent } from '@/hooks/useSocket';

// Mock next-intl
// Mock next-intl (removed - using global in jest.setup.ts)

// Mock Socket.IO hooks
jest.mock('@/hooks/useSocket', () => ({
    useSocketEvent: jest.fn(),
    useSocket: jest.fn(() => ({ connected: true })),
    useSocketConnection: jest.fn(() => ({ connected: true, error: null })),
}));

// Mock fetch
global.fetch = jest.fn();

describe('AppointmentManagement Component', () => {
    const mockAppointments = [
        {
            id: '1',
            startTime: '2025-12-30T14:00:00Z',
            endTime: '2025-12-30T15:00:00Z',
            subject: 'Mathematics',
            status: 'SCHEDULED' as const,
            notes: 'Test notes',
            tutor: {
                user: {
                    firstName: 'John',
                    lastName: 'Smith',
                    email: 'john@example.com',
                },
            },
            student: {
                user: {
                    firstName: 'Jane',
                    lastName: 'Doe',
                    email: 'jane@example.com',
                },
            },
        },
        {
            id: '2',
            startTime: '2025-12-31T10:00:00Z',
            endTime: '2025-12-31T11:00:00Z',
            subject: 'Physics',
            status: 'COMPLETED' as const,
            tutor: {
                user: {
                    firstName: 'John',
                    lastName: 'Smith',
                    email: 'john@example.com',
                },
            },
            student: {
                user: {
                    firstName: 'Jane',
                    lastName: 'Doe',
                    email: 'jane@example.com',
                },
            },
        },
    ];

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock successful fetch response
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({ appointments: mockAppointments }),
        });
    });

    describe('Rendering', () => {
        it('should render loading state initially', () => {
            const { container } = render(<AppointmentManagement userRole="student" userId="1" />);

            // Should show loading spinner
            expect(container.getElementsByClassName('animate-spin').length).toBeGreaterThan(0);
        });

        it('should render appointments after loading', async () => {
            render(<AppointmentManagement userRole="student" userId="1" />);

            // Wait for appointments to load
            await waitFor(() => {
                expect(screen.getByText('Mathematics')).toBeInTheDocument();
            });

            expect(screen.getByText('Physics')).toBeInTheDocument();
        });

        it('should display tutor name for student view', async () => {
            render(<AppointmentManagement userRole="student" userId="1" />);

            await waitFor(() => {
                const names = screen.getAllByText(/John Smith/);
                expect(names.length).toBeGreaterThan(0);
            });
        });

        it('should display student name for tutor view', async () => {
            render(<AppointmentManagement userRole="tutor" userId="1" />);

            await waitFor(() => {
                const names = screen.getAllByText(/Jane Doe/);
                expect(names.length).toBeGreaterThan(0);
            });
        });
    });

    describe('Filtering', () => {
        it('should filter appointments by status', async () => {
            render(<AppointmentManagement userRole="student" userId="1" />);

            await waitFor(() => {
                expect(screen.getByText('Mathematics')).toBeInTheDocument();
            });

            // Find and change status filter using display value (default is 'filters.status.all')
            const statusFilter = screen.getByDisplayValue('filters.status.all');
            fireEvent.change(statusFilter, { target: { value: 'COMPLETED' } });

            // Should only show completed appointments
            await waitFor(() => {
                expect(screen.queryByText('Mathematics')).not.toBeInTheDocument();
                expect(screen.getByText('Physics')).toBeInTheDocument();
            });
        });

        it('should filter appointments by time', async () => {
            render(<AppointmentManagement userRole="student" userId="1" />);

            await waitFor(() => {
                expect(screen.getByText('Mathematics')).toBeInTheDocument();
            });

            // Find time filter (default is 'filters.time.upcoming')
            const timeFilter = screen.getByDisplayValue('filters.time.upcoming');
            fireEvent.change(timeFilter, { target: { value: 'upcoming' } });

            // Should update the list
            await waitFor(() => {
                const elements = screen.getAllByText(/Mathematics|Physics/);
                expect(elements.length).toBeGreaterThan(0);
            });
        });
    });

    describe('Sorting', () => {
        it('should sort appointments by date', async () => {
            render(<AppointmentManagement userRole="student" userId="1" />);

            await waitFor(() => {
                expect(screen.getByText('Mathematics')).toBeInTheDocument();
            });

            // Default sort is 'sort.date'
            const sortSelect = screen.getByDisplayValue('sort.date');
            fireEvent.change(sortSelect, { target: { value: 'date' } });

            // Appointments should be sorted
            expect(screen.getByText('Mathematics')).toBeInTheDocument();
        });

        it('should sort appointments by subject', async () => {
            render(<AppointmentManagement userRole="student" userId="1" />);

            await waitFor(() => {
                expect(screen.getByText('Mathematics')).toBeInTheDocument();
            });

            const sortSelect = screen.getByDisplayValue('sort.date');
            fireEvent.change(sortSelect, { target: { value: 'subject' } });

            expect(screen.getByText('Mathematics')).toBeInTheDocument();
        });
    });

    describe('View Mode', () => {
        it('should toggle between list and grid view', async () => {
            render(<AppointmentManagement userRole="student" userId="1" />);

            await waitFor(() => {
                expect(screen.getByText('Mathematics')).toBeInTheDocument();
            });

            // Find grid view button by key
            const gridButton = screen.getByText('view.grid');
            fireEvent.click(gridButton);

            // Should switch to grid view (check for grid class or layout change)
            // Button usually highlights
            expect(gridButton.className).toMatch(/bg-indigo/);
        });
    });

    // ... (skipping unchanged parts)

    describe('Empty State', () => {
        it('should show empty state when no appointments', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ appointments: [] }),
            });

            render(<AppointmentManagement userRole="student" userId="1" />);

            await waitFor(() => {
                const emptyElements = screen.getAllByText('empty.title');
                expect(emptyElements.length).toBeGreaterThan(0);
            });
        });
    });

    describe('Error Handling', () => {
        it('should handle fetch errors gracefully', async () => {
            (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

            render(<AppointmentManagement userRole="student" userId="1" />);

            // Should not crash, should show empty state or error
            await waitFor(() => {
                expect(screen.queryByText('Mathematics')).not.toBeInTheDocument();
            });
        });
    });
});
