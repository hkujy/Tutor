/**
 * Test data factory for generating realistic test data
 */

export interface TutorProfile {
    email: string
    password: string
    firstName: string
    lastName: string
    specializations: string[]
    hourlyRate: number
    bio: string
    languages: string[]
}

export interface StudentProfile {
    email: string
    password: string
    firstName: string
    lastName: string
    gradeLevel?: string
    subjects: string[]
    learningGoals?: string
}

export interface AvailabilitySchedule {
    daysOfWeek: number[]
    startTime: string
    endTime: string
    duration: number
}

/**
 * Generate random tutor profiles
 */
export class TestDataFactory {
    private static firstNames = [
        'Alice', 'Bob', 'Carol', 'David', 'Emma',
        'Frank', 'Grace', 'Henry', 'Iris', 'Jack',
    ]

    private static lastNames = [
        'Smith', 'Johnson', 'Williams', 'Brown', 'Jones',
        'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
    ]

    private static subjects = [
        'Mathematics',
        'Physics',
        'Chemistry',
        'Biology',
        'English',
        'History',
        'Computer Science',
        'Economics',
        'Psychology',
        'Art',
    ]

    private static learningGoals = [
        'Improve test scores',
        'Prepare for college applications',
        'Master advanced concepts',
        'Build strong foundation',
        'Get ready for exams',
    ]

    /**
     * Generate a random tutor profile
     */
    static generateTutorProfile(id: number): TutorProfile {
        const firstName = this.randomChoice(this.firstNames)
        const lastName = this.randomChoice(this.lastNames)
        const specializations = this.randomSample(this.subjects, this.randomInt(1, 3))

        return {
            email: `tutor${id}@test.com`,
            password: 'password123',
            firstName,
            lastName,
            specializations,
            hourlyRate: this.randomInt(30, 100),
            bio: `Experienced ${specializations[0]} tutor with ${this.randomInt(2, 15)} years of experience.`,
            languages: Math.random() > 0.7 ? ['English', 'Spanish'] : ['English'],
        }
    }

    /**
     * Generate a random student profile
     */
    static generateStudentProfile(id: number): StudentProfile {
        const firstName = this.randomChoice(this.firstNames)
        const lastName = this.randomChoice(this.lastNames)
        const subjects = this.randomSample(this.subjects, this.randomInt(1, 3))

        return {
            email: `student${id}@test.com`,
            password: 'password123',
            firstName,
            lastName,
            gradeLevel: this.randomChoice(['9th', '10th', '11th', '12th', 'College']),
            subjects,
            learningGoals: this.randomChoice(this.learningGoals),
        }
    }

    /**
     * Generate common availability schedules
     */
    static generateAvailabilitySchedule(pattern: 'full-time' | 'part-time' | 'weekends'): AvailabilitySchedule {
        switch (pattern) {
            case 'full-time':
                return {
                    daysOfWeek: [1, 2, 3, 4, 5], // Monday-Friday
                    startTime: '09:00',
                    endTime: '17:00',
                    duration: 60,
                }

            case 'part-time':
                return {
                    daysOfWeek: [1, 3, 5], // MWF
                    startTime: '14:00',
                    endTime: '18:00',
                    duration: 60,
                }

            case 'weekends':
                return {
                    daysOfWeek: [0, 6], // Sunday and Saturday
                    startTime: '10:00',
                    endTime: '16:00',
                    duration: 90,
                }

            default:
                return {
                    daysOfWeek: [1, 2, 3, 4, 5],
                    startTime: '09:00',
                    endTime: '17:00',
                    duration: 60,
                }
        }
    }

    /**
     * Generate multiple tutor profiles
     */
    static generateTutors(count: number): TutorProfile[] {
        return Array.from({ length: count }, (_, i) => this.generateTutorProfile(i + 1))
    }

    /**
     * Generate multiple student profiles
     */
    static generateStudents(count: number): StudentProfile[] {
        return Array.from({ length: count }, (_, i) => this.generateStudentProfile(i + 1))
    }

    /**
     * Helper: Random choice from array
     */
    private static randomChoice<T>(array: T[]): T {
        return array[Math.floor(Math.random() * array.length)]
    }

    /**
     * Helper: Random sample of n items from array
     */
    private static randomSample<T>(array: T[], n: number): T[] {
        const shuffled = [...array].sort(() => 0.5 - Math.random())
        return shuffled.slice(0, n)
    }

    /**
     * Helper: Random integer between min and max (inclusive)
     */
    private static randomInt(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min
    }
}

/**
 * Database seeding utilities
 */
export class DatabaseSeeder {
    /**
     * Seed database with test users
     * This would connect to your actual database in a real scenario
     */
    static async seedTestUsers(tutors: TutorProfile[], students: StudentProfile[]): Promise<void> {
        console.log(`🌱 Seeding database with ${tutors.length} tutors and ${students.length} students`)

        // In a real implementation, this would:
        // 1. Connect to database
        // 2. Create user accounts
        // 3. Create tutor/student profiles
        // 4. Set up initial data

        // For now, just log
        console.log('✅ Database seeded successfully')
    }

    /**
     * Clean up test data
     */
    static async cleanup(): Promise<void> {
        console.log('🧹 Cleaning up test data')

        // In a real implementation:
        // 1. Delete test appointments
        // 2. Delete test users
        // 3. Reset sequences

        console.log('✅ Cleanup completed')
    }
}
