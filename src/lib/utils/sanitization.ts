/**
 * Shared sanitization utilities
 * Centralizes all data sanitization logic to prevent XSS and ensure data consistency
 */

/**
 * Sanitizes a string by removing dangerous characters
 */
export const sanitizeString = (str: string): string => {
    return str.trim().replace(/[<>"'&]/g, '')
}

/**
 * Sanitizes an array of strings
 */
export const sanitizeArray = (arr: string[]): string[] => {
    return arr.map((item) => sanitizeString(item)).filter((item) => item.length > 0)
}

/**
 * Sanitizes an email address (lowercase and trim)
 */
export const sanitizeEmail = (email: string): string => {
    return email.toLowerCase().trim()
}

/**
 * Sanitizes a phone number (remove extra spaces)
 */
export const sanitizePhone = (phone: string): string => {
    return sanitizeString(phone)
}
