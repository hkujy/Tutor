/**
 * Shared database error handling utilities
 * Centralizes Prisma error handling to provide consistent error messages
 */

import { Prisma } from '@prisma/client'

type EntityType = 'user' | 'student' | 'tutor'

/**
 * Handles database errors and throws user-friendly error messages
 * @param error - The error object from Prisma
 * @param operation - Description of the operation being performed
 * @param entityType - Type of entity (user, student, tutor) for contextual messages
 */
export const handleDatabaseError = (
    error: any,
    operation: string,
    entityType: EntityType
): never => {
    console.error(`Database error in ${operation}:`, error)

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
            case 'P2002':
                // Unique constraint violation
                if (entityType === 'user') {
                    throw new Error('A user with this email already exists')
                }
                throw new Error(`A ${entityType} profile for this user already exists`)

            case 'P2025':
                // Record not found
                const capitalizedEntity = entityType.charAt(0).toUpperCase() + entityType.slice(1)
                throw new Error(`${capitalizedEntity} not found`)

            case 'P2003':
                // Foreign key constraint violation
                if (entityType === 'user') {
                    throw new Error('Invalid reference to related data')
                }
                throw new Error('Invalid reference to user data')

            default:
                throw new Error(`Database operation failed: ${error.message}`)
        }
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
        throw new Error('Invalid data provided')
    }

    throw new Error('An unexpected database error occurred')
}
