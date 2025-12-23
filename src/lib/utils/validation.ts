/**
 * Shared validation utilities
 * Centralizes all input validation logic to ensure consistency across repositories
 */

import {
    VALIDATION_LIMITS,
    VALID_GRADE_LEVELS,
    VALID_CURRENCIES,
    VALID_ROLES,
    type GradeLevel,
    type Currency,
    type Role,
} from './constants'

/**
 * Validates ID format (supports both UUID and CUID)
 */
export const isValidId = (id: string): boolean => {
    return typeof id === 'string' && id.length > 0 && id.length <= VALIDATION_LIMITS.ID_MAX_LENGTH
}

/**
 * Validates UUID format specifically
 */
export const isValidUUID = (id: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(id)
}

/**
 * Validates email format
 */
export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email) && email.length <= VALIDATION_LIMITS.EMAIL_MAX_LENGTH
}

/**
 * Validates password strength
 */
export const isValidPassword = (password: string): boolean => {
    return (
        password.length >= VALIDATION_LIMITS.PASSWORD_MIN_LENGTH &&
        password.length <= VALIDATION_LIMITS.PASSWORD_MAX_LENGTH
    )
}

/**
 * Validates name format (no XSS characters)
 */
export const isValidName = (name: string): boolean => {
    return (
        name.trim().length > 0 &&
        name.length <= VALIDATION_LIMITS.NAME_MAX_LENGTH &&
        !/[<>"'&]/.test(name)
    )
}

/**
 * Validates role enum
 */
export const isValidRole = (role: string): role is Role => {
    return VALID_ROLES.includes(role as Role)
}

/**
 * Validates array of subjects/specializations
 */
export const isValidSubjects = (subjects: string[]): boolean => {
    return (
        Array.isArray(subjects) &&
        subjects.every(
            (s) =>
                typeof s === 'string' &&
                s.trim().length > 0 &&
                s.length <= VALIDATION_LIMITS.SUBJECT_MAX_LENGTH
        )
    )
}

/**
 * Alias for isValidSubjects for tutor specializations
 */
export const isValidSpecializations = isValidSubjects

/**
 * Validates grade level
 */
export const isValidGradeLevel = (gradeLevel?: string): boolean => {
    if (!gradeLevel) return true
    return VALID_GRADE_LEVELS.includes(gradeLevel as GradeLevel)
}

/**
 * Validates experience years range
 */
export const isValidExperienceYears = (years?: number): boolean => {
    return (
        years === undefined ||
        (Number.isInteger(years) && years >= 0 && years <= VALIDATION_LIMITS.EXPERIENCE_MAX_YEARS)
    )
}

/**
 * Validates hourly rate range
 */
export const isValidHourlyRate = (rate?: number): boolean => {
    return (
        rate === undefined ||
        (typeof rate === 'number' && rate >= 0 && rate <= VALIDATION_LIMITS.HOURLY_RATE_MAX)
    )
}

/**
 * Validates currency code
 */
export const isValidCurrency = (currency?: string): boolean => {
    return currency === undefined || VALID_CURRENCIES.includes(currency as Currency)
}

/**
 * Validates array of languages
 */
export const isValidLanguages = (languages?: string[]): boolean => {
    return (
        languages === undefined ||
        (Array.isArray(languages) &&
            languages.every((l) => typeof l === 'string' && l.trim().length > 0 && l.length <= 50))
    )
}

/**
 * Validates phone number format
 */
export const isValidPhone = (phone: string): boolean => {
    return phone.length <= VALIDATION_LIMITS.PHONE_MAX_LENGTH && /^[+\d\s\-()]+$/.test(phone)
}

/**
 * Validates text content format (checks for XSS and length)
 */
export const isValidTextContent = (text: string, maxLength: number): boolean => {
    return text.length <= maxLength && !/[<>"'&]/.test(text)
}
