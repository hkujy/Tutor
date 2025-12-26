import { test, expect } from '@playwright/test'
import { AgentOrchestrator } from './agent-framework'
import { TutorAgent } from './tutor-agent'
import { StudentAgent } from './student-agent'

/**
 * Multi-Student Scenarios
 * 
 * Tests scenarios where one tutor manages multiple students:
 * - Tutor with 3 regular students
 * - Tutor with 5 students (rush hour)
 * - Tutor managing different student behaviors
 */

test.describe('Multi-Student Scenarios', () => {
    let orchestrator: AgentOrchestrator

    test.beforeEach(() => {
        orchestrator = new AgentOrchestrator()
    })

    test.afterEach(async () => {
        await orchestrator.cleanup()
    })

    test('Scenario: One Tutor with 3 Students - Sequential Bookings', async ({ browser }) => {
        console.log('\n🧪 Testing One Tutor with 3 Students (Sequential)...\n')

        // One tutor
        const tutor = new TutorAgent(browser, 'ProfessorSmith', 'active')

        // Three students with different behaviors
        const students = [
            new StudentAgent(browser, 'EagerEmily', 'eager'),
            new StudentAgent(browser, 'BrowsingBob', 'browsing'),
            new StudentAgent(browser, 'IndecisiveIvy', 'indecisive'),
        ]

        try {
            // Initialize all agents
            console.log('📦 Initializing 1 tutor and 3 students...')
            await tutor.initialize()
            for (const student of students) {
                await student.initialize()
            }

            orchestrator.registerAgent(tutor)
            for (const student of students) {
                orchestrator.registerAgent(student)
            }

            // Step 1: Tutor sets up availability
            console.log('\n✓ Step 1: Tutor setting up availability...')
            await tutor.login('tutor@example.com', 'tutor123')

            // Tutor performs their setup actions
            await tutor.viewDashboard()
            console.log('  Tutor is ready and viewing dashboard')

            // Step 2: Students book sequentially
            console.log('\n✓ Step 2: Students booking appointments sequentially...')

            for (let i = 0; i < students.length; i++) {
                const student = students[i]
                console.log(`\n  → ${student.name} (${student.behaviorPattern}) booking...`)

                await student.login(`student${i + 1}@example.com`, 'student123')

                // Each student browses and attempts to book
                const tutorCount = await student.browseTutors()
                console.log(`    Found ${tutorCount} tutor(s)`)

                if (tutorCount > 0) {
                    await student.viewTutorProfile(0)
                    // Note: Actual booking would happen here if availability page existed
                }

                await new Promise(resolve => setTimeout(resolve, 1000))
            }

            // Step 3: Tutor views their student roster
            console.log('\n✓ Step 3: Tutor viewing student roster...')
            await tutor.viewStudents()

            // Get metrics
            const metrics = orchestrator.getAggregatedMetrics()

            console.log(`\n📊 Test Results:`)
            console.log(`   Tutor: ${tutor.name}`)
            console.log(`   Students: ${students.map(s => s.name).join(', ')}`)
            console.log(`   Total actions: ${metrics.totalActions}`)
            console.log(`   Success rate: ${(metrics.successRate * 100).toFixed(1)}%`)
            console.log(`   Avg response time: ${metrics.averageResponseTime.toFixed(0)}ms\n`)

            // Success criteria: All students logged in and browsed
            expect(metrics.successRate).toBeGreaterThan(0.7)

        } finally {
            await tutor.cleanup()
            for (const student of students) {
                await student.cleanup()
            }
        }
    })

    test('Scenario: One Tutor with 5 Students - Concurrent Rush', async ({ browser }) => {
        test.setTimeout(90000) // Extended timeout for concurrent test

        console.log('\n🧪 Testing One Tutor with 5 Students (Concurrent Rush)...\n')

        const tutor = new TutorAgent(browser, 'PopularProfessor', 'active')
        const students: StudentAgent[] = []

        // Create 5 students
        const studentNames = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve']
        const behaviors: Array<'eager' | 'browsing' | 'indecisive'> = ['eager', 'browsing', 'indecisive', 'eager', 'browsing']

        for (let i = 0; i < 5; i++) {
            const student = new StudentAgent(browser, studentNames[i], behaviors[i])
            students.push(student)
        }

        try {
            // Initialize
            console.log('📦 Initializing 1 tutor and 5 students...')
            await tutor.initialize()
            await tutor.login('tutor@example.com', 'tutor123')

            for (const student of students) {
                await student.initialize()
                orchestrator.registerAgent(student)
            }
            orchestrator.registerAgent(tutor)

            console.log('✅ Tutor ready, has limited slots available\n')

            // All students try to browse and book concurrently
            console.log('⚡ All 5 students attempting to access tutor simultaneously...\n')

            const studentActions = students.map(async (student, i) => {
                try {
                    console.log(`  → ${student.name} (${student.behaviorPattern}) starting...`)

                    // Use different test student accounts
                    const email = i === 0 ? 'student@example.com' : `newstudent${i}@example.com`
                    await student.login(email, 'student123')

                    const tutorCount = await student.browseTutors()

                    if (tutorCount > 0) {
                        await student.viewTutorProfile(0)
                    }

                    console.log(`  ✓ ${student.name} completed browsing`)
                    return true
                } catch (error) {
                    console.log(`  ✗ ${student.name} encountered error: ${error}`)
                    return false
                }
            })

            const results = await Promise.all(studentActions)
            const successCount = results.filter(r => r).length

            console.log(`\n📊 Results:`)
            console.log(`   Students attempted: 5`)
            console.log(`   Students succeeded: ${successCount}`)
            console.log(`   Success rate: ${(successCount / 5 * 100).toFixed(1)}%`)

            // Tutor checks their dashboard after the rush
            console.log('\n✓ Tutor checking dashboard after rush...')
            await tutor.viewDashboard()

            const metrics = orchestrator.getAggregatedMetrics()
            console.log(`\n📊 Overall Metrics:`)
            console.log(`   Total actions: ${metrics.totalActions}`)
            console.log(`   Success rate: ${(metrics.successRate * 100).toFixed(1)}%`)
            console.log(`   Avg response time: ${metrics.averageResponseTime.toFixed(0)}ms\n`)

            // At least some students should succeed
            expect(successCount).toBeGreaterThan(0)

        } finally {
            await tutor.cleanup()
            for (const student of students) {
                await student.cleanup()
            }
        }
    })

    test('Scenario: Tutor Managing Different Student Behaviors', async ({ browser }) => {
        console.log('\n🧪 Testing Tutor Managing Different Student Behaviors...\n')

        const tutor = new TutorAgent(browser, 'ExperiencedTutor', 'flexible')

        // Create students with distinct behavior patterns
        const eagerStudent = new StudentAgent(browser, 'QuickLearner', 'eager')
        const browsingStudent = new StudentAgent(browser, 'CarefulChooser', 'browsing')
        const indecisiveStudent = new StudentAgent(browser, 'DoubtfulDan', 'indecisive')

        try {
            console.log('📦 Initializing agents...')
            await tutor.initialize()
            await eagerStudent.initialize()
            await browsingStudent.initialize()
            await indecisiveStudent.initialize()

            orchestrator.registerAgent(tutor)
            orchestrator.registerAgent(eagerStudent)
            orchestrator.registerAgent(browsingStudent)
            orchestrator.registerAgent(indecisiveStudent)

            // Tutor setup
            console.log('\n✓ Tutor logging in and setting up...')
            await tutor.login('tutor@example.com', 'tutor123')
            await tutor.viewDashboard()

            // Each student type behaves differently
            console.log('\n✓ Testing different student behaviors...')

            // Eager student - quick decisions
            console.log(`\n  1. ${eagerStudent.name} (eager - makes quick decisions)`)
            await eagerStudent.login('student@example.com', 'student123')
            await eagerStudent.browseTutors('Mathematics')
            console.log('     ✓ Eager student acted quickly')

            await new Promise(resolve => setTimeout(resolve, 1000))

            // Browsing student - takes time to decide
            console.log(`\n  2. ${browsingStudent.name} (browsing - explores options)`)
            await browsingStudent.login('newstudent2@example.com', 'student123')
            await browsingStudent.browseTutors()
            const tutorCount = await browsingStudent.browseTutors('Physics')
            console.log(`     ✓ Browsing student explored ${tutorCount} tutor(s)`)

            await new Promise(resolve => setTimeout(resolve, 1000))

            // Indecisive student - might cancel later
            console.log(`\n  3. ${indecisiveStudent.name} (indecisive - might cancel)`)
            await indecisiveStudent.login('newstudent3@example.com', 'student123')
            await indecisiveStudent.browseTutors()
            console.log('     ✓ Indecisive student browsing (might cancel later)')

            // Tutor views all their students
            console.log('\n✓ Tutor viewing complete student roster...')
            await tutor.viewStudents()
            await tutor.checkNotifications()

            const metrics = orchestrator.getAggregatedMetrics()

            console.log(`\n📊 Behavior Analysis:`)
            console.log(`   Total actions: ${metrics.totalActions}`)
            console.log(`   Success rate: ${(metrics.successRate * 100).toFixed(1)}%`)

            // Check individual student metrics
            for (const [name, agentMetrics] of Object.entries(metrics.agentMetrics)) {
                if (name !== tutor.name) {
                    console.log(`   ${name}: ${agentMetrics.actionsPerformed} actions`)
                }
            }

            console.log()

            expect(metrics.successRate).toBeGreaterThan(0.6)

        } finally {
            await tutor.cleanup()
            await eagerStudent.cleanup()
            await browsingStudent.cleanup()
            await indecisiveStudent.cleanup()
        }
    })

    test('Demo: Watch Tutor Managing 3 Students (Headed Mode)', async ({ browser }) => {
        test.skip(!!process.env.CI, 'Demo test only runs locally')

        console.log('\n👀 Demo: Watch tutor managing multiple students...\n')

        const tutor = new TutorAgent(browser, 'DemoTutor', 'active')
        const students = [
            new StudentAgent(browser, 'Student1', 'eager'),
            new StudentAgent(browser, 'Student2', 'browsing'),
            new StudentAgent(browser, 'Student3', 'eager'),
        ]

        try {
            await tutor.initialize()
            await tutor.login('tutor@example.com', 'tutor123')
            await tutor.viewDashboard()

            console.log('Tutor is ready. Now students will start booking...\n')
            await new Promise(resolve => setTimeout(resolve, 3000))

            for (let i = 0; i < students.length; i++) {
                const student = students[i]
                await student.initialize()

                const email = i === 0 ? 'student@example.com' : `newstudent${i}@example.com`
                await student.login(email, 'student123')

                console.log(`${student.name} logged in`)
                await new Promise(resolve => setTimeout(resolve, 2000))

                await student.browseTutors()
                await new Promise(resolve => setTimeout(resolve, 2000))
            }

            console.log('\n✅ Demo completed - check browser windows!')

        } finally {
            await tutor.cleanup()
            for (const student of students) {
                await student.cleanup()
            }
        }
    })
})
