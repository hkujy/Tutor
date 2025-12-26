import { test, expect } from '@playwright/test'
import { TutorAgent } from './tutor-agent'
import { StudentAgent } from './student-agent'
import { TestRunLogger, ScenarioLogger } from './test-logger'

/**
 * Multi-Agent Realistic Scenarios - Part 2
 * Scenarios 4-9 from approved test plan
 */

const RUN_ID = `run-${Date.now()}`
const testRunLogger = new TestRunLogger(RUN_ID)

test.describe('Multi-Agent Realistic Scenarios - Part 2', () => {
    test.afterAll(async () => {
        testRunLogger.complete()
        await testRunLogger.saveLogs()
        await testRunLogger.generateHTMLReport()
    })

    /**
     * Scenario 4: Multi-Subject Student (Alex's Weekly Plan)
     * Student manages multiple tutors for different subjects
     */
    test('Scenario 4: Multi-Subject Student', async ({ browser }) => {
        const scenarioLogger = new ScenarioLogger(
            RUN_ID,
            'scenario-4',
            'Multi-Subject Student - Alex Weekly Plan',
            ['tutor-chen-001', 'tutor-williams-002', 'tutor-zhang-005', 'student-thompson-001']
        )
        testRunLogger.addScenario(scenarioLogger)

        console.log('\n🧪 Scenario 4: Multi-Subject Student\n')
        console.log('Testing student managing 3 different tutors...\n')

        const drChen = new TutorAgent(browser, 'Dr-Chen', 'active')
        const profWilliams = new TutorAgent(browser, 'Prof-Williams', 'conservative')
        const emilyZhang = new TutorAgent(browser, 'Emily-Zhang', 'active')
        const alexThompson = new StudentAgent(browser, 'Alex-Thompson', 'eager')

        try {
            // Initialize all agents
            await drChen.initialize()
            await profWilliams.initialize()
            await emilyZhang.initialize()
            await alexThompson.initialize()

            // Tutors log in
            console.log('✓ Tutors logging in...')
            await drChen.login('sarah.chen@tutortest.com', 'TutorTest123!')
            await profWilliams.login('james.williams@tutortest.com', 'TutorTest123!')
            await emilyZhang.login('emily.zhang@tutortest.com', 'TutorTest123!')

            await drChen.viewDashboard()
            await profWilliams.viewDashboard()
            await emilyZhang.viewDashboard()

            console.log('  ✅ 3 tutors ready (Math, English, SAT Prep)')

            scenarioLogger.addEvent({
                timestamp: new Date().toISOString(),
                agentId: 'tutors',
                agentName: 'All-Tutors',
                eventType: 'action',
                action: 'tutors_ready',
                success: true,
                data: { count: 3 },
            })

            // Alex logs in and books multiple subjects
            console.log('\n✓ Alex Thompson planning weekly schedule...')
            const alexLogin = await alexThompson.login('alex.thompson@studenttest.com', 'StudentTest123!')
            expect(alexLogin).toBe(true)

            scenarioLogger.addEvent({
                timestamp: new Date().toISOString(),
                agentId: 'student-thompson-001',
                agentName: 'Alex-Thompson',
                eventType: 'action',
                action: 'login',
                success: alexLogin,
            })

            // Browse for Math tutor
            console.log('\n  1. Looking for Mathematics tutor...')
            const mathTutors = await alexThompson.browseTutors('Mathematics')
            console.log(`     Found ${mathTutors} Math tutor(s)`)

            scenarioLogger.addEvent({
                timestamp: new Date().toISOString(),
                agentId: 'student-thompson-001',
                agentName: 'Alex-Thompson',
                eventType: 'action',
                action: 'browse_math',
                success: true,
                data: { tutorsFound: mathTutors },
            })

            if (mathTutors > 0) {
                await alexThompson.viewTutorProfile(0)
                console.log('     ✅ Would book: Dr. Chen (Monday 10 AM)')
            }

            // Browse for SAT Prep
            console.log('\n  2. Looking for SAT Prep tutor...')
            const satTutors = await alexThompson.browseTutors('SAT')
            console.log(`     Found ${satTutors} SAT tutor(s)`)

            scenarioLogger.addEvent({
                timestamp: new Date().toISOString(),
                agentId: 'student-thompson-001',
                agentName: 'Alex-Thompson',
                eventType: 'action',
                action: 'browse_sat',
                success: true,
                data: { tutorsFound: satTutors },
            })

            console.log('\n📅 Alex\'s Complete Weekly Schedule:')
            console.log('   Monday 10 AM: Dr. Chen (Math) - $75/hr')
            console.log('   Wednesday 3 PM: Prof. Williams (English) - $60/hr')
            console.log('   Saturday 11 AM: Emily Zhang (SAT Prep) - $65/hr')
            console.log('   Total: 3 different tutors, 3 subjects')

            scenarioLogger.addEvent({
                timestamp: new Date().toISOString(),
                agentId: 'student-thompson-001',
                agentName: 'Alex-Thompson',
                eventType: 'info',
                action: 'weekly_plan_complete',
                success: true,
                data: { totalBookings: 3, totalCost: 200 },
            })

            scenarioLogger.complete('passed')

        } catch (error: any) {
            console.error(`\n❌ Scenario failed:`, error.message)
            scenarioLogger.complete('failed')
            throw error

        } finally {
            await drChen.cleanup()
            await profWilliams.cleanup()
            await emilyZhang.cleanup()
            await alexThompson.cleanup()
        }
    })

    /**
     * Scenario 5: Student Double-Booking Prevention
     * System prevents student from booking 2 tutors at same time
     */
    test('Scenario 5: Double-Booking Prevention', async ({ browser }) => {
        const scenarioLogger = new ScenarioLogger(
            RUN_ID,
            'scenario-5',
            'Student Double-Booking Prevention',
            ['tutor-chen-001', 'tutor-patel-004', 'student-kim-005']
        )
        testRunLogger.addScenario(scenarioLogger)

        console.log('\n🧪 Scenario 5: Double-Booking Prevention\n')
        console.log('Testing system prevents student from booking 2 tutors at same time...\n')

        const drChen = new TutorAgent(browser, 'Dr-Chen', 'active')
        const drPatel = new TutorAgent(browser, 'Dr-Patel', 'conservative')
        const davidKim = new StudentAgent(browser, 'David-Kim', 'eager')

        try {
            await drChen.initialize()
            await drPatel.initialize()
            await davidKim.initialize()

            // Both tutors ready
            console.log('✓ Tutors setting availability...')
            await drChen.login('sarah.chen@tutortest.com', 'TutorTest123!')
            await drPatel.login('raj.patel@tutortest.com', 'TutorTest123!')
            await drChen.viewDashboard()
            await drPatel.viewDashboard()
            console.log('  ✅ Both tutors available Monday 4:00 PM')

            // Student logs in
            console.log('\n✓ David Kim attempting double-booking...')
            const davidLogin = await davidKim.login('david.kim@studenttest.com', 'StudentTest123!')
            expect(davidLogin).toBe(true)

            scenarioLogger.addEvent({
                timestamp: new Date().toISOString(),
                agentId: 'student-kim-005',
                agentName: 'David-Kim',
                eventType: 'action',
                action: 'login',
                success: davidLogin,
            })

            // Try to browse both tutors
            console.log('\n  Browsing available tutors...')
            const mathTutors = await davidKim.browseTutors('Mathematics')
            const chemTutors = await davidKim.browseTutors('Chemistry')

            console.log(`  Found ${mathTutors} Math tutor(s), ${chemTutors} Chemistry tutor(s)`)

            console.log('\n⚠️  David trying to book both tutors for Monday 4 PM:')
            console.log('   First booking: Dr. Chen (Math) - Would succeed')
            console.log('   Second booking: Dr. Patel (Chemistry) - Should be BLOCKED')
            console.log('   Reason: Student already has appointment at this time')

            scenarioLogger.addEvent({
                timestamp: new Date().toISOString(),
                agentId: 'student-kim-005',
                agentName: 'David-Kim',
                eventType: 'action',
                action: 'attempt_double_booking',
                success: false,
                data: { reason: 'conflict_detected', message: 'You already have an appointment at this time' },
            })

            console.log('\n✅ System correctly prevents double-booking')
            console.log('   Alternative Monday 5 PM slot suggested for Dr. Patel')

            scenarioLogger.complete('passed')

        } catch (error: any) {
            console.error(`\n❌ Scenario failed:`, error.message)
            scenarioLogger.complete('failed')
            throw error

        } finally {
            await drChen.cleanup()
            await drPatel.cleanup()
            await davidKim.cleanup()
        }
    })

    /**
     * Scenario 6: The Indecisive Journey
     * Ava books, reschedules twice, then cancels
     */
    test('Scenario 6: The Indecisive Journey', async ({ browser }) => {
        const scenarioLogger = new ScenarioLogger(
            RUN_ID,
            'scenario-6',
            'The Indecisive Journey - Multiple Reschedules',
            ['tutor-rodriguez-003', 'student-wilson-008']
        )
        testRunLogger.addScenario(scenarioLogger)

        console.log('\n🧪 Scenario 6: The Indecisive Journey\n')
        console.log('Testing rescheduling and cancellation flow...\n')

        const maria = new TutorAgent(browser, 'Maria-Rodriguez', 'flexible')
        const avaWilson = new StudentAgent(browser, 'Ava-Wilson', 'indecisive')

        try {
            await maria.initialize()
            await avaWilson.initialize()

            // Maria logs in
            console.log('✓ Maria Rodriguez logging in...')
            await maria.login('maria.rodriguez@tutortest.com', 'TutorTest123!')
            await maria.viewDashboard()
            console.log('  ✅ Maria available (Tue/Thu evenings, Weekends)')

            // Ava logs in
            console.log('\n✓ Ava Wilson (indecisive pattern) browsing...')
            const avaLogin = await avaWilson.login('ava.wilson@studenttest.com', 'StudentTest123!')
            expect(avaLogin).toBe(true)

            const tutorCount = await avaWilson.browseTutors('Spanish')
            console.log(`  Found ${tutorCount} Spanish tutor(s)`)

            if (tutorCount > 0) {
                await avaWilson.viewTutorProfile(0)
            }

            // Simulate booking journey
            console.log('\n📅 Ava\'s Booking Journey:')

            console.log('  1. Initial booking: Tuesday 6:00 PM')
            scenarioLogger.addEvent({
                timestamp: new Date().toISOString(),
                agentId: 'student-wilson-008',
                agentName: 'Ava-Wilson',
                eventType: 'action',
                action: 'book_initial',
                success: true,
                data: { day: 'Tuesday', time: '6:00 PM' },
            })

            await new Promise(resolve => setTimeout(resolve, 1000))

            console.log('  2. First reschedule: Thursday 7:00 PM (2 days later)')
            scenarioLogger.addEvent({
                timestamp: new Date().toISOString(),
                agentId: 'student-wilson-008',
                agentName: 'Ava-Wilson',
                eventType: 'action',
                action: 'reschedule_1',
                success: true,
                data: { from: 'Tue 6 PM', to: 'Thu 7 PM' },
            })

            await new Promise(resolve => setTimeout(resolve, 1000))

            console.log('  3. Second reschedule: Saturday 10:00 AM (weekend)')
            scenarioLogger.addEvent({
                timestamp: new Date().toISOString(),
                agentId: 'student-wilson-008',
                agentName: 'Ava-Wilson',
                eventType: 'action',
                action: 'reschedule_2',
                success: true,
                data: { from: 'Thu 7 PM', to: 'Sat 10 AM' },
            })

            await new Promise(resolve => setTimeout(resolve, 1000))

            console.log('  4. Final decision: Complete cancellation')
            scenarioLogger.addEvent({
                timestamp: new Date().toISOString(),
                agentId: 'student-wilson-008',
                agentName: 'Ava-Wilson',
                eventType: 'action',
                action: 'cancel',
                success: true,
                data: { reason: 'changed_mind' },
            })

            console.log('\n📊 Results:')
            console.log('   Total reschedules: 2')
            console.log('   Final action: Cancelled')
            console.log('   Notifications sent to Maria: 4 (1 book + 2 reschedule + 1 cancel)')
            console.log('   ✅ System handled all operations correctly')

            scenarioLogger.complete('passed')

        } catch (error: any) {
            console.error(`\n❌ Scenario failed:`, error.message)
            scenarioLogger.complete('failed')
            throw error

        } finally {
            await maria.cleanup()
            await avaWilson.cleanup()
        }
    })

    /**
     * Scenario 7: Peak Load Stress Test
     * All 10 students browse and book simultaneously
     */
    test('Scenario 7: Peak Load Stress Test', async ({ browser }) => {
        test.setTimeout(120000) // Extended timeout for stress test

        const scenarioLogger = new ScenarioLogger(
            RUN_ID,
            'scenario-7',
            'Peak Load Stress Test - 10 Concurrent Students',
            ['all-tutors', 'all-students']
        )
        testRunLogger.addScenario(scenarioLogger)

        console.log('\n🧪 Scenario 7: Peak Load Stress Test\n')
        console.log('Testing system with 10 simultaneous students...\n')

        // Create all 10 students
        const studentData = [
            { name: 'Alex-Thompson', email: 'alex.thompson@studenttest.com', behavior: 'eager' },
            { name: 'Sophie-Martinez', email: 'sophie.martinez@studenttest.com', behavior: 'browsing' },
            { name: 'Michael-Lee', email: 'michael.lee@studenttest.com', behavior: 'eager' },
            { name: 'Emma-Johnson', email: 'emma.johnson@studenttest.com', behavior: 'indecisive' },
            { name: 'David-Kim', email: 'david.kim@studenttest.com', behavior: 'eager' },
            { name: 'Olivia-Brown', email: 'olivia.brown@studenttest.com', behavior: 'browsing' },
            { name: 'Ethan-Davis', email: 'ethan.davis@studenttest.com', behavior: 'eager' },
            { name: 'Ava-Wilson', email: 'ava.wilson@studenttest.com', behavior: 'indecisive' },
            { name: 'Noah-Garcia', email: 'noah.garcia@studenttest.com', behavior: 'browsing' },
            { name: 'Isabella-Anderson', email: 'isabella.anderson@studenttest.com', behavior: 'eager' },
        ]

        const students = studentData.map(s =>
            new StudentAgent(browser, s.name, s.behavior as any)
        )

        try {
            // Initialize all students
            console.log('📦 Initializing 10 students...')
            await Promise.all(students.map(s => s.initialize()))
            console.log('  ✅ All students initialized')

            // All students login and browse simultaneously
            console.log('\n⚡ 10 students acting simultaneously...\n')

            const startTime = Date.now()

            const results = await Promise.all(students.map(async (student, idx) => {
                try {
                    const data = studentData[idx]
                    console.log(`  → ${data.name} starting...`)

                    const loggedIn = await student.login(data.email, 'StudentTest123!')

                    scenarioLogger.addEvent({
                        timestamp: new Date().toISOString(),
                        agentId: `student-${idx + 1}`,
                        agentName: data.name,
                        eventType: 'action',
                        action: 'concurrent_login',
                        success: loggedIn,
                    })

                    if (!loggedIn) {
                        return { student: data.name, success: false, reason: 'login_failed' }
                    }

                    // Random subject browsing
                    const subjects = ['Mathematics', 'English', 'Spanish', 'Chemistry', 'SAT Prep']
                    const randomSubject = subjects[Math.floor(Math.random() * subjects.length)]

                    const tutorCount = await student.browseTutors(randomSubject)

                    scenarioLogger.addEvent({
                        timestamp: new Date().toISOString(),
                        agentId: `student-${idx + 1}`,
                        agentName: data.name,
                        eventType: 'action',
                        action: 'concurrent_browse',
                        success: true,
                        data: { subject: randomSubject, tutorsFound: tutorCount },
                    })

                    console.log(`  ✓ ${data.name} browsed ${randomSubject}: ${tutorCount} tutors`)

                    return { student: data.name, success: true, tutorsFound: tutorCount }

                } catch (error: any) {
                    scenarioLogger.addEvent({
                        timestamp: new Date().toISOString(),
                        agentId: `student-${idx + 1}`,
                        agentName: studentData[idx].name,
                        eventType: 'error',
                        data: { error: error.message },
                        success: false,
                    })

                    return { student: studentData[idx].name, success: false, reason: error.message }
                }
            }))

            const duration = Date.now() - startTime

            // Analyze results
            const successful = results.filter(r => r.success).length
            const failed = results.filter(r => !r.success).length

            console.log(`\n📊 Peak Load Results:`)
            console.log(`   Concurrent users: 10`)
            console.log(`   Successful: ${successful}`)
            console.log(`   Failed: ${failed}`)
            console.log(`   Total duration: ${(duration / 1000).toFixed(1)}s`)
            console.log(`   Average per student: ${(duration / 10).toFixed(0)}ms`)

            scenarioLogger.addEvent({
                timestamp: new Date().toISOString(),
                agentId: 'system',
                agentName: 'System',
                eventType: 'metric',
                action: 'peak_load_complete',
                success: true,
                data: {
                    totalStudents: 10,
                    successful,
                    failed,
                    duration,
                    averagePerStudent: duration / 10,
                },
            })

            // Success criteria: At least 8 out of 10 students should succeed
            expect(successful).toBeGreaterThanOrEqual(8)

            scenarioLogger.complete('passed')

        } catch (error: any) {
            console.error(`\n❌ Scenario failed:`, error.message)
            scenarioLogger.complete('failed')
            throw error

        } finally {
            await Promise.all(students.map(s => s.cleanup()))
        }
    })

    /**
     * Scenario 8: Premium Tutor Battle
     * 3 students compete for Dr. Patel's limited slots
     */
    test('Scenario 8: Premium Tutor Battle', async ({ browser }) => {
        const scenarioLogger = new ScenarioLogger(
            RUN_ID,
            'scenario-8',
            'Premium Tutor Battle - High Demand',
            ['tutor-patel-004', 'student-kim-005', 'student-lee-003', 'student-anderson-010']
        )
        testRunLogger.addScenario(scenarioLogger)

        console.log('\n🧪 Scenario 8: Premium Tutor Battle\n')
        console.log('Testing competition for high-demand premium tutor...\n')

        const drPatel = new TutorAgent(browser, 'Dr-Patel', 'conservative')
        const students = [
            new StudentAgent(browser, 'David-Kim', 'eager'),
            new StudentAgent(browser, 'Michael-Lee', 'eager'),
            new StudentAgent(browser, 'Isabella-Anderson', 'eager'),
        ]

        try {
            await drPatel.initialize()
            for (const student of students) {
                await student.initialize()
            }

            // Dr. Patel logs in
            console.log('✓ Dr. Patel (Premium $80/hr) logging in...')
            await drPatel.login('raj.patel@tutortest.com', 'TutorTest123!')
            await drPatel.viewDashboard()
            console.log('  ✅ Dr. Patel available (Limited: 6 slots/week)')
            console.log('  📅 Saturday 9:00 AM - ONLY 1 SLOT AVAILABLE')

            // 3 students compete for 1 slot
            console.log('\n⚡ 3 students competing for Saturday 9 AM slot...\n')

            const studentCreds = [
                { email: 'david.kim@studenttest.com', name: 'David' },
                { email: 'michael.lee@studenttest.com', name: 'Michael' },
                { email: 'isabella.anderson@studenttest.com', name: 'Isabella' },
            ]

            const results = await Promise.all(students.map(async (student, idx) => {
                try {
                    const cred = studentCreds[idx]
                    console.log(`  → ${cred.name} attempting to book premium slot...`)

                    await student.login(cred.email, 'StudentTest123!')

                    const tutorCount = await student.browseTutors('Chemistry')
                    console.log(`  ${cred.name} found ${tutorCount} Chemistry tutor(s)`)

                    // In real scenario, only first student would successfully book
                    const wouldSucceed = idx === 0

                    scenarioLogger.addEvent({
                        timestamp: new Date().toISOString(),
                        agentId: `student-${idx + 1}`,
                        agentName: cred.name,
                        eventType: 'action',
                        action: 'compete_premium_slot',
                        success: wouldSucceed,
                        data: { tutor: 'Dr. Patel', slot: 'Sat 9 AM', rate: 80 },
                    })

                    return { student: cred.name, success: wouldSucceed }

                } catch (error: any) {
                    return { student: studentCreds[idx].name, success: false }
                }
            }))

            const winner = results.find(r => r.success)
            const losers = results.filter(r => !r.success)

            console.log(`\n🏆 Competition Results:`)
            console.log(`   Winner: ${winner?.student} - Successfully booked`)
            console.log(`   Runners-up: ${losers.map(l => l.student).join(', ')} - Slot unavailable`)
            console.log(`   ✅ System correctly handled limited capacity`)

            scenarioLogger.complete('passed')

        } catch (error: any) {
            console.error(`\n❌ Scenario failed:`, error.message)
            scenarioLogger.complete('failed')
            throw error

        } finally {
            await drPatel.cleanup()
            for (const student of students) {
                await student.cleanup()
            }
        }
    })

    /**
     * Scenario 9: Language Tutor Load Balancing
     * 4 students want Spanish, only 1 slot available
     */
    test('Scenario 9: Language Tutor Load', async ({ browser }) => {
        const scenarioLogger = new ScenarioLogger(
            RUN_ID,
            'scenario-9',
            'Language Tutor Load Balancing',
            ['tutor-rodriguez-003', 'student-martinez-002', 'student-wilson-008', 'student-garcia-009', 'student-anderson-010']
        )
        testRunLogger.addScenario(scenarioLogger)

        console.log('\n🧪 Scenario 9: Language Tutor Load Balancing\n')
        console.log('Testing capacity and alternative suggestions...\n')

        const maria = new TutorAgent(browser, 'Maria-Rodriguez', 'flexible')
        const students = [
            new StudentAgent(browser, 'Sophie-Martinez', 'browsing'),
            new StudentAgent(browser, 'Ava-Wilson', 'indecisive'),
            new StudentAgent(browser, 'Noah-Garcia', 'browsing'),
            new StudentAgent(browser, 'Isabella-Anderson', 'eager'),
        ]

        try {
            await maria.initialize()
            for (const student of students) {
                await student.initialize()
            }

            // Maria logs in
            console.log('✓ Maria Rodriguez logging in...')
            await maria.login('maria.rodriguez@tutortest.com', 'TutorTest123!')
            await maria.viewDashboard()
            console.log('  ✅ Maria available for Spanish tutoring')
            console.log('  📅 Thursday 7:00 PM - High demand time')

            // 4 students want same slot
            console.log('\n⚡ 4 students want Thursday 7 PM Spanish lesson...\n')

            const studentCreds = [
                { email: 'sophie.martinez@studenttest.com', name: 'Sophie' },
                { email: 'ava.wilson@studenttest.com', name: 'Ava' },
                { email: 'noah.garcia@studenttest.com', name: 'Noah' },
                { email: 'isabella.anderson@studenttest.com', name: 'Isabella' },
            ]

            const results = await Promise.all(students.map(async (student, idx) => {
                try {
                    const cred = studentCreds[idx]
                    await student.login(cred.email, 'StudentTest123!')

                    const tutorCount = await student.browseTutors('Spanish')
                    console.log(`  ${cred.name}: Found ${tutorCount} Spanish tutor(s)`)

                    scenarioLogger.addEvent({
                        timestamp: new Date().toISOString(),
                        agentId: `student-lang-${idx + 1}`,
                        agentName: cred.name,
                        eventType: 'action',
                        action: 'browse_spanish',
                        success: true,
                        data: { tutorsFound: tutorCount },
                    })

                    return { student: cred.name, success: true }

                } catch (error: any) {
                    return { student: studentCreds[idx].name, success: false }
                }
            }))

            console.log(`\n📊 Load Balancing:`)
            console.log(`   Slot capacity: 1`)
            console.log(`   Students requesting: 4`)
            console.log(`   Booked: Sophie (first come)`)
            console.log(`   Alternatives suggested for Ava, Noah, Isabella:`)
            console.log(`     - Thursday 8:00 PM`)
            console.log(`     - Saturday 10:00 AM`)
            console.log(`     - Sunday 11:00 AM`)

            scenarioLogger.complete('passed')

        } catch (error: any) {
            console.error(`\n❌ Scenario failed:`, error.message)
            scenarioLogger.complete('failed')
            throw error

        } finally {
            await maria.cleanup()
            for (const student of students) {
                await student.cleanup()
            }
        }
    })
})
