'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { initSocketClient, disconnectSocket, getSocketClient, isSocketConnected } from '@/lib/socket/socket-client';
import type { Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '@/lib/socket/socket-events';

interface SocketContextValue {
    socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
    connected: boolean;
}

const SocketContext = createContext<SocketContextValue>({
    socket: null,
    connected: false,
});

export function useSocketContext() {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocketContext must be used within SocketProvider');
    }
    return context;
}

interface SocketProviderProps {
    children: React.ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
    const { data: session, status } = useSession();
    const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        // Only initialize socket when user is authenticated
        if (status !== 'authenticated' || !session?.user?.id) {
            return;
        }

        try {
            const socketInstance = initSocketClient({
                userId: session.user.id,
                userRole: session.user.role as 'tutor' | 'student',
                token: session.user.id, // In production, use actual JWT token
            });

            setSocket(socketInstance);

            // Connection event handlers
            const handleConnect = () => {
                console.log('Socket connected');
                setConnected(true);
            };

            const handleDisconnect = (reason: string) => {
                console.log('Socket disconnected:', reason);
                setConnected(false);
            };

            const handleConnectError = (error: Error) => {
                console.error('Socket connection error:', error);
                setConnected(false);
            };

            socketInstance.on('connect', handleConnect);
            socketInstance.on('disconnect', handleDisconnect);
            socketInstance.on('connect_error', handleConnectError);

            // Set initial connection state
            setConnected(socketInstance.connected);

            // Cleanup on unmount or session change
            return () => {
                socketInstance.off('connect', handleConnect);
                socketInstance.off('disconnect', handleDisconnect);
                socketInstance.off('connect_error', handleConnectError);
                disconnectSocket();
                setSocket(null);
                setConnected(false);
            };
        } catch (error) {
            console.error('Failed to initialize socket:', error);
        }
    }, [session?.user?.id, session?.user?.role, status]);

    return (
        <SocketContext.Provider value={{ socket, connected }}>
            {children}
        </SocketContext.Provider>
    );
}
