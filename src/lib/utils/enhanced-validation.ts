import { z } from 'zod';

/**
 * Enhanced password validation requirements
 * Implements strong password policy for security
 */
export const PASSWORD_REQUIREMENTS = {
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
} as const;

/**
 * Common weak passwords to prevent
 */
const COMMON_PASSWORDS = new Set([
    'password',
    'password123',
    '123456789',
    'qwerty',
    'abc123',
    'letmein',
    'welcome',
    'monkey',
    'dragon',
    'master',
    'admin',
    'admin123',
    'password123!',
]);

/**
 * Enhanced password validation schema
 */
export const passwordSchema = z
    .string()
    .min(PASSWORD_REQUIREMENTS.minLength, {
        message: `Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters`,
    })
    .refine((password) => /[A-Z]/.test(password), {
        message: 'Password must contain at least one uppercase letter',
    })
    .refine((password) => /[a-z]/.test(password), {
        message: 'Password must contain at least one lowercase letter',
    })
    .refine((password) => /[0-9]/.test(password), {
        message: 'Password must contain at least one number',
    })
    .refine((password) => /[^A-Za-z0-9]/.test(password), {
        message: 'Password must contain at least one special character',
    })
    .refine((password) => !COMMON_PASSWORDS.has(password.toLowerCase()), {
        message: 'This password is too common. Please choose a stronger password',
    })
    .refine((password) => !/(.)\1{2,}/.test(password), {
        message: 'Password cannot contain repeated characters (e.g., "aaa")',
    });

/**
 * Validate password strength
 */
export function validatePassword(password: string): {
    valid: boolean;
    errors: string[];
    strength: 'weak' | 'medium' | 'strong';
} {
    const result = passwordSchema.safeParse(password);

    if (!result.success) {
        return {
            valid: false,
            errors: result.error.errors.map((e) => e.message),
            strength: 'weak',
        };
    }

    // Calculate strength score
    let score = 0;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    if (password.length >= 20) score += 1;

    const strength = score >= 5 ? 'strong' : score >= 4 ? 'medium' : 'weak';

    return {
        valid: true,
        errors: [],
        strength,
    };
}

/**
 * Enhanced email validation
 */
export const emailSchema = z
    .string()
    .email({ message: 'Invalid email address' })
    .min(5, { message: 'Email is too short' })
    .max(255, { message: 'Email is too long' })
    .refine((email) => {
        // Additional validation: no consecutive dots
        return !/\.\./.test(email);
    }, {
        message: 'Email cannot contain consecutive dots',
    })
    .refine((email) => {
        // Additional validation: valid domain
        const domain = email.split('@')[1];
        return domain && domain.includes('.');
    }, {
        message: 'Email must have a valid domain',
    });

/**
 * Phone number validation (international format)
 */
export const phoneSchema = z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, {
        message: 'Invalid phone number format. Use international format (e.g., +1234567890)',
    })
    .optional();

/**
 * Name validation (prevents special characters and numbers)
 */
export const nameSchema = z
    .string()
    .min(1, { message: 'Name is required' })
    .max(100, { message: 'Name is too long' })
    .regex(/^[a-zA-Z\s'-]+$/, {
        message: 'Name can only contain letters, spaces, hyphens, and apostrophes',
    });

/**
 * URL validation
 */
export const urlSchema = z
    .string()
    .url({ message: 'Invalid URL format' })
    .refine((url) => {
        try {
            const parsed = new URL(url);
            return ['http:', 'https:'].includes(parsed.protocol);
        } catch {
            return false;
        }
    }, {
        message: 'URL must use HTTP or HTTPS protocol',
    })
    .optional();

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeString(input: string): string {
    return input
        .replace(/[<>]/g, '') // Remove angle brackets
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+=/gi, '') // Remove event handlers
        .trim();
}

/**
 * Validate and sanitize user input
 */
export function validateAndSanitize<T extends z.ZodType>(
    schema: T,
    data: unknown
): { success: true; data: z.infer<T> } | { success: false; errors: string[] } {
    const result = schema.safeParse(data);

    if (!result.success) {
        return {
            success: false,
            errors: result.error.errors.map((e) => e.message),
        };
    }

    return {
        success: true,
        data: result.data,
    };
}
