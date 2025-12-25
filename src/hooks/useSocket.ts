'use client';

import { useEffect, useState, useCallback } from 'react';
import { getSocketClient, initSocketClient, disconnectSocket, isSocketConnected } from '@/lib/socket/socket-client';
import type { ServerToClientEvents } from '@/lib/socket/socket-events';
import { useSession } from 'next-auth/react';

export function useSocket() {
    const { data: session } = useSession();
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        if (!session?.user?.id) {
            return;
        }

        // Initialize socket with user credentials
        const socket = initSocketClient({
            userId: session.user.id,
            userRole: session.user.role as 'tutor' | 'student',
            token: session.user.id, // In production, use actual JWT token
        });

        // Update connection status
        const handleConnect = () => setConnected(true);
        const handleDisconnect = () => setConnected(false);

        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);

        // Set initial state
        setConnected(socket.connected);

        return () => {
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
        };
    }, [session?.user?.id, session?.user?.role]);

    return {
        socket: isSocketConnected() ? getSocketClient() : null,
        connected,
    };
}

export function useSocketEvent<K extends keyof ServerToClientEvents>(
    event: K,
    handler: ServerToClientEvents[K]
) {
    const { socket, connected } = useSocket();

    useEffect(() => {
        if (!socket || !connected) {
            return;
        }

        // Type assertion needed for Socket.IO event handlers
        (socket as any).on(event, handler);

        return () => {
            (socket as any).off(event, handler);
        };
    }, [socket, connected, event, handler]);
}

export function useSocketConnection() {
    const { connected } = useSocket();
    const [reconnecting, setReconnecting] = useState(false);

    useEffect(() => {
        if (!isSocketConnected()) {
            return;
        }

        const socket = getSocketClient();

        const handleReconnecting = () => setReconnecting(true);
        const handleReconnect = () => setReconnecting(false);
        const handleReconnectFailed = () => setReconnecting(false);

        // Type assertion needed for Socket.IO reserved events
        (socket as any).on('reconnect_attempt', handleReconnecting);
        (socket as any).on('reconnect', handleReconnect);
        (socket as any).on('reconnect_failed', handleReconnectFailed);

        return () => {
            (socket as any).off('reconnect_attempt', handleReconnecting);
            (socket as any).off('reconnect', handleReconnect);
            (socket as any).off('reconnect_failed', handleReconnectFailed);
        };
    }, []);

    return {
        connected,
        reconnecting,
    };
}
