/**
 * Shared constants used across the application
 * Centralizes magic numbers and repeated values for easier maintenance
 */

export const VALIDATION_LIMITS = {
    ID_MAX_LENGTH: 50,
    EMAIL_MAX_LENGTH: 254,
    PASSWORD_MIN_LENGTH: 8,
    PASSWORD_MAX_LENGTH: 128,
    NAME_MAX_LENGTH: 100,
    SUBJECT_MAX_LENGTH: 100,
    PHONE_MAX_LENGTH: 20,
    BIO_MAX_LENGTH: 2000,
    EDUCATION_MAX_LENGTH: 1000,
    LEARNING_GOALS_MAX_LENGTH: 2000,
    PAGINATION_MAX_TAKE: 100,
    PAGINATION_MIN_TAKE: 1,
    EXPERIENCE_MAX_YEARS: 100,
    HOURLY_RATE_MAX: 10000,
} as const

export const VALID_GRADE_LEVELS = [
    'K',
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '10',
    '11',
    '12',
    'College',
    'Graduate',
] as const

export const VALID_CURRENCIES = ['USD', 'CNY', 'GBP', 'EUR', 'CAD', 'AUD', 'JPY', 'CHF'] as const

export const VALID_ROLES = ['STUDENT', 'TUTOR', 'ADMIN'] as const

export type GradeLevel = (typeof VALID_GRADE_LEVELS)[number]
export type Currency = (typeof VALID_CURRENCIES)[number]
export type Role = (typeof VALID_ROLES)[number]
