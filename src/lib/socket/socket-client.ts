import { io, Socket } from 'socket.io-client';
import type {
    ServerToClientEvents,
    ClientToServerEvents,
} from './socket-events';

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

interface SocketClientOptions {
    userId: string;
    userRole: 'tutor' | 'student';
    token: string;
}

export function initSocketClient(options: SocketClientOptions) {
    if (socket?.connected) {
        console.log('Socket already connected');
        return socket;
    }

    const url = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin;

    socket = io(url, {
        path: '/api/socket',
        auth: {
            token: options.token,
            userId: options.userId,
            userRole: options.userRole,
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
    });

    // Connection event handlers
    socket.on('connect', () => {
        console.log('Socket connected:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message);
    });

    // Type assertion needed for Socket.IO reserved events
    (socket as any).on('reconnect', (attemptNumber: number) => {
        console.log('Socket reconnected after', attemptNumber, 'attempts');
    });

    (socket as any).on('reconnect_error', (error: Error) => {
        console.error('Socket reconnection error:', error.message);
    });

    (socket as any).on('reconnect_failed', () => {
        console.error('Socket reconnection failed');
    });

    return socket;
}

export function getSocketClient() {
    if (!socket) {
        throw new Error('Socket client not initialized. Call initSocketClient first.');
    }
    return socket;
}

export function disconnectSocket() {
    if (socket) {
        socket.disconnect();
        socket = null;
        console.log('Socket disconnected');
    }
}

export function isSocketConnected() {
    return socket?.connected || false;
}

// Helper to emit events
export function emitEvent<K extends keyof ClientToServerEvents>(
    event: K,
    ...args: Parameters<ClientToServerEvents[K]>
) {
    if (!socket) {
        console.warn('Socket not initialized, cannot emit event');
        return;
    }

    socket.emit(event, ...args);
}

// Helper to listen to events
export function onEvent<K extends keyof ServerToClientEvents>(
    event: K,
    handler: ServerToClientEvents[K]
) {
    if (!socket) {
        console.warn('Socket not initialized, cannot listen to event');
        return () => { };
    }

    // Type assertion needed for Socket.IO event handlers
    (socket as any).on(event, handler);

    // Return cleanup function
    return () => {
        (socket as any).off(event, handler);
    };
}
