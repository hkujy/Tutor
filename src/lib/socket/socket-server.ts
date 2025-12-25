import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import type {
    ServerToClientEvents,
    ClientToServerEvents,
    InterServerEvents,
    SocketData,
} from './socket-events';
import { SOCKET_EVENTS } from './socket-events';

let io: SocketIOServer<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
> | null = null;

export function initSocketServer(httpServer: HTTPServer) {
    if (io) {
        console.log('Socket.IO server already initialized');
        return io;
    }

    io = new SocketIOServer<
        ClientToServerEvents,
        ServerToClientEvents,
        InterServerEvents,
        SocketData
    >(httpServer, {
        cors: {
            origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
            credentials: true,
        },
        path: '/api/socket',
        transports: ['websocket', 'polling'],
    });

    // Authentication middleware
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;

            if (!token) {
                return next(new Error('Authentication token required'));
            }

            // Verify token and get session
            // Note: In production, you'd verify the JWT token here
            // For now, we'll accept the token and extract userId from it
            const userId = socket.handshake.auth.userId;
            const userRole = socket.handshake.auth.userRole;

            if (!userId || !userRole) {
                return next(new Error('Invalid authentication data'));
            }

            socket.data.userId = userId;
            socket.data.userRole = userRole;

            next();
        } catch (error) {
            console.error('Socket authentication error:', error);
            next(new Error('Authentication failed'));
        }
    });

    // Connection handler
    io.on('connection', (socket) => {
        const userId = socket.data.userId;
        const userRole = socket.data.userRole;

        console.log(`User connected: ${userId} (${userRole})`);

        // Join user-specific room
        socket.join(`user:${userId}`);

        // Send acknowledgment
        socket.emit(SOCKET_EVENTS.CONNECTION_ACKNOWLEDGED, {
            userId,
            timestamp: Date.now(),
        });

        // Handle room join requests
        socket.on(SOCKET_EVENTS.ROOM_JOIN, (roomId: string) => {
            socket.join(roomId);
            console.log(`User ${userId} joined room: ${roomId}`);
        });

        // Handle room leave requests
        socket.on(SOCKET_EVENTS.ROOM_LEAVE, (roomId: string) => {
            socket.leave(roomId);
            console.log(`User ${userId} left room: ${roomId}`);
        });

        // Handle ping for connection health
        socket.on(SOCKET_EVENTS.PING, () => {
            (socket as any).emit('pong');
        });

        // Handle disconnection
        socket.on('disconnect', (reason) => {
            console.log(`User disconnected: ${userId}, reason: ${reason}`);
        });
    });

    console.log('Socket.IO server initialized');
    return io;
}

export function getSocketServer() {
    if (!io) {
        throw new Error('Socket.IO server not initialized. Call initSocketServer first.');
    }
    return io;
}

// Helper function to emit events to specific users
export function emitToUser(userId: string, event: string, data: any) {
    if (!io) {
        console.warn('Socket.IO server not initialized, cannot emit event');
        return;
    }

    (io as any).to(`user:${userId}`).emit(event, data);
}

// Helper function to emit events to multiple users
export function emitToUsers(userIds: string[], event: string, data: any) {
    if (!io) {
        console.warn('Socket.IO server not initialized, cannot emit event');
        return;
    }

    userIds.forEach(userId => {
        (io as any).to(`user:${userId}`).emit(event, data);
    });
}

// Helper function to broadcast to all connected clients
export function broadcastEvent(event: string, data: any) {
    if (!io) {
        console.warn('Socket.IO server not initialized, cannot broadcast event');
        return;
    }

    (io as any).emit(event, data);
}
