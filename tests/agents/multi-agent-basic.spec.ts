import { test, expect } from '@playwright/test'
import { AgentOrchestrator } from './agent-framework'
import { TutorAgent } from './tutor-agent'
import { StudentAgent } from './student-agent'
import { TestScenarios, executeScenario } from './scenarios'

/**
 * Basic Multi-Agent Test Scenarios
 * 
 * Tests basic interactions between tutor and student agents:
 * - Single booking flow
 * - Cancellation flow
 * - Rescheduling
 * 
 * FIXED: Using existing demo users (tutor@example.com / student@example.com)
 */

test.describe('Multi-Agent Basic Scenarios', () => {
    let orchestrator: AgentOrchestrator

    test.beforeEach(() => {
        orchestrator = new AgentOrchestrator()
    })

    test.afterEach(async () => {
        await orchestrator.cleanup()
    })

    test('Scenario 1: Single Booking - Tutor sets availability, student books', async ({ browser }) => {
        console.log('\n🧪 Testing Single Booking Scenario...\n')

        // Create agents
        const tutor = new TutorAgent(browser, 'TutorAlice', 'active')
        const student = new StudentAgent(browser, 'StudentBob', 'eager')

        // Initialize agents
        await tutor.initialize()
        await student.initialize()

        orchestrator.registerAgent(tutor)
        orchestrator.registerAgent(student)

        try {
            // Step 1: Tutor logs in and sets availability
            console.log('Step 1: Tutor setting availability...')
            const tutorLoggedIn = await tutor.login('tutor@example.com', 'tutor123')  // FIXED
            expect(tutorLoggedIn).toBe(true)

            const availabilitySet = await tutor.setWeeklyAvailability({
                daysOfWeek: [1, 2, 3, 4, 5],
                startTime: '09:00',
                endTime: '17:00',
                duration: 60,
            })

            // Give time for availability to propagate
            await new Promise(resolve => setTimeout(resolve, 2000))

            // Step 2: Student logs in and browses tutors
            console.log('Step 2: Student browsing tutors...')
            const studentLoggedIn = await student.login('student@example.com', 'student123')  // FIXED
            expect(studentLoggedIn).toBe(true)

            const tutorCount = await student.browseTutors('Mathematics')
            console.log(`Found ${tutorCount} tutors`)

            // Step 3: Student views tutor profile and books
            console.log('Step 3: Student booking appointment...')
            if (tutorCount > 0) {
                await student.viewTutorProfile(0)
                const booked = await student.bookAppointment('Mathematics')

                // Success criteria: booking should succeed
                expect(booked).toBe(true)
            }

            // Verify metrics
            const metrics = orchestrator.getAggregatedMetrics()
            console.log(`\n📊 Test Metrics:`)
            console.log(`   Total actions: ${metrics.totalActions}`)
            console.log(`   Success rate: ${(metrics.successRate * 100).toFixed(1)}%`)
            console.log(`   Avg response time: ${metrics.averageResponseTime.toFixed(0)}ms\n`)

            expect(metrics.successRate).toBeGreaterThan(0.8)
        } finally {
            await tutor.cleanup()
            await student.cleanup()
        }
    })

    test('Scenario 2: Cancellation Flow - Student books then cancels', async ({ browser }) => {
        console.log('\n🧪 Testing Cancellation Flow...\n')

        const tutor = new TutorAgent(browser, 'TutorCarol', 'conservative')
        const student = new StudentAgent(browser, 'StudentDave', 'indecisive')

        await tutor.initialize()
        await student.initialize()

        orchestrator.registerAgent(tutor)
        orchestrator.registerAgent(student)

        try {
            // Step 1: Tutor sets availability
            await tutor.login('tutor@example.com', 'tutor123')  // FIXED
            await tutor.setWeeklyAvailability({
                daysOfWeek: [1, 3, 5],
                startTime: '14:00',
                endTime: '18:00',
                duration: 60,
            })

            await new Promise(resolve => setTimeout(resolve, 2000))

            // Step 2: Student books appointment
            await student.login('student@example.com', 'student123')  // FIXED
            await student.browseTutors()
            await student.viewTutorProfile(0)
            const booked = await student.bookAppointment('Physics')

            if (booked) {
                console.log('✅ Appointment booked successfully')

                // Step 3: Student cancels
                await new Promise(resolve => setTimeout(resolve, 1000))
                const cancelled = await student.cancelAppointment(0)

                console.log(`Cancellation ${cancelled ? 'successful' : 'failed'}`)

                // Tutor checks for cancellation notification
                await tutor.checkNotifications()
            }

            const metrics = orchestrator.getAggregatedMetrics()
            console.log(`\n📊 Success rate: ${(metrics.successRate * 100).toFixed(1)}%\n`)

        } finally {
            await tutor.cleanup()
            await student.cleanup()
        }
    })

    test('Scenario 3: Full Student Journey - Browse, book, view schedule', async ({ browser }) => {
        console.log('\n🧪 Testing Full Student Journey...\n')

        const tutor = new TutorAgent(browser, 'TutorMentor', 'flexible')
        const student = new StudentAgent(browser, 'StudentJourney', 'eager')

        await tutor.initialize()
        await student.initialize()

        try {
            // Tutor setup
            await tutor.login('tutor@example.com', 'tutor123')  // FIXED
            await tutor.performActions() // Execute full tutor workflow

            await new Promise(resolve => setTimeout(resolve, 2000))

            // Student full journey
            await student.login('student@example.com', 'student123')  // FIXED
            await student.performActions() // Execute full student workflow

            // Verify the journey completed
            const studentState = student.getState()
            expect(studentState.isLoggedIn).toBe(true)
            expect(studentState.metrics.actionsPerformed).toBeGreaterThan(3)

            const metrics = orchestrator.getAggregatedMetrics()
            console.log(`\n📊 Journey Metrics:`)
            console.log(`   Total actions: ${metrics.totalActions}`)
            console.log(`   Success rate: ${(metrics.successRate * 100).toFixed(1)}%\n`)

        } finally {
            await tutor.cleanup()
            await student.cleanup()
        }
    })

    test('Demo: Viewing agent behavior in headed mode', async ({ browser }) => {
        // Skip this test in CI - it's for local debugging
        test.skip(!!process.env.CI, 'Demo test only runs locally')

        console.log('\n👀 Demo: Watch agents in action (headed mode recommended)\n')

        const student = new StudentAgent(browser, 'DemoStudent', 'browsing')
        await student.initialize()

        try {
            await student.login('student@example.com', 'student123')  // FIXED

            // Slow down for visibility
            await student.browseTutors('Mathematics')
            await new Promise(resolve => setTimeout(resolve, 3000))

            const tutorCount = await student.browseTutors()
            if (tutorCount > 0) {
                await student.viewTutorProfile(0)
                await new Promise(resolve => setTimeout(resolve, 3000))
            }

            console.log('✅ Demo completed - check the browser window!')

        } finally {
            await student.cleanup()
        }
    })
})
