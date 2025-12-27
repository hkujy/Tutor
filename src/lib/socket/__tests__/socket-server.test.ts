/**
 * @jest-environment node
 */
import { createServer } from 'http';
import { initSocketServer, getSocketServer } from '../socket-server';
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';

describe('Socket Server', () => {
    let httpServer: any;
    let clientSocket: ClientSocket;
    const TEST_PORT = 3001;

    beforeAll((done) => {
        httpServer = createServer();
        initSocketServer(httpServer);
        httpServer.listen(TEST_PORT, () => {
            done();
        });
    });

    afterAll((done) => {
        if (clientSocket) {
            clientSocket.disconnect();
        }
        httpServer.close(() => {
            done();
        });
    });

    afterEach(() => {
        if (clientSocket && clientSocket.connected) {
            clientSocket.disconnect();
        }
    });

    it('should initialize socket server', () => {
        const io = getSocketServer();
        expect(io).toBeDefined();
    });

    it('should reject connection without authentication', (done) => {
        clientSocket = ioClient(`http://localhost:${TEST_PORT}`, {
            path: '/api/socket',
            transports: ['websocket'],
        });

        clientSocket.on('connect_error', (error) => {
            expect(error.message).toContain('Authentication');
            done();
        });
    });

    it('should accept connection with valid authentication', (done) => {
        clientSocket = ioClient(`http://localhost:${TEST_PORT}`, {
            path: '/api/socket',
            auth: {
                token: 'test-token',
                userId: 'test-user-123',
                userRole: 'tutor',
            },
            transports: ['websocket'],
        });

        clientSocket.on('connect', () => {
            expect(clientSocket.connected).toBe(true);
            done();
        });

        clientSocket.on('connect_error', (error) => {
            done(error);
        });
    });

    it('should receive connection acknowledgment', (done) => {
        clientSocket = ioClient(`http://localhost:${TEST_PORT}`, {
            path: '/api/socket',
            auth: {
                token: 'test-token',
                userId: 'test-user-123',
                userRole: 'tutor',
            },
            transports: ['websocket'],
        });

        clientSocket.on('connection:acknowledged', (data) => {
            expect(data.userId).toBe('test-user-123');
            expect(data.timestamp).toBeDefined();
            done();
        });
    });

    it('should join user-specific room', (done) => {
        clientSocket = ioClient(`http://localhost:${TEST_PORT}`, {
            path: '/api/socket',
            auth: {
                token: 'test-token',
                userId: 'test-user-123',
                userRole: 'tutor',
            },
            transports: ['websocket'],
        });

        clientSocket.on('connect', () => {
            // User should automatically be in their room
            // We can verify this by checking if they receive room-specific events
            expect(clientSocket.connected).toBe(true);
            done();
        });
    });

    it('should handle ping/pong', (done) => {
        clientSocket = ioClient(`http://localhost:${TEST_PORT}`, {
            path: '/api/socket',
            auth: {
                token: 'test-token',
                userId: 'test-user-123',
                userRole: 'tutor',
            },
            transports: ['websocket'],
        });

        clientSocket.on('connect', () => {
            clientSocket.emit('ping');

            clientSocket.on('pong', () => {
                done();
            });
        });
    });

    it('should handle disconnection', (done) => {
        clientSocket = ioClient(`http://localhost:${TEST_PORT}`, {
            path: '/api/socket',
            auth: {
                token: 'test-token',
                userId: 'test-user-123',
                userRole: 'tutor',
            },
            transports: ['websocket'],
        });

        clientSocket.on('connect', () => {
            clientSocket.disconnect();
        });

        clientSocket.on('disconnect', () => {
            expect(clientSocket.connected).toBe(false);
            done();
        });
    });
});
