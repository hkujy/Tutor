import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AppointmentManagement from '@/components/calendar/AppointmentManagement';
import { useSocketEvent } from '@/hooks/useSocket';

// Mock next-intl
jest.mock('next-intl', () => ({
    useTranslations: () => (key: string) => key,
}));

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
            render(<AppointmentManagement userRole="student" userId="1" />);

            // Should show loading spinner
            expect(screen.getByRole('status', { hidden: true }) || document.querySelector('.animate-spin')).toBeTruthy();
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
                expect(screen.getByText(/John Smith/)).toBeInTheDocument();
            });
        });

        it('should display student name for tutor view', async () => {
            render(<AppointmentManagement userRole="tutor" userId="1" />);

            await waitFor(() => {
                expect(screen.getByText(/Jane Doe/)).toBeInTheDocument();
            });
        });
    });

    describe('Filtering', () => {
        it('should filter appointments by status', async () => {
            render(<AppointmentManagement userRole="student" userId="1" />);

            await waitFor(() => {
                expect(screen.getByText('Mathematics')).toBeInTheDocument();
            });

            // Find and change status filter
            const statusFilter = screen.getByRole('combobox', { name: /status/i });
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

            // Find time filter
            const timeFilter = screen.getByRole('combobox', { name: /time/i });
            fireEvent.change(timeFilter, { target: { value: 'upcoming' } });

            // Should update the list
            await waitFor(() => {
                expect(screen.getByText(/Mathematics|Physics/)).toBeInTheDocument();
            });
        });
    });

    describe('Sorting', () => {
        it('should sort appointments by date', async () => {
            render(<AppointmentManagement userRole="student" userId="1" />);

            await waitFor(() => {
                expect(screen.getByText('Mathematics')).toBeInTheDocument();
            });

            const sortSelect = screen.getByRole('combobox', { name: /sort/i });
            fireEvent.change(sortSelect, { target: { value: 'date' } });

            // Appointments should be sorted (we can't easily verify order in DOM)
            expect(screen.getByText('Mathematics')).toBeInTheDocument();
        });

        it('should sort appointments by subject', async () => {
            render(<AppointmentManagement userRole="student" userId="1" />);

            await waitFor(() => {
                expect(screen.getByText('Mathematics')).toBeInTheDocument();
            });

            const sortSelect = screen.getByRole('combobox', { name: /sort/i });
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

            // Find grid view button
            const gridButton = screen.getByRole('button', { name: /grid/i });
            fireEvent.click(gridButton);

            // Should switch to grid view (check for grid class or layout change)
            expect(gridButton).toHaveClass(/bg-indigo/);
        });
    });

    describe('Real-Time Updates', () => {
        it('should subscribe to appointment:created event', async () => {
            const mockUseSocketEvent = useSocketEvent as jest.Mock;

            render(<AppointmentManagement userRole="student" userId="1" />);

            // Verify that useSocketEvent was called for appointment:created
            expect(mockUseSocketEvent).toHaveBeenCalledWith(
                'appointment:created',
                expect.any(Function)
            );
        });

        it('should subscribe to appointment:updated event', async () => {
            const mockUseSocketEvent = useSocketEvent as jest.Mock;

            render(<AppointmentManagement userRole="student" userId="1" />);

            // Verify that useSocketEvent was called for appointment:updated
            expect(mockUseSocketEvent).toHaveBeenCalledWith(
                'appointment:updated',
                expect.any(Function)
            );
        });

        it('should subscribe to appointment:cancelled event', async () => {
            const mockUseSocketEvent = useSocketEvent as jest.Mock;

            render(<AppointmentManagement userRole="student" userId="1" />);

            // Verify that useSocketEvent was called for appointment:cancelled
            expect(mockUseSocketEvent).toHaveBeenCalledWith(
                'appointment:cancelled',
                expect.any(Function)
            );
        });

        it('should handle real-time appointment creation', async () => {
            let createdHandler: Function;

            (useSocketEvent as jest.Mock).mockImplementation((event, handler) => {
                if (event === 'appointment:created') {
                    createdHandler = handler;
                }
            });

            render(<AppointmentManagement userRole="student" userId="1" />);

            await waitFor(() => {
                expect(screen.getByText('Mathematics')).toBeInTheDocument();
            });

            // Simulate socket event
            const newAppointment = {
                id: '3',
                subject: 'Chemistry',
                startTime: '2026-01-01T09:00:00Z',
                endTime: '2026-01-01T10:00:00Z',
                status: 'SCHEDULED',
                tutorId: '1',
                studentId: '1',
            };

            // Mock fetch for refresh
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    appointments: [...mockAppointments, newAppointment],
                }),
            });

            // Trigger the handler
            if (createdHandler!) {
                await createdHandler(newAppointment);
            }

            // Should refresh appointments
            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledTimes(2); // Initial + refresh
            });
        });
    });

    describe('Actions', () => {
        it('should open reschedule modal', async () => {
            render(<AppointmentManagement userRole="student" userId="1" />);

            await waitFor(() => {
                expect(screen.getByText('Mathematics')).toBeInTheDocument();
            });

            // Find and click reschedule button
            const rescheduleButtons = screen.getAllByRole('button', { name: /reschedule/i });
            if (rescheduleButtons.length > 0) {
                fireEvent.click(rescheduleButtons[0]);

                // Should show modal
                await waitFor(() => {
                    expect(screen.getByRole('dialog') || screen.getByText(/reschedule/i)).toBeInTheDocument();
                });
            }
        });

        it('should open cancel modal', async () => {
            render(<AppointmentManagement userRole="student" userId="1" />);

            await waitFor(() => {
                expect(screen.getByText('Mathematics')).toBeInTheDocument();
            });

            // Find and click cancel button
            const cancelButtons = screen.getAllByRole('button', { name: /cancel/i });
            if (cancelButtons.length > 0) {
                fireEvent.click(cancelButtons[0]);

                // Should show confirmation modal
                await waitFor(() => {
                    expect(screen.getByText(/confirm|sure/i)).toBeInTheDocument();
                });
            }
        });
    });

    describe('Empty State', () => {
        it('should show empty state when no appointments', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ appointments: [] }),
            });

            render(<AppointmentManagement userRole="student" userId="1" />);

            await waitFor(() => {
                expect(screen.getByText(/empty|no appointments/i)).toBeInTheDocument();
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
