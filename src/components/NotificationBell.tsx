'use client';

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { useRouter, useParams } from 'next/navigation';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: string;
    readAt: Date | null;
    createdAt: Date;
}

export function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const router = useRouter();
    const params = useParams();
    const locale = params?.locale || 'en';

    const unreadCount = notifications.filter((n) => !n.readAt).length;

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const response = await fetch('/api/notifications?limit=10');
            if (response.ok) {
                const data = await response.json();
                setNotifications(data.notifications || []);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            const response = await fetch(`/api/notifications/${id}/read`, {
                method: 'POST',
            });

            if (response.ok) {
                setNotifications((prev) =>
                    prev.map((n) => (n.id === id ? { ...n, readAt: new Date() } : n))
                );
            }
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const response = await fetch('/api/notifications/bulk-mark-read', {
                method: 'POST',
            });

            if (response.ok) {
                setNotifications((prev) =>
                    prev.map((n) => ({ ...n, readAt: new Date() }))
                );
                toast.success('All notifications marked as read');
            }
        } catch (error) {
            console.error('Failed to mark all as read:', error);
            toast.error('Failed to mark all as read');
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'APPOINTMENT_REMINDER':
            case 'APPOINTMENT_BOOKED':
            case 'CONFIRMATION':
                return '📅';
            case 'APPOINTMENT_CANCELLED':
                return '❌';
            case 'ASSIGNMENT_DUE':
                return '📝';
            case 'ASSIGNMENT_GRADED':
                return '✅';
            case 'PAYMENT_REMINDER':
            case 'PAYMENT_RECEIVED':
                return '💳';
            default:
                return '🔔';
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative"
                    aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
                >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>

            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="font-semibold">Notifications</h3>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={markAllAsRead}
                            className="text-xs"
                        >
                            Mark all as read
                        </Button>
                    )}
                </div>

                <ScrollArea className="h-[400px]">
                    {loading ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            Loading notifications...
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="p-8 text-center">
                            <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">
                                No notifications yet
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.map((notification) => (
                                <button
                                    key={notification.id}
                                    onClick={() => {
                                        if (!notification.readAt) {
                                            markAsRead(notification.id);
                                        }
                                    }}
                                    className={`w-full p-4 text-left hover:bg-muted/50 transition-colors ${!notification.readAt ? 'bg-muted/30' : ''
                                        }`}
                                >
                                    <div className="flex gap-3">
                                        <span className="text-2xl flex-shrink-0">
                                            {getNotificationIcon(notification.type)}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="font-medium text-sm line-clamp-1">
                                                    {notification.title}
                                                </p>
                                                {!notification.readAt && (
                                                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                                {notification.message}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-2">
                                                {formatDistanceToNow(new Date(notification.createdAt), {
                                                    addSuffix: true,
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                {notifications.length > 0 && (
                    <div className="p-2 border-t">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full"
                            onClick={() => {
                                setOpen(false);
                                router.push(`/${locale}/notifications`);
                            }}
                        >
                            View all notifications
                        </Button>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}
