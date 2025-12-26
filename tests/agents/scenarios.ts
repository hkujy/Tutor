import { Browser } from '@playwright/test'
import { TutorAgent, TutorBehaviorPattern } from './tutor-agent'
import { StudentAgent, StudentBehaviorPattern } from './student-agent'
import { AgentOrchestrator } from './agent-framework'

/**
 * Scenario definition interface
 */
export interface Scenario {
    name: string
    description: string
    preconditions?: string[]
    agents: ScenarioAgent[]
    executionMode: 'parallel' | 'sequential'
    successCriteria: string[]
    performanceBenchmarks?: {
        maxDuration?: number // milliseconds
        minSuccessRate?: number // 0-1
    }
}

/**
 * Agent configuration for scenarios
 */
export interface ScenarioAgent {
    type: 'tutor' | 'student'
    name: string
    email: string
    password: string
    behaviorPattern?: TutorBehaviorPattern | StudentBehaviorPattern
    customActions?: string[] // Custom action sequence
}

/**
 * Pre-defined test scenarios
 */
export class TestScenarios {
    /**
     * Scenario 1: Single Booking
     * One tutor sets availability, one student books
     */
    static singleBooking(): Scenario {
        return {
            name: 'Single Booking',
            description: 'A tutor sets availability and a student successfully books an appointment',
            preconditions: [
                'Tutor account exists with email tutor1@test.com',
                'Student account exists with email student1@test.com',
                'Database is clean with no existing appointments',
            ],
            agents: [
                {
                    type: 'tutor',
                    name: 'TutorAlice',
                    email: 'tutor1@test.com',
                    password: 'password123',
                    behaviorPattern: 'active',
                },
                {
                    type: 'student',
                    name: 'StudentBob',
                    email: 'student1@test.com',
                    password: 'password123',
                    behaviorPattern: 'eager',
                },
            ],
            executionMode: 'sequential',
            successCriteria: [
                'Tutor successfully sets weekly availability',
                'Student can see available time slots',
                'Student successfully books an appointment',
                'Both tutor and student receive booking confirmation',
            ],
            performanceBenchmarks: {
                maxDuration: 15000, // 15 seconds
                minSuccessRate: 1.0,
            },
        }
    }

    /**
     * Scenario 2: Cancellation Flow
     * Student books then cancels, tutor sees the cancellation
     */
    static cancellationFlow(): Scenario {
        return {
            name: 'Cancellation Flow',
            description: 'Student books an appointment and then cancels it, tutor receives notification',
            agents: [
                {
                    type: 'tutor',
                    name: 'TutorCarol',
                    email: 'tutor2@test.com',
                    password: 'password123',
                    behaviorPattern: 'conservative',
                },
                {
                    type: 'student',
                    name: 'StudentDave',
                    email: 'student2@test.com',
                    password: 'password123',
                    behaviorPattern: 'indecisive',
                },
            ],
            executionMode: 'sequential',
            successCriteria: [
                'Student books appointment successfully',
                'Student cancels appointment successfully',
                'Appointment status changes to cancelled',
                'Tutor can see cancellation in their dashboard',
            ],
            performanceBenchmarks: {
                maxDuration: 20000,
                minSuccessRate: 1.0,
            },
        }
    }

    /**
     * Scenario 4: Rush Hour
     * One tutor, multiple students compete for limited slots
     */
    static rushHour(studentCount: number = 5): Scenario {
        const students: ScenarioAgent[] = []

        for (let i = 0; i < studentCount; i++) {
            students.push({
                type: 'student',
                name: `Student${i + 1}`,
                email: `student${i + 1}@test.com`,
                password: 'password123',
                behaviorPattern: i % 2 === 0 ? 'eager' : 'browsing',
            })
        }

        return {
            name: 'Rush Hour',
            description: `${studentCount} students compete for limited tutoring slots`,
            preconditions: [
                'One tutor with limited availability (e.g., 3 slots)',
                `${studentCount} student accounts exist`,
            ],
            agents: [
                {
                    type: 'tutor',
                    name: 'TutorPopular',
                    email: 'popular@test.com',
                    password: 'password123',
                    behaviorPattern: 'active',
                },
                ...students,
            ],
            executionMode: 'parallel',
            successCriteria: [
                'No double bookings occur',
                'Only available slots can be booked',
                'Students who fail to book receive appropriate feedback',
                'Database maintains consistency',
            ],
            performanceBenchmarks: {
                maxDuration: 30000,
                minSuccessRate: 0.8, // Some students may fail to book
            },
        }
    }

    /**
     * Scenario 5: Multi-Tutor Marketplace
     * Multiple tutors, multiple students, realistic booking patterns
     */
    static multiTutorMarketplace(tutorCount: number = 3, studentCount: number = 10): Scenario {
        const tutors: ScenarioAgent[] = []
        const students: ScenarioAgent[] = []

        for (let i = 0; i < tutorCount; i++) {
            tutors.push({
                type: 'tutor',
                name: `Tutor${i + 1}`,
                email: `tutor${i + 1}@marketplace.com`,
                password: 'password123',
                behaviorPattern: i === 0 ? 'active' : i === 1 ? 'flexible' : 'conservative',
            })
        }

        for (let i = 0; i < studentCount; i++) {
            students.push({
                type: 'student',
                name: `Student${i + 1}`,
                email: `student${i + 1}@marketplace.com`,
                password: 'password123',
                behaviorPattern: i % 3 === 0 ? 'eager' : i % 3 === 1 ? 'browsing' : 'indecisive',
            })
        }

        return {
            name: 'Multi-Tutor Marketplace',
            description: `${tutorCount} tutors and ${studentCount} students in a marketplace scenario`,
            agents: [...tutors, ...students],
            executionMode: 'parallel',
            successCriteria: [
                'All tutors successfully set availability',
                'Students can browse and compare tutors',
                'Multiple successful bookings occur',
                'No race conditions or data corruption',
                'Notification system handles high volume',
            ],
            performanceBenchmarks: {
                maxDuration: 45000,
                minSuccessRate: 0.85,
            },
        }
    }

    /**
     * Scenario 6: Peak Load
     * Simulate semester start with many concurrent agents
     */
    static peakLoad(agentCount: number = 20): Scenario {
        const agents: ScenarioAgent[] = []
        const tutorCount = Math.floor(agentCount * 0.3) // 30% tutors
        const studentCount = agentCount - tutorCount

        for (let i = 0; i < tutorCount; i++) {
            agents.push({
                type: 'tutor',
                name: `Tutor${i + 1}`,
                email: `tutor${i + 1}@peak.com`,
                password: 'password123',
                behaviorPattern: ['active', 'flexible', 'conservative'][i % 3] as TutorBehaviorPattern,
            })
        }

        for (let i = 0; i < studentCount; i++) {
            agents.push({
                type: 'student',
                name: `Student${i + 1}`,
                email: `student${i + 1}@peak.com`,
                password: 'password123',
                behaviorPattern: ['eager', 'browsing', 'indecisive'][i % 3] as StudentBehaviorPattern,
            })
        }

        return {
            name: 'Peak Load',
            description: `Simulate high traffic with ${agentCount} concurrent users`,
            agents,
            executionMode: 'parallel',
            successCriteria: [
                'System handles concurrent load without crashes',
                'Response times remain acceptable',
                'No database deadlocks or timeouts',
                'All critical operations complete successfully',
            ],
            performanceBenchmarks: {
                maxDuration: 60000,
                minSuccessRate: 0.75,
            },
        }
    }

    /**
     * Scenario 7: Double Booking Attempt
     * Two students try to book the same slot simultaneously
     */
    static doubleBookingAttempt(): Scenario {
        return {
            name: 'Double Booking Prevention',
            description: 'Two students attempt to book the same timeslot simultaneously',
            preconditions: [
                'One tutor with exactly one available slot',
                'Two student accounts ready',
            ],
            agents: [
                {
                    type: 'tutor',
                    name: 'TutorSingle',
                    email: 'single@test.com',
                    password: 'password123',
                    behaviorPattern: 'active',
                },
                {
                    type: 'student',
                    name: 'StudentFast',
                    email: 'fast@test.com',
                    password: 'password123',
                    behaviorPattern: 'eager',
                },
                {
                    type: 'student',
                    name: 'StudentSlow',
                    email: 'slow@test.com',
                    password: 'password123',
                    behaviorPattern: 'eager',
                },
            ],
            executionMode: 'parallel',
            successCriteria: [
                'Only one student successfully books',
                'Second student receives "slot taken" error',
                'No double booking in database',
                'Both students see appropriate feedback',
            ],
            performanceBenchmarks: {
                maxDuration: 15000,
                minSuccessRate: 1.0,
            },
        }
    }

    /**
     * Scenario 11: Full Student Journey
     * Complete workflow from browsing to rating
     */
    static fullStudentJourney(): Scenario {
        return {
            name: 'Full Student Journey',
            description: 'Complete student experience: browse → book → attend → rate → rebook',
            agents: [
                {
                    type: 'tutor',
                    name: 'TutorMentor',
                    email: 'mentor@test.com',
                    password: 'password123',
                    behaviorPattern: 'flexible',
                },
                {
                    type: 'student',
                    name: 'StudentJourney',
                    email: 'journey@test.com',
                    password: 'password123',
                    behaviorPattern: 'eager',
                },
            ],
            executionMode: 'sequential',
            successCriteria: [
                'Student browses multiple tutors',
                'Student books appointment',
                'Student views schedule',
                'Student checks notifications',
                'End-to-end flow completes without errors',
            ],
            performanceBenchmarks: {
                maxDuration: 30000,
                minSuccessRate: 1.0,
            },
        }
    }

    /**
     * Get all available scenarios
     */
    static getAllScenarios(): Scenario[] {
        return [
            this.singleBooking(),
            this.cancellationFlow(),
            this.rushHour(),
            this.multiTutorMarketplace(),
            this.peakLoad(),
            this.doubleBookingAttempt(),
            this.fullStudentJourney(),
        ]
    }
}

/**
 * Helper to execute a scenario
 */
export async function executeScenario(
    scenario: Scenario,
    browser: Browser,
    orchestrator: AgentOrchestrator
): Promise<{
    success: boolean
    metrics: any
    errors: string[]
}> {
    const errors: string[] = []
    console.log(`\n🎬 Executing scenario: ${scenario.name}`)
    console.log(`📝 ${scenario.description}\n`)

    try {
        // Create and initialize agents
        for (const agentConfig of scenario.agents) {
            let agent

            if (agentConfig.type === 'tutor') {
                agent = new TutorAgent(
                    browser,
                    agentConfig.name,
                    agentConfig.behaviorPattern as TutorBehaviorPattern
                )
            } else {
                agent = new StudentAgent(
                    browser,
                    agentConfig.name,
                    agentConfig.behaviorPattern as StudentBehaviorPattern
                )
            }

            await agent.initialize()
            await agent.login(agentConfig.email, agentConfig.password)
            orchestrator.registerAgent(agent)
        }

        // Execute scenario
        const agentNames = scenario.agents.map((a) => a.name)
        const startTime = Date.now()

        if (scenario.executionMode === 'parallel') {
            await orchestrator.executeParallel(agentNames)
        } else {
            await orchestrator.executeSequential(agentNames)
        }

        const duration = Date.now() - startTime
        const metrics = orchestrator.getAggregatedMetrics()

        // Check performance benchmarks
        if (scenario.performanceBenchmarks) {
            if (scenario.performanceBenchmarks.maxDuration && duration > scenario.performanceBenchmarks.maxDuration) {
                errors.push(`Exceeded max duration: ${duration}ms > ${scenario.performanceBenchmarks.maxDuration}ms`)
            }

            if (scenario.performanceBenchmarks.minSuccessRate && metrics.successRate < scenario.performanceBenchmarks.minSuccessRate) {
                errors.push(`Below min success rate: ${metrics.successRate} < ${scenario.performanceBenchmarks.minSuccessRate}`)
            }
        }

        console.log(`\n✅ Scenario completed in ${duration}ms`)
        console.log(`📊 Success rate: ${(metrics.successRate * 100).toFixed(1)}%`)
        console.log(`⏱️  Average response time: ${metrics.averageResponseTime.toFixed(0)}ms\n`)

        return {
            success: errors.length === 0,
            metrics: {
                ...metrics,
                duration,
            },
            errors,
        }
    } catch (error) {
        errors.push(`Scenario execution failed: ${error}`)
        return {
            success: false,
            metrics: orchestrator.getAggregatedMetrics(),
            errors,
        }
    } finally {
        // Cleanup
        await orchestrator.cleanup()
    }
}
