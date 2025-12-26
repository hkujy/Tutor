import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { NotificationBell } from '@/components/NotificationBell';
import { useSocketEvent } from '@/hooks/useSocket';

// Mock next-intl
jest.mock('next-intl', () => ({
    useTranslations: () => (key: string) => key,
}));

// Mock next-auth
jest.mock('next-auth/react', () => ({
    useSession: () => ({
        data: {
            user: {
                id: '1',
                email: 'test@example.com',
                role: 'STUDENT',
            },
        },
        status: 'authenticated',
    }),
}));

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

// Mock Socket.IO hooks
jest.mock('@/hooks/useSocket', () => ({
    useSocketEvent: jest.fn(),
    useSocket: jest.fn(() => ({ connected: true })),
}));

// Mock fetch
global.fetch = jest.fn();

describe('NotificationBell Component', () => {
    const mockNotifications = [
        {
            id: '1',
            type: 'APPOINTMENT_REMINDER',
            title: 'Appointment Reminder',
            message: 'Your session starts in 1 hour',
            read: false,
            createdAt: '2025-12-25T09:00:00Z',
        },
        {
            id: '2',
            type: 'PAYMENT_REMINDER',
            title: 'Payment Due',
            message: 'You have 10 unpaid hours',
            read: true,
            createdAt: '2025-12-24T10:00:00Z',
        },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        mockPush.mockClear();

        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({ notifications: mockNotifications }),
        });
    });

    describe('Rendering', () => {
        it('should render notification bell icon', () => {
            render(<NotificationBell />);

            // Should show bell icon
            const bell = screen.getByRole('button', { name: /notification/i });
            expect(bell).toBeInTheDocument();
        });

        it('should show unread count badge', async () => {
            render(<NotificationBell />);

            await waitFor(() => {
                // Should show badge with count of unread notifications
                const badge = screen.getByText('1'); // 1 unread notification
                expect(badge).toBeInTheDocument();
            });
        });

        it('should not show badge when no unread notifications', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    notifications: mockNotifications.map(n => ({ ...n, read: true })),
                }),
            });

            render(<NotificationBell />);

            await waitFor(() => {
                const badge = screen.queryByText('1');
                expect(badge).not.toBeInTheDocument();
            });
        });
    });

    describe('Popover Interaction', () => {
        it('should open popover when bell is clicked', async () => {
            render(<NotificationBell />);

            const bell = screen.getByRole('button', { name: /notification/i });
            fireEvent.click(bell);

            await waitFor(() => {
                expect(screen.getByText('Appointment Reminder')).toBeInTheDocument();
            });
        });

        it('should close popover when clicked again', async () => {
            render(<NotificationBell />);

            const bell = screen.getByRole('button', { name: /notification/i });

            // Open
            fireEvent.click(bell);
            await waitFor(() => {
                expect(screen.getByText('Appointment Reminder')).toBeInTheDocument();
            });

            // Close
            fireEvent.click(bell);
            await waitFor(() => {
                expect(screen.queryByText('Appointment Reminder')).not.toBeInTheDocument();
            });
        });

        it('should display all notifications in popover', async () => {
            render(<NotificationBell />);

            const bell = screen.getByRole('button', { name: /notification/i });
            fireEvent.click(bell);

            await waitFor(() => {
                expect(screen.getByText('Appointment Reminder')).toBeInTheDocument();
                expect(screen.getByText('Payment Due')).toBeInTheDocument();
            });
        });
    });

    describe('Mark as Read', () => {
        it('should mark notification as read when clicked', async () => {
            (global.fetch as jest.Mock)
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ notifications: mockNotifications }),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ success: true }),
                });

            render(<NotificationBell />);

            const bell = screen.getByRole('button', { name: /notification/i });
            fireEvent.click(bell);

            await waitFor(() => {
                expect(screen.getByText('Appointment Reminder')).toBeInTheDocument();
            });

            // Click on unread notification
            const notification = screen.getByText('Appointment Reminder');
            fireEvent.click(notification);

            // Should call API to mark as read
            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledWith(
                    expect.stringContaining('/api/notifications'),
                    expect.objectContaining({
                        method: 'PUT',
                    })
                );
            });
        });

        it('should update unread count after marking as read', async () => {
            (global.fetch as jest.Mock)
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ notifications: mockNotifications }),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ success: true }),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        notifications: mockNotifications.map(n => ({ ...n, read: true })),
                    }),
                });

            render(<NotificationBell />);

            await waitFor(() => {
                expect(screen.getByText('1')).toBeInTheDocument();
            });

            const bell = screen.getByRole('button', { name: /notification/i });
            fireEvent.click(bell);

            await waitFor(() => {
                const notification = screen.getByText('Appointment Reminder');
                fireEvent.click(notification);
            });

            // Badge should disappear or show 0
            await waitFor(() => {
                expect(screen.queryByText('1')).not.toBeInTheDocument();
            });
        });
    });

    describe('Real-Time Notifications', () => {
        it('should subscribe to notification:new event', () => {
            const mockUseSocketEvent = useSocketEvent as jest.Mock;

            render(<NotificationBell />);

            expect(mockUseSocketEvent).toHaveBeenCalledWith(
                'notification:new',
                expect.any(Function)
            );
        });

        it('should add new notification from socket event', async () => {
            let notificationHandler: Function;

            (useSocketEvent as jest.Mock).mockImplementation((event, handler) => {
                if (event === 'notification:new') {
                    notificationHandler = handler;
                }
            });

            render(<NotificationBell />);

            await waitFor(() => {
                expect(screen.getByText('1')).toBeInTheDocument();
            });

            // Simulate new notification via socket
            const newNotification = {
                id: '3',
                type: 'APPOINTMENT_CREATED',
                title: 'New Appointment',
                message: 'Student booked a session',
                read: false,
                createdAt: new Date().toISOString(),
            };

            if (notificationHandler!) {
                await notificationHandler(newNotification);
            }

            // Unread count should increase
            await waitFor(() => {
                expect(screen.getByText('2')).toBeInTheDocument();
            });
        });

        it('should show new notification in popover', async () => {
            let notificationHandler: Function;

            (useSocketEvent as jest.Mock).mockImplementation((event, handler) => {
                if (event === 'notification:new') {
                    notificationHandler = handler;
                }
            });

            render(<NotificationBell />);

            const bell = screen.getByRole('button', { name: /notification/i });
            fireEvent.click(bell);

            await waitFor(() => {
                expect(screen.getByText('Appointment Reminder')).toBeInTheDocument();
            });

            // Simulate new notification
            const newNotification = {
                id: '3',
                type: 'APPOINTMENT_CREATED',
                title: 'Real-Time Notification',
                message: 'This came via WebSocket',
                read: false,
                createdAt: new Date().toISOString(),
            };

            if (notificationHandler!) {
                await notificationHandler(newNotification);
            }

            // Should appear in list
            await waitFor(() => {
                expect(screen.getByText('Real-Time Notification')).toBeInTheDocument();
            });
        });
    });

    describe('Empty State', () => {
        it('should show empty state when no notifications', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ notifications: [] }),
            });

            render(<NotificationBell />);

            const bell = screen.getByRole('button', { name: /notification/i });
            fireEvent.click(bell);

            await waitFor(() => {
                const emptyText = screen.queryByText(/no notifications|empty/i);
                expect(emptyText).toBeInTheDocument();
            }, { timeout: 3000 });
        });
    });

    describe('Error Handling', () => {
        it('should handle fetch errors gracefully', async () => {
            (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

            render(<NotificationBell />);

            // Should not crash
            const bell = screen.getByRole('button', { name: /notification/i });
            expect(bell).toBeInTheDocument();
        });
    });
});
