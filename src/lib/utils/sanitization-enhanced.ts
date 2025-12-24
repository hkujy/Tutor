/**
 * Input Sanitization Utilities
 * Prevents XSS and injection attacks
 */

/**
 * Sanitize HTML content to prevent XSS
 */
export function sanitizeHtml(input: string): string {
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize string for safe display
 */
export function sanitizeString(input: string): string {
    return input
        .replace(/[<>]/g, '') // Remove angle brackets
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+=/gi, '') // Remove event handlers
        .replace(/data:/gi, '') // Remove data: protocol
        .trim();
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
    const sanitized = {} as T;

    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
            sanitized[key as keyof T] = sanitizeString(value) as T[keyof T];
        } else if (Array.isArray(value)) {
            sanitized[key as keyof T] = value.map((item) =>
                typeof item === 'string' ? sanitizeString(item) : item
            ) as T[keyof T];
        } else if (typeof value === 'object' && value !== null) {
            sanitized[key as keyof T] = sanitizeObject(value);
        } else {
            sanitized[key as keyof T] = value;
        }
    }

    return sanitized;
}

/**
 * Sanitize SQL input (basic protection, use parameterized queries instead)
 */
export function sanitizeSql(input: string): string {
    return input
        .replace(/['";\\]/g, '') // Remove SQL special characters
        .replace(/--/g, '') // Remove SQL comments
        .replace(/\/\*/g, '') // Remove block comments
        .replace(/\*\//g, '')
        .trim();
}

/**
 * Sanitize file name
 */
export function sanitizeFileName(fileName: string): string {
    return fileName
        .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace special chars with underscore
        .replace(/\.{2,}/g, '.') // Remove consecutive dots
        .replace(/^\./, '') // Remove leading dot
        .substring(0, 255); // Limit length
}

/**
 * Sanitize URL
 */
export function sanitizeUrl(url: string): string {
    try {
        const parsed = new URL(url);

        // Only allow http and https protocols
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            return '';
        }

        return parsed.toString();
    } catch {
        return '';
    }
}

/**
 * Remove null bytes from string
 */
export function removeNullBytes(input: string): string {
    return input.replace(/\0/g, '');
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(email: string): string {
    return email
        .toLowerCase()
        .trim()
        .replace(/[^\w@.+-]/g, '');
}

/**
 * Sanitize phone number (keep only digits and +)
 */
export function sanitizePhone(phone: string): string {
    return phone.replace(/[^\d+]/g, '');
}

/**
 * Truncate string to max length
 */
export function truncate(input: string, maxLength: number): string {
    if (input.length <= maxLength) return input;
    return input.substring(0, maxLength - 3) + '...';
}

/**
 * Sanitize JSON input
 */
export function sanitizeJson(input: string): string {
    try {
        const parsed = JSON.parse(input);
        return JSON.stringify(sanitizeObject(parsed));
    } catch {
        return '';
    }
}
