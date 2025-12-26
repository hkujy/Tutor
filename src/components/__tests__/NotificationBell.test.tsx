import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NotificationBell } from '../NotificationBell';

// Mock fetch globally
global.fetch = jest.fn();

// Mock next/navigation
const mockPush = jest.fn();
const mockParams = { locale: 'en' };

jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
        replace: jest.fn(),
        prefetch: jest.fn(),
    }),
    useParams: () => mockParams,
}));

describe('NotificationBell', () => {
    beforeEach(() => {
        (fetch as jest.Mock).mockClear();
        mockPush.mockClear();
    });

    it('should render notification bell button', () => {
        render(<NotificationBell />);
        const button = screen.getByRole('button', { name: /notifications/i });
        expect(button).toBeInTheDocument();
    });

    it('should show unread count badge when there are unread notifications', async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                notifications: [
                    {
                        id: '1',
                        title: 'Test Notification',
                        message: 'Test message',
                        type: 'APPOINTMENT_BOOKED',
                        readAt: null,
                        createdAt: new Date().toISOString(),
                    },
                ],
            }),
        });

        render(<NotificationBell />);

        await waitFor(() => {
            expect(screen.getByText('1')).toBeInTheDocument();
        });
    });

    it('should not show badge when all notifications are read', async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                notifications: [
                    {
                        id: '1',
                        title: 'Test',
                        message: 'Test',
                        type: 'APPOINTMENT_BOOKED',
                        readAt: new Date().toISOString(),
                        createdAt: new Date().toISOString(),
                    },
                ],
            }),
        });

        render(<NotificationBell />);

        await waitFor(() => {
            expect(screen.queryByText('1')).not.toBeInTheDocument();
        });
    });

    it('should open popover on button click', async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ notifications: [] }),
        });

        render(<NotificationBell />);

        const button = screen.getByRole('button', { name: /notifications/i });
        fireEvent.click(button);

        await waitFor(() => {
            expect(screen.getByText(/no notifications/i)).toBeInTheDocument();
        });
    });

    it('should display notification list', async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                notifications: [
                    {
                        id: '1',
                        title: 'Appointment Booked',
                        message: 'Your session is confirmed',
                        type: 'APPOINTMENT_BOOKED',
                        readAt: null,
                        createdAt: new Date().toISOString(),
                    },
                    {
                        id: '2',
                        title: 'Assignment Due',
                        message: 'Math assignment due tomorrow',
                        type: 'ASSIGNMENT_DUE',
                        readAt: null,
                        createdAt: new Date().toISOString(),
                    },
                ],
            }),
        });

        render(<NotificationBell />);

        const button = screen.getByRole('button', { name: /notifications/i });
        fireEvent.click(button);

        await waitFor(() => {
            expect(screen.getByText('Appointment Booked')).toBeInTheDocument();
            expect(screen.getByText('Assignment Due')).toBeInTheDocument();
        });
    });

    it('should mark notification as read on click', async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    notifications: [
                        {
                            id: '1',
                            title: 'Test',
                            message: 'Test message',
                            type: 'APPOINTMENT_BOOKED',
                            readAt: null,
                            createdAt: new Date().toISOString(),
                        },
                    ],
                }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true }),
            });

        render(<NotificationBell />);

        const button = screen.getByRole('button', { name: /notifications/i });
        fireEvent.click(button);

        await waitFor(() => {
            const notification = screen.getByText('Test');
            fireEvent.click(notification.closest('button')!);
        });

        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/notifications/1/read'),
            expect.objectContaining({ method: 'POST' })
        );
    });

    it('should handle fetch errors gracefully', async () => {
        (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

        render(<NotificationBell />);

        // Should not crash, just show empty state
        await waitFor(() => {
            expect(screen.getByRole('button')).toBeInTheDocument();
        });
    });
});
