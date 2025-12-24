import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// Polyfills for Node.js environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
        prefetch: jest.fn(),
        back: jest.fn(),
        forward: jest.fn(),
        refresh: jest.fn(),
    }),
    usePathname: () => '/en',
    useSearchParams: () => new URLSearchParams(),
    useParams: () => ({ locale: 'en' }),
}));

// Mock next-auth
jest.mock('next-auth/react', () => ({
    useSession: () => ({
        data: {
            user: {
                id: 'test-user-id',
                email: 'test@example.com',
                role: 'STUDENT',
            },
        },
        status: 'authenticated',
    }),
    signIn: jest.fn(),
    signOut: jest.fn(),
}));

// Mock fetch globally
global.fetch = jest.fn();

// Clean up after each test
afterEach(() => {
    jest.clearAllMocks();
});
