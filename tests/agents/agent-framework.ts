import { Browser, BrowserContext, Page } from '@playwright/test'

/**
 * Agent state tracks the current status of an agent
 */
export interface AgentState {
    userId?: string
    email?: string
    role: 'student' | 'tutor'
    isLoggedIn: boolean
    currentPage?: string
    sessionData: Record<string, any>
    metrics: AgentMetrics
}

/**
 * Performance metrics for agent actions
 */
export interface AgentMetrics {
    actionsPerformed: number
    successfulActions: number
    failedActions: number
    totalResponseTime: number
    actionTimestamps: Array<{ action: string; timestamp: number; duration: number }>
}

/**
 * Decision options for agent behavior
 */
export interface DecisionOptions<T> {
    choices: T[]
    weights?: number[] // Optional weights for weighted random selection
    strategy?: 'random' | 'weighted' | 'sequential' | 'first'
}

/**
 * BaseAgent - Abstract base class for all testing agents
 * 
 * Provides common functionality for browser automation, authentication,
 * state management, and autonomous decision-making.
 */
export abstract class BaseAgent {
    protected browser: Browser
    protected context?: BrowserContext
    protected page?: Page
    protected state: AgentState
    public name: string
    public behaviorPattern: string

    constructor(browser: Browser, name: string, role: 'student' | 'tutor') {
        this.browser = browser
        this.name = name
        this.state = {
            role,
            isLoggedIn: false,
            sessionData: {},
            metrics: {
                actionsPerformed: 0,
                successfulActions: 0,
                failedActions: 0,
                totalResponseTime: 0,
                actionTimestamps: [],
            },
        }
        this.behaviorPattern = 'default'
    }

    /**
     * Initialize browser context and page for this agent
     */
    async initialize(): Promise<void> {
        this.log('Initializing agent')
        this.context = await this.browser.newContext({
            viewport: { width: 1280, height: 720 },
            locale: 'en-US',
        })
        this.page = await this.context.newPage()

        // Add request/response tracking for performance metrics
        this.page.on('response', (response) => {
            if (response.request().resourceType() === 'document') {
                this.log(`Page loaded: ${response.url()} (${response.status()})`)
            }
        })
    }

    /**
     * Login to the application
     * FIXED: Uses correct selectors and waits for NextAuth async flow
     */
    async login(email: string, password: string): Promise<boolean> {
        const actionName = 'login'
        const startTime = Date.now()

        try {
            if (!this.page) throw new Error('Agent not initialized')

            this.log(`Logging in as ${email}`)

            // Navigate to login page
            await this.page.goto('/en/login')
            await this.page.waitForLoadState('networkidle')

            // FIXED: Use correct ID selectors (not name selectors!)
            await this.page.fill('#email', email)
            await this.humanDelay(200, 500)

            await this.page.fill('#password', password)
            await this.humanDelay(200, 500)

            // FIXED: Wait for auth callback response instead of URL change
            try {
                const [response] = await Promise.all([
                    // Wait for NextAuth callback
                    this.page.waitForResponse(
                        resp => resp.url().includes('/api/auth/callback/credentials'),
                        { timeout: 15000 }
                    ),
                    // Submit form
                    this.page.click('button[type="submit"]')
                ])

                // Check if auth succeeded
                const authSucceeded = response.status() === 200

                if (!authSucceeded) {
                    this.log('Login failed: Auth callback returned non-200 status', 'warn')
                    this.recordAction(actionName, startTime, false)
                    return false
                }

                // FIXED: Wait for client-side React Router navigation
                // The app does: signIn() → fetch session → router.push()
                await this.page.waitForTimeout(2000)

                // IMPROVED: Check if we successfully navigated away from login
                const currentUrl = this.page.url()
                const isLoggedIn = (currentUrl.includes('/student') ||
                    currentUrl.includes('/tutor')) &&
                    !currentUrl.includes('/login')

                if (isLoggedIn) {
                    this.state.isLoggedIn = true
                    this.state.email = email
                    this.state.currentPage = currentUrl
                    this.recordAction(actionName, startTime, true)
                    this.log(`Successfully logged in, redirected to: ${currentUrl}`)
                    return true
                }

                // Check for error message on page
                const errorVisible = await this.page.locator('text=/invalid.*email.*password/i').count() > 0
                if (errorVisible) {
                    this.log('Login failed: Invalid credentials message visible', 'warn')
                } else {
                    this.log(`Login unclear: on ${currentUrl}`, 'warn')
                }

                this.recordAction(actionName, startTime, false)
                return false

            } catch (timeoutError) {
                this.log('Login timeout: Auth callback did not respond', 'error')
                await this.screenshot('login-timeout')
                this.recordAction(actionName, startTime, false)
                return false
            }

        } catch (error) {
            this.recordAction(actionName, startTime, false)
            this.log(`Login failed: ${error}`, 'error')

            // Take screenshot for debugging
            await this.screenshot('login-error')

            return false
        }
    }

    /**
     * Logout from the application
     */
    async logout(): Promise<void> {
        const actionName = 'logout'
        const startTime = Date.now()

        try {
            if (!this.page) throw new Error('Agent not initialized')

            this.log('Logging out')

            // Use the data-testid we just added
            try {
                await this.page.click('[data-testid="logout-button"]')
            } catch {
                // Fallback: try mobile logout button or text-based selector
                try {
                    await this.page.click('[data-testid="logout-button-mobile"]')
                } catch {
                    await this.page.click('button:has-text("Logout"), button:has-text("Sign out")')
                }
            }

            await this.page.waitForURL(/\/(en|zh)\/(login|$)/, { timeout: 5000 })

            this.state.isLoggedIn = false
            this.state.userId = undefined
            this.state.email = undefined

            this.recordAction(actionName, startTime, true)
            this.log('Successfully logged out')
        } catch (error) {
            this.recordAction(actionName, startTime, false)
            this.log(`Logout failed: ${error}`, 'error')
        }
    }

    /**
     * Navigate to a specific page
     */
    async navigateTo(path: string): Promise<void> {
        if (!this.page) throw new Error('Agent not initialized')

        this.log(`Navigating to ${path}`)
        await this.page.goto(path)
        await this.page.waitForLoadState('networkidle')
        this.state.currentPage = this.page.url()
    }

    /**
     * Make a decision from multiple options
     * Supports random, weighted, sequential, or first-choice strategies
     */
    protected decide<T>(options: DecisionOptions<T>): T {
        const { choices, weights, strategy = 'random' } = options

        if (choices.length === 0) {
            throw new Error('Cannot decide from empty choices')
        }

        switch (strategy) {
            case 'first':
                return choices[0]

            case 'sequential':
                // Use action count to cycle through choices
                const index = this.state.metrics.actionsPerformed % choices.length
                return choices[index]

            case 'weighted':
                if (!weights || weights.length !== choices.length) {
                    throw new Error('Weighted strategy requires weights array matching choices length')
                }
                return this.weightedRandom(choices, weights)

            case 'random':
            default:
                return choices[Math.floor(Math.random() * choices.length)]
        }
    }

    /**
     * Weighted random selection
     */
    private weightedRandom<T>(choices: T[], weights: number[]): T {
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)
        let random = Math.random() * totalWeight

        for (let i = 0; i < choices.length; i++) {
            random -= weights[i]
            if (random <= 0) {
                return choices[i]
            }
        }

        return choices[choices.length - 1]
    }

    /**
     * Simulate human-like delay
     */
    protected async humanDelay(minMs: number = 100, maxMs: number = 500): Promise<void> {
        const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs
        await new Promise((resolve) => setTimeout(resolve, delay))
    }

    /**
     * Record an action's performance
     */
    protected recordAction(action: string, startTime: number, success: boolean): void {
        const duration = Date.now() - startTime

        this.state.metrics.actionsPerformed++
        if (success) {
            this.state.metrics.successfulActions++
        } else {
            this.state.metrics.failedActions++
        }
        this.state.metrics.totalResponseTime += duration
        this.state.metrics.actionTimestamps.push({
            action,
            timestamp: startTime,
            duration,
        })
    }

    /**
     * Get agent performance metrics
     */
    getMetrics(): AgentMetrics {
        return { ...this.state.metrics }
    }

    /**
     * Get current agent state
     */
    getState(): AgentState {
        return { ...this.state }
    }

    /**
     * Logging utility
     */
    protected log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
        const timestamp = new Date().toISOString()
        const prefix = `[${timestamp}] [${this.name}] [${this.state.role}]`

        switch (level) {
            case 'error':
                console.error(`${prefix} ❌ ${message}`)
                break
            case 'warn':
                console.warn(`${prefix} ⚠️  ${message}`)
                break
            case 'info':
            default:
                console.log(`${prefix} ℹ️  ${message}`)
        }
    }

    /**
     * Capture screenshot for debugging
     */
    async screenshot(name: string): Promise<void> {
        if (!this.page) return

        const timestamp = Date.now()
        const filename = `screenshots/${this.name}-${name}-${timestamp}.png`
        await this.page.screenshot({ path: filename, fullPage: true })
        this.log(`Screenshot saved: ${filename}`)
    }

    /**
     * Clean up resources
     */
    async cleanup(): Promise<void> {
        this.log('Cleaning up agent resources')

        if (this.state.isLoggedIn) {
            await this.logout()
        }

        if (this.page) {
            await this.page.close()
        }

        if (this.context) {
            await this.context.close()
        }
    }

    /**
     * Abstract method - subclasses must implement their main action logic
     */
    abstract performActions(): Promise<void>
}

/**
 * AgentOrchestrator - Coordinates multiple agents for scenario testing
 */
export class AgentOrchestrator {
    private agents: Map<string, BaseAgent> = new Map()
    private sharedState: Map<string, any> = new Map()
    private startTime?: number

    constructor() {
        this.log('Orchestrator initialized')
    }

    /**
     * Register an agent
     */
    registerAgent(agent: BaseAgent): void {
        this.agents.set(agent.name, agent)
        this.log(`Registered agent: ${agent.name}`)
    }

    /**
     * Get an agent by name
     */
    getAgent(name: string): BaseAgent | undefined {
        return this.agents.get(name)
    }

    /**
     * Set shared state accessible to all agents
     */
    setSharedState(key: string, value: any): void {
        this.sharedState.set(key, value)
    }

    /**
     * Get shared state
     */
    getSharedState(key: string): any {
        return this.sharedState.get(key)
    }

    /**
     * Execute agents in parallel
     */
    async executeParallel(agentNames: string[]): Promise<void> {
        this.startTime = Date.now()
        this.log(`Executing ${agentNames.length} agents in parallel`)

        const promises = agentNames.map(async (name) => {
            const agent = this.agents.get(name)
            if (!agent) {
                throw new Error(`Agent ${name} not found`)
            }

            try {
                await agent.performActions()
            } catch (error) {
                this.log(`Agent ${name} failed: ${error}`, 'error')
                throw error
            }
        })

        await Promise.all(promises)
        this.log(`Parallel execution completed in ${Date.now() - this.startTime}ms`)
    }

    /**
     * Execute agents in sequence
     */
    async executeSequential(agentNames: string[]): Promise<void> {
        this.startTime = Date.now()
        this.log(`Executing ${agentNames.length} agents sequentially`)

        for (const name of agentNames) {
            const agent = this.agents.get(name)
            if (!agent) {
                throw new Error(`Agent ${name} not found`)
            }

            try {
                await agent.performActions()
            } catch (error) {
                this.log(`Agent ${name} failed: ${error}`, 'error')
                throw error
            }
        }

        this.log(`Sequential execution completed in ${Date.now() - this.startTime}ms`)
    }

    /**
     * Get aggregated metrics from all agents
     */
    getAggregatedMetrics(): {
        totalActions: number
        successRate: number
        averageResponseTime: number
        agentMetrics: Record<string, AgentMetrics>
    } {
        let totalActions = 0
        let successfulActions = 0
        let totalResponseTime = 0
        const agentMetrics: Record<string, AgentMetrics> = {}

        for (const [name, agent] of this.agents) {
            const metrics = agent.getMetrics()
            agentMetrics[name] = metrics

            totalActions += metrics.actionsPerformed
            successfulActions += metrics.successfulActions
            totalResponseTime += metrics.totalResponseTime
        }

        return {
            totalActions,
            successRate: totalActions > 0 ? successfulActions / totalActions : 0,
            averageResponseTime: totalActions > 0 ? totalResponseTime / totalActions : 0,
            agentMetrics,
        }
    }

    /**
     * Clean up all agents
     */
    async cleanup(): Promise<void> {
        this.log('Cleaning up all agents')

        const cleanupPromises = Array.from(this.agents.values()).map((agent) =>
            agent.cleanup()
        )

        await Promise.all(cleanupPromises)
        this.agents.clear()
        this.sharedState.clear()
    }

    /**
     * Logging utility
     */
    private log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
        const timestamp = new Date().toISOString()
        const prefix = `[${timestamp}] [Orchestrator]`

        switch (level) {
            case 'error':
                console.error(`${prefix} ❌ ${message}`)
                break
            case 'warn':
                console.warn(`${prefix} ⚠️  ${message}`)
                break
            case 'info':
            default:
                console.log(`${prefix} 🎭 ${message}`)
        }
    }
}
