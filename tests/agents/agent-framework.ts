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

    async initialize(): Promise<void> {
        this.log('Initializing agent')
        this.context = await this.browser.newContext({
            viewport: { width: 1280, height: 720 },
            locale: 'en-US',
        })
        this.page = await this.context.newPage()

        this.page.on('response', (response) => {
            if (response.request().resourceType() === 'document') {
                this.log(`Page loaded: ${response.url()} (${response.status()})`)
            }
        })
    }

    async login(email: string, password: string): Promise<boolean> {
        const actionName = 'login'
        const startTime = Date.now()

        let retryCount = 0
        const maxRetries = 2

        while (retryCount <= maxRetries) {
            try {
                if (!this.page) throw new Error('Agent not initialized')

                this.log(`Logging in as ${email} (Attempt ${retryCount + 1})`)

                // Navigate to login page
                await this.page.goto('/en/login')
                await this.page.waitForLoadState('networkidle')

                // Clear fields first to be safe
                await this.page.fill('#email', '')
                await this.page.fill('#email', email)
                await this.humanDelay(200, 500)

                await this.page.fill('#password', '')
                await this.page.fill('#password', password)
                await this.humanDelay(200, 500)

                // Submit and wait for either a success indicator or an error
                this.log('Submitting login form...')
                await this.page.click('button[type="submit"]')

                // Wait for navigation or error message
                await this.page.waitForTimeout(3000)

                const currentUrl = this.page.url()
                const isLoggedIn = (currentUrl.includes('/student') || currentUrl.includes('/tutor')) && !currentUrl.includes('/login')

                if (isLoggedIn) {
                    this.state.isLoggedIn = true
                    this.state.email = email
                    this.state.currentPage = currentUrl
                    this.recordAction(actionName, startTime, true)
                    this.log(`Successfully logged in, redirected to: ${currentUrl}`)
                    return true
                }

                // Check for errors on page
                const errorCount = await this.page.locator('.text-red-500, .bg-red-50, [role="alert"]').count()
                if (errorCount > 0) {
                    const errorText = await this.page.locator('.text-red-500, .bg-red-50, [role="alert"]').first().innerText()
                    this.log(`Login failed with error: ${errorText}`, 'warn')

                    if ((errorText.toLowerCase().includes('too many') || errorText.toLowerCase().includes('rapid')) && retryCount < maxRetries) {
                        this.log('Rate limit detected, waiting 15s and retrying...', 'warn')
                        await this.page.waitForTimeout(15000)
                        retryCount++
                        continue
                    }
                }

                this.log(`Attempt ${retryCount + 1} failed (URL: ${currentUrl})`, 'warn')
                await this.screenshot(`login-failed-att-${retryCount + 1}`)

                if (retryCount < maxRetries) {
                    retryCount++
                    await this.page.reload()
                    await this.page.waitForLoadState('networkidle')
                    continue
                }

                this.recordAction(actionName, startTime, false)
                return false

            } catch (error) {
                this.log(`Login error during attempt ${retryCount + 1}: ${error}`, 'error')
                if (retryCount < maxRetries) {
                    retryCount++
                    continue
                }
                await this.screenshot('login-exception')
                this.recordAction(actionName, startTime, false)
                return false
            }
        }
        return false
    }

    async logout(): Promise<void> {
        const actionName = 'logout'
        const startTime = Date.now()

        try {
            if (!this.page) throw new Error('Agent not initialized')

            this.log('Logging out')
            await this.page.click('[data-testid="logout-button"], [data-testid="logout-button-mobile"]').catch(() => { })

            // Fallback for logout
            await this.page.goto('/api/auth/signout').catch(() => { })
            const signOutBtn = this.page.locator('button:has-text("Sign out"), button:has-text("Sign Out")')
            if (await signOutBtn.count() > 0) {
                await signOutBtn.first().click()
            }

            await this.page.waitForURL(/\/(en|zh)\/(login|$)/, { timeout: 10000 }).catch(() => { })

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

    async navigateTo(path: string): Promise<void> {
        if (!this.page) throw new Error('Agent not initialized')
        this.log(`Navigating to ${path}`)
        await this.page.goto(path)
        await this.page.waitForLoadState('networkidle')
        this.state.currentPage = this.page.url()
    }

    protected decide<T>(options: DecisionOptions<T>): T {
        const { choices, weights, strategy = 'random' } = options
        if (choices.length === 0) throw new Error('Cannot decide from empty choices')
        switch (strategy) {
            case 'first': return choices[0]
            case 'sequential': return choices[this.state.metrics.actionsPerformed % choices.length]
            case 'weighted': return this.weightedRandom(choices, weights!)
            case 'random':
            default: return choices[Math.floor(Math.random() * choices.length)]
        }
    }

    private weightedRandom<T>(choices: T[], weights: number[]): T {
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)
        let random = Math.random() * totalWeight
        for (let i = 0; i < choices.length; i++) {
            random -= weights[i]
            if (random <= 0) return choices[i]
        }
        return choices[choices.length - 1]
    }

    protected async humanDelay(minMs: number = 100, maxMs: number = 500): Promise<void> {
        const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs
        await new Promise((resolve) => setTimeout(resolve, delay))
    }

    protected recordAction(action: string, startTime: number, success: boolean): void {
        const duration = Date.now() - startTime
        this.state.metrics.actionsPerformed++
        if (success) {
            this.state.metrics.successfulActions++
        } else {
            this.state.metrics.failedActions++
        }
        this.state.metrics.totalResponseTime += duration
        this.state.metrics.actionTimestamps.push({ action, timestamp: startTime, duration })
    }

    getMetrics(): AgentMetrics { return { ...this.state.metrics } }
    getState(): AgentState { return { ...this.state } }

    protected log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
        const prefix = `[${new Date().toISOString()}] [${this.name}] [${this.state.role}]`
        if (level === 'error') console.error(`${prefix} ❌ ${message}`)
        else if (level === 'warn') console.warn(`${prefix} ⚠️  ${message}`)
        else console.log(`${prefix} ℹ️  ${message}`)
    }

    async screenshot(name: string): Promise<void> {
        if (!this.page) return
        const path = `screenshots/${this.name}-${name}-${Date.now()}.png`
        await this.page.screenshot({ path, fullPage: true }).catch(() => { })
    }

    async cleanup(): Promise<void> {
        this.log('Cleaning up agent resources')
        if (this.state.isLoggedIn) await this.logout().catch(() => { })
        if (this.page) await this.page.close().catch(() => { })
        if (this.context) await this.context.close().catch(() => { })
    }

    abstract performActions(): Promise<void>
}

/**
 * AgentOrchestrator - Coordinates multiple agents
 */
export class AgentOrchestrator {
    private agents: Map<string, BaseAgent> = new Map()
    private sharedState: Map<string, any> = new Map()
    private startTime?: number

    constructor() { this.log('Orchestrator initialized') }

    registerAgent(agent: BaseAgent): void {
        this.agents.set(agent.name, agent)
        this.log(`Registered agent: ${agent.name}`)
    }

    getAgent(name: string): BaseAgent | undefined { return this.agents.get(name) }

    async executeParallel(agentNames: string[]): Promise<void> {
        this.startTime = Date.now()
        await Promise.all(agentNames.map(async (name) => {
            const agent = this.agents.get(name)
            if (!agent) throw new Error(`Agent ${name} not found`)
            await agent.performActions()
        }))
        this.log(`Execution completed in ${Date.now() - this.startTime}ms`)
    }

    async executeSequential(agentNames: string[]): Promise<void> {
        this.startTime = Date.now()
        for (const name of agentNames) {
            const agent = this.agents.get(name)
            if (!agent) throw new Error(`Agent ${name} not found`)
            await agent.performActions()
        }
        this.log(`Execution completed in ${Date.now() - this.startTime}ms`)
    }

    getAggregatedMetrics(): any {
        let totalActions = 0, successfulActions = 0, totalResponseTime = 0
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

    async cleanup(): Promise<void> {
        await Promise.all(Array.from(this.agents.values()).map(a => a.cleanup()))
        this.agents.clear()
        this.sharedState.clear()
    }

    private log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
        const prefix = `[${new Date().toISOString()}] [Orchestrator]`
        if (level === 'error') console.error(`${prefix} ❌ ${message}`)
        else if (level === 'warn') console.warn(`${prefix} ⚠️  ${message}`)
        else console.log(`${prefix} 🎭 ${message}`)
    }
}
