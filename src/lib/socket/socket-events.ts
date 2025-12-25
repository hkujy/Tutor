// Socket.IO Event Types and Payloads

export interface ServerToClientEvents {
    // Appointment events
    'appointment:created': (data: AppointmentEventData) => void;
    'appointment:updated': (data: AppointmentEventData) => void;
    'appointment:cancelled': (data: AppointmentEventData) => void;

    // Notification events
    'notification:new': (data: NotificationEventData) => void;

    // Availability events
    'availability:updated': (data: AvailabilityEventData) => void;

    // Connection events
    'connection:acknowledged': (data: { userId: string; timestamp: number }) => void;
}

export interface ClientToServerEvents {
    // Join user-specific room
    'room:join': (userId: string) => void;
    'room:leave': (userId: string) => void;

    // Ping for connection health
    'ping': () => void;
}

export interface InterServerEvents {
    ping: () => void;
}

export interface SocketData {
    userId: string;
    userRole: 'tutor' | 'student';
}

// Event payload interfaces
export interface AppointmentEventData {
    id: string;
    tutorId: string;
    studentId: string;
    startTime: string;
    endTime: string;
    subject: string;
    status: string;
    updatedBy: string;
    timestamp: number;
}

export interface NotificationEventData {
    id: string;
    userId: string;
    type: string;
    title: string;
    message: string;
    read: boolean;
    createdAt: string;
}

export interface AvailabilityEventData {
    tutorId: string;
    slots: Array<{
        id: string;
        dayOfWeek: string;
        startTime: string;
        endTime: string;
        isAvailable: boolean;
    }>;
    timestamp: number;
}

// Event names as constants
export const SOCKET_EVENTS = {
    // Appointment events
    APPOINTMENT_CREATED: 'appointment:created',
    APPOINTMENT_UPDATED: 'appointment:updated',
    APPOINTMENT_CANCELLED: 'appointment:cancelled',

    // Notification events
    NOTIFICATION_NEW: 'notification:new',

    // Availability events
    AVAILABILITY_UPDATED: 'availability:updated',

    // Room events
    ROOM_JOIN: 'room:join',
    ROOM_LEAVE: 'room:leave',

    // Connection events
    CONNECTION_ACKNOWLEDGED: 'connection:acknowledged',
    PING: 'ping',
} as const;
