/**
 * Quick test to verify agent framework works
 * This test doesn't require login - just tests the agent infrastructure
 */
import { test, expect } from '@playwright/test'
import { TutorAgent } from './tutor-agent'
import { StudentAgent } from './student-agent'
import { AgentOrchestrator } from './agent-framework'

test.describe('Agent Framework Verification', () => {
    test('Agent initialization and basic functionality', async ({ browser }) => {
        console.log('\n🧪 Testing Agent Framework...\n')

        const orchestrator = new AgentOrchestrator()
        const tutor = new TutorAgent(browser, 'TestTutor', 'active')
        const student = new StudentAgent(browser, 'TestStudent', 'eager')

        try {
            // Test 1: Agent initialization
            console.log('✓ Test 1: Initializing agents...')
            await tutor.initialize()
            await student.initialize()
            expect(tutor.page).toBeDefined()
            expect(student.page).toBeDefined()
            console.log('  ✅ Both agents initialized successfully')

            // Test 2: Navigation
            console.log('\n✓ Test 2: Testing navigation...')
            await tutor.navigateTo('/en/login')
            await student.navigateTo('/en/login')
            expect(tutor.getState().currentPage).toContain('/login')
            expect(student.getState().currentPage).toContain('/login')
            console.log('  ✅ Navigation working correctly')

            // Test 3: Decision making
            console.log('\n✓ Test 3: Testing autonomous decision-making...')
            const randomChoice = tutor.decide({
                choices: ['Math', 'Physics', 'Chemistry'],
                strategy: 'random',
            })
            expect(['Math', 'Physics', 'Chemistry']).toContain(randomChoice)
            console.log(`  ✅ Random decision: ${randomChoice}`)

            const weightedChoice = tutor.decide({
                choices: [1, 2, 3],
                weights: [0.5, 0.3, 0.2],
                strategy: 'weighted',
            })
            expect([1, 2, 3]).toContain(weightedChoice)
            console.log(`  ✅ Weighted decision: ${weightedChoice}`)

            // Test 4: Orchestrator
            console.log('\n✓ Test 4: Testing orchestrator...')
            orchestrator.registerAgent(tutor)
            orchestrator.registerAgent(student)
            orchestrator.setSharedState('testKey', 'testValue')
            expect(orchestrator.getSharedState('testKey')).toBe('testValue')
            console.log('  ✅ Orchestrator managing agents correctly')

            // Test 5: Metrics
            console.log('\n✓ Test 5: Testing metrics collection...')
            const metrics = orchestrator.getAggregatedMetrics()
            expect(metrics).toHaveProperty('totalActions')
            expect(metrics).toHaveProperty('successRate')
            expect(metrics).toHaveProperty('averageResponseTime')
            console.log('  ✅ Metrics collection working')
            console.log(`     Actions: ${metrics.totalActions}, Success rate: ${metrics.successRate}`)

            // Test 6: State tracking
            console.log('\n✓ Test 6: Testing state tracking...')
            const tutorState = tutor.getState()
            const studentState = student.getState()
            expect(tutorState.role).toBe('tutor')
            expect(studentState.role).toBe('student')
            expect(tutorState.isLoggedIn).toBe(false)
            expect(studentState.isLoggedIn).toBe(false)
            console.log('  ✅ State tracking accurate')

            // Test 7: Behavior patterns
            console.log('\n✓ Test 7: Testing behavior patterns...')
            expect(tutor.behaviorPattern).toBe('active')
            expect(student.behaviorPattern).toBe('eager')
            console.log('  ✅ Behavior patterns correctly set')

            console.log('\n✅ All agent framework tests passed!\n')

        } finally {
            await tutor.cleanup()
            await student.cleanup()
            await orchestrator.cleanup()
        }
    })

    test('Agent concurrent coordination', async ({ browser }) => {
        console.log('\n🧪 Testing Concurrent Agent Coordination...\n')

        const orchestrator = new AgentOrchestrator()
        const agents = []

        // Create 3 agents
        for (let i = 0; i < 3; i++) {
            const agent = new StudentAgent(browser, `Agent${i + 1}`, 'eager')
            await agent.initialize()
            orchestrator.registerAgent(agent)
            agents.push(agent)
        }

        try {
            console.log('✓ Created and registered 3 agents')

            // All agents navigate concurrently
            console.log('\n✓ Testing concurrent navigation...')
            await Promise.all(agents.map(agent => agent.navigateTo('/en/login')))

            // Verify all navigated successfully
            for (const agent of agents) {
                expect(agent.getState().currentPage).toContain('/login')
            }
            console.log('  ✅ All 3 agents navigated concurrently')

            // Check orchestrator metrics
            const metrics = orchestrator.getAggregatedMetrics()
            console.log(`\n✓ Orchestrator metrics:`)
            console.log(`  Total actions: ${metrics.totalActions}`)
            console.log(`  Agents managed: ${Object.keys(metrics.agentMetrics).length}`)

            expect(Object.keys(metrics.agentMetrics).length).toBe(3)
            console.log('  ✅ Orchestrator correctly tracking 3 agents')

            console.log('\n✅ Concurrent coordination test passed!\n')

        } finally {
            for (const agent of agents) {
                await agent.cleanup()
            }
            await orchestrator.cleanup()
        }
    })
})
