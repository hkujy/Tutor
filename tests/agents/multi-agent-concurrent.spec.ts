import { test, expect } from '@playwright/test'
import { AgentOrchestrator } from './agent-framework'
import { TutorAgent } from './tutor-agent'
import { StudentAgent } from './student-agent'
import { TestScenarios } from './scenarios'

/**
 * Concurrent Multi-Agent Test Scenarios
 * 
 * Tests system behavior under concurrent load:
 * - Rush hour (multiple students, limited slots)
 * - Multi-tutor marketplace
 * - Peak load simulation
 */

test.describe('Multi-Agent Concurrent Scenarios', () => {
    let orchestrator: AgentOrchestrator

    test.beforeEach(() => {
        orchestrator = new AgentOrchestrator()
    })

    test.afterEach(async () => {
        await orchestrator.cleanup()
    })

    test('Scenario 4: Rush Hour - 5 students compete for limited slots', async ({ browser }) => {
        console.log('\n🧪 Testing Rush Hour Scenario (5 students)...\n')

        const tutor = new TutorAgent(browser, 'PopularTutor', 'active')
        const students: StudentAgent[] = []

        // Create 5 students with different behaviors
        for (let i = 0; i < 5; i++) {
            const pattern = i % 2 === 0 ? 'eager' : 'browsing'
            const student = new StudentAgent(browser, `Student${i + 1}`, pattern)
            students.push(student)
        }

        try {
            // Initialize tutor
            await tutor.initialize()
            await tutor.login('popular@test.com', 'password123')

            // Set limited availability (only a few slots)
            await tutor.setWeeklyAvailability({
                daysOfWeek: [1, 3], // Only Monday and Wednesday
                startTime: '14:00',
                endTime: '16:00', // Only 2-hour window
                duration: 60, // 2 slots per day = 4 slots total
            })

            console.log('✅ Tutor set limited availability (approx 4 slots)')
            await new Promise(resolve => setTimeout(resolve, 2000))

            // Initialize all students
            console.log('📦 Initializing 5 students concurrently...')
            for (let i = 0; i < students.length; i++) {
                await students[i].initialize()
                await students[i].login(`student${i + 1}@test.com`, 'password123')
            }

            // All students try to book simultaneously
            console.log('⚡ All students attempting to book simultaneously...')
            const bookingPromises = students.map(async (student) => {
                try {
                    await student.browseTutors()
                    await student.viewTutorProfile(0)
                    const booked = await student.bookAppointment()
                    return { name: student.name, success: booked }
                } catch (error) {
                    console.log(`${student.name} encountered error: ${error}`)
                    return { name: student.name, success: false }
                }
            })

            const results = await Promise.all(bookingPromises)

            // Analyze results
            const successfulBookings = results.filter(r => r.success).length
            const failedBookings = results.filter(r => r.success === false).length

            console.log(`\n📊 Booking Results:`)
            console.log(`   Successful: ${successfulBookings}`)
            console.log(`   Failed: ${failedBookings}`)

            results.forEach(r => {
                console.log(`   ${r.name}: ${r.success ? '✅ Booked' : '❌ Failed'}`)
            })

            // Success criteria: No double bookings, some succeed, some fail
            // We expect only a few students to succeed (limited slots)
            expect(successfulBookings).toBeGreaterThan(0)
            expect(successfulBookings).toBeLessThanOrEqual(4) // Max 4 slots

            const metrics = orchestrator.getAggregatedMetrics()
            console.log(`\n📊 Overall Metrics:`)
            console.log(`   Total actions: ${metrics.totalActions}`)
            console.log(`   Success rate: ${(metrics.successRate * 100).toFixed(1)}%\n`)

        } finally {
            await tutor.cleanup()
            for (const student of students) {
                await student.cleanup()
            }
        }
    })

    test('Scenario 5: Multi-Tutor Marketplace - 3 tutors, 6 students', async ({ browser }) => {
        console.log('\n🧪 Testing Multi-Tutor Marketplace...\n')

        const tutors: TutorAgent[] = []
        const students: StudentAgent[] = []

        // Create 3 tutors with different patterns
        const tutorPatterns: Array<'active' | 'flexible' | 'conservative'> = ['active', 'flexible', 'conservative']
        for (let i = 0; i < 3; i++) {
            const tutor = new TutorAgent(browser, `Tutor${i + 1}`, tutorPatterns[i])
            tutors.push(tutor)
        }

        // Create 6 students
        const studentPatterns: Array<'eager' | 'browsing' | 'indecisive'> = ['eager', 'browsing', 'indecisive']
        for (let i = 0; i < 6; i++) {
            const pattern = studentPatterns[i % 3]
            const student = new StudentAgent(browser, `Student${i + 1}`, pattern)
            students.push(student)
        }

        try {
            // Initialize and setup tutors in parallel
            console.log('📦 Setting up 3 tutors...')
            await Promise.all(tutors.map(async (tutor, i) => {
                await tutor.initialize()
                await tutor.login(`tutor${i + 1}@marketplace.com`, 'password123')

                // Each tutor sets different availability
                await tutor.setWeeklyAvailability({
                    daysOfWeek: i === 0 ? [1, 2, 3, 4, 5] : i === 1 ? [1, 3, 5] : [2, 4],
                    startTime: i === 0 ? '09:00' : i === 1 ? '13:00' : '15:00',
                    endTime: i === 0 ? '17:00' : i === 1 ? '17:00' : '19:00',
                    duration: 60,
                })
            }))

            console.log('✅ All tutors ready')
            await new Promise(resolve => setTimeout(resolve, 3000))

            // Students browse and book
            console.log('📦 6 students entering marketplace...')
            await Promise.all(students.map(async (student, i) => {
                await student.initialize()
                await student.login(`student${i + 1}@marketplace.com`, 'password123')
            }))

            // Students perform actions concurrently
            console.log('⚡ Students browsing and booking...')
            const studentActions = students.map(async (student) => {
                try {
                    return await student.performActions()
                } catch (error) {
                    console.log(`${student.name} error: ${error}`)
                }
            })

            await Promise.all(studentActions)

            // Register agents with orchestrator for metrics
            for (const tutor of tutors) orchestrator.registerAgent(tutor)
            for (const student of students) orchestrator.registerAgent(student)

            const metrics = orchestrator.getAggregatedMetrics()

            console.log(`\n📊 Marketplace Metrics:`)
            console.log(`   Agents: ${tutors.length} tutors, ${students.length} students`)
            console.log(`   Total actions: ${metrics.totalActions}`)
            console.log(`   Success rate: ${(metrics.successRate * 100).toFixed(1)}%`)
            console.log(`   Avg response time: ${metrics.averageResponseTime.toFixed(0)}ms\n`)

            // Success criteria: High overall success rate
            expect(metrics.successRate).toBeGreaterThan(0.7)
            expect(metrics.totalActions).toBeGreaterThan(15)

        } finally {
            for (const tutor of tutors) await tutor.cleanup()
            for (const student of students) await student.cleanup()
        }
    })

    test('Scenario 6: Peak Load - 15 concurrent agents', async ({ browser }) => {
        // Increase timeout for this heavy test
        test.setTimeout(90000)

        console.log('\n🧪 Testing Peak Load (15 agents)...\n')

        const allAgents: Array<TutorAgent | StudentAgent> = []

        // Create 5 tutors
        for (let i = 0; i < 5; i++) {
            const pattern = ['active', 'flexible', 'conservative'][i % 3] as any
            const tutor = new TutorAgent(browser, `Tutor${i + 1}`, pattern)
            allAgents.push(tutor)
        }

        // Create 10 students
        for (let i = 0; i < 10; i++) {
            const pattern = ['eager', 'browsing', 'indecisive'][i % 3] as any
            const student = new StudentAgent(browser, `Student${i + 1}`, pattern)
            allAgents.push(student)
        }

        const startTime = Date.now()

        try {
            console.log('📦 Initializing 15 agents...')

            // Initialize all agents
            await Promise.all(allAgents.map(async (agent, i) => {
                await agent.initialize()
                const email = agent instanceof TutorAgent
                    ? `tutor${i + 1}@peak.com`
                    : `student${i - 4}@peak.com`
                await agent.login(email, 'password123')
                orchestrator.registerAgent(agent)
            }))

            console.log('✅ All agents initialized')

            // Execute all agents in parallel
            console.log('⚡ Executing peak load test...')
            const agentActions = allAgents.map(agent =>
                agent.performActions().catch(error => {
                    console.log(`${agent.name} failed: ${error}`)
                })
            )

            await Promise.all(agentActions)

            const duration = Date.now() - startTime

            const metrics = orchestrator.getAggregatedMetrics()

            console.log(`\n📊 Peak Load Results:`)
            console.log(`   Duration: ${(duration / 1000).toFixed(1)}s`)
            console.log(`   Agents: 15 (5 tutors, 10 students)`)
            console.log(`   Total actions: ${metrics.totalActions}`)
            console.log(`   Successful: ${metrics.totalActions * metrics.successRate}`)
            console.log(`   Success rate: ${(metrics.successRate * 100).toFixed(1)}%`)
            console.log(`   Avg response time: ${metrics.averageResponseTime.toFixed(0)}ms\n`)

            // Success criteria
            expect(duration).toBeLessThan(60000) // Complete within 60 seconds
            expect(metrics.successRate).toBeGreaterThan(0.6) // At least 60% success
            expect(metrics.averageResponseTime).toBeLessThan(3000) // < 3s average

        } finally {
            await orchestrator.cleanup()
            for (const agent of allAgents) {
                await agent.cleanup()
            }
        }
    })

    test('Scenario 7: Double Booking Prevention', async ({ browser }) => {
        console.log('\n🧪 Testing Double Booking Prevention...\n')

        const tutor = new TutorAgent(browser, 'SingleSlotTutor', 'active')
        const student1 = new StudentAgent(browser, 'StudentFast', 'eager')
        const student2 = new StudentAgent(browser, 'StudentSlow', 'eager')

        try {
            // Tutor creates exactly ONE slot
            await tutor.initialize()
            await tutor.login('single@test.com', 'password123')

            await tutor.setWeeklyAvailability({
                daysOfWeek: [1], // Only Monday
                startTime: '10:00',
                endTime: '11:00', // Only 1 hour = 1 slot
                duration: 60,
            })

            console.log('✅ Tutor created exactly 1 available slot')
            await new Promise(resolve => setTimeout(resolve, 2000))

            // Initialize both students
            await student1.initialize()
            await student2.initialize()

            await student1.login('fast@test.com', 'password123')
            await student2.login('slow@test.com', 'password123')

            // Both students try to book THE SAME slot simultaneously
            console.log('⚡ Both students attempting to book simultaneously...')

            const [result1, result2] = await Promise.all([
                (async () => {
                    await student1.browseTutors()
                    await student1.viewTutorProfile(0)
                    return await student1.bookAppointment()
                })(),
                (async () => {
                    await student2.browseTutors()
                    await student2.viewTutorProfile(0)
                    return await student2.bookAppointment()
                })(),
            ])

            console.log(`\n📊 Booking Results:`)
            console.log(`   Student1 (Fast): ${result1 ? '✅ SUCCESS' : '❌ FAILED'}`)
            console.log(`   Student2 (Slow): ${result2 ? '✅ SUCCESS' : '❌ FAILED'}\n`)

            // Critical: Only ONE should succeed
            const successCount = [result1, result2].filter(r => r).length

            expect(successCount).toBe(1) // Exactly one booking should succeed
            expect(result1 || result2).toBe(true) // At least one succeeded
            expect(result1 && result2).toBe(false) // But not both

            console.log('✅ Double booking prevention PASSED - only 1 student booked')

        } finally {
            await tutor.cleanup()
            await student1.cleanup()
            await student2.cleanup()
        }
    })
})
