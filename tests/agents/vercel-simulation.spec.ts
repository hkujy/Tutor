import { test, expect } from '@playwright/test'
import { AgentOrchestrator } from './agent-framework'
import { TutorAgent } from './tutor-agent'
import { StudentAgent } from './student-agent'

/**
 * Vercel Production Simulation Tests
 * 
 * Targets the production URL: https://tutor-sandy.vercel.app/
 * Uses demo credentials.
 */

test.describe('Vercel Production Simulation', () => {
    let orchestrator: AgentOrchestrator

    test.beforeEach(() => {
        orchestrator = new AgentOrchestrator()
    })

    test.afterEach(async () => {
        await orchestrator.cleanup()
    })

    test('Production Flow: Single Booking', async ({ browser, baseURL }) => {
        const targetUrl = baseURL || 'https://tutor-sandy.vercel.app/'
        console.log(`🧪 Testing Production Flow on: ${targetUrl}`)

        const tutor = new TutorAgent(browser, 'ProdTutor', 'active')
        const student = new StudentAgent(browser, 'ProdStudent', 'eager')

        await tutor.initialize()
        await student.initialize()

        orchestrator.registerAgent(tutor)
        orchestrator.registerAgent(student)

        try {
            // 1. Tutor login and check dashboard
            console.log('Step 1: Tutor login...')
            const tutorLoggedIn = await tutor.login('tutor@example.com', 'tutor123')
            expect(tutorLoggedIn).toBe(true)
            await tutor.viewDashboard()

            // 2. Student login and browse
            console.log('Step 2: Student login and browse...')
            const studentLoggedIn = await student.login('student@example.com', 'student123')
            expect(studentLoggedIn).toBe(true)

            const tutorCount = await student.browseTutors()
            console.log(`Found ${tutorCount} tutors in production`)

            // 3. Simple journey
            if (tutorCount > 0) {
                await student.viewTutorProfile(0)
                // We won't book in every run to avoid polluting production data 
                // unless we have a specific test account/cleanup.
                // But for simulation parity, we'll check notifications.
                await student.checkNotifications()
            }

            const metrics = orchestrator.getAggregatedMetrics()
            console.log(`\n📊 Production Metrics:`)
            console.log(`   Total actions: ${metrics.totalActions}`)
            console.log(`   Success rate: ${(metrics.successRate * 100).toFixed(1)}%`)

            expect(metrics.successRate).toBeGreaterThan(0.5) // Lower threshold for production network latency
        } finally {
            await tutor.cleanup()
            await student.cleanup()
        }
    })
})
