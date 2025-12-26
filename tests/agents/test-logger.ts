import { Page } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

/**
 * Test Logging Infrastructure
 * 
 * Provides comprehensive logging for multi-agent test execution:
 * - Per-agent action logging
 * - Scenario-level metrics
 * - Test run aggregation
 * - JSON and HTML report generation
 */

export interface LogEvent {
    timestamp: string
    agentId: string
    agentName: string
    eventType: 'action' | 'error' | 'metric' | 'info'
    action?: string
    data?: any
    duration?: number
    success?: boolean
}

export interface ScenarioMetrics {
    scenarioId: string
    scenarioName: string
    startTime: string
    endTime?: string
    duration?: number
    status: 'running' | 'passed' | 'failed' | 'skipped'
    agents: string[]
    events: LogEvent[]
    metrics: {
        totalActions: number
        successfulActions: number
        failedActions: number
        averageResponseTime: number
        databaseQueries?: number
        networkRequests?: number
    }
    errors: Array<{
        timestamp: string
        agentId: string
        error: string
        stack?: string
    }>
}

export interface TestRunSummary {
    runId: string
    startTime: string
    endTime?: string
    totalDuration?: number
    scenarios: ScenarioMetrics[]
    totalAgents: number
    overallStatus: 'running' | 'passed' | 'failed'
    summary: {
        totalScenarios: number
        passedScenarios: number
        failedScenarios: number
        totalActions: number
        successRate: number
    }
}

/**
 * TestLogger - Base logging class
 */
export class TestLogger {
    private logDir: string
    private runId: string
    private events: LogEvent[] = []

    constructor(runId: string, logDir: string = 'tests/logs') {
        this.runId = runId
        this.logDir = logDir
        this.ensureLogDirectory()
    }

    private ensureLogDirectory(): void {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true })
        }
    }

    log(event: LogEvent): void {
        this.events.push(event)

        // Also write to console for real-time monitoring
        const emoji = event.eventType === 'error' ? '❌' :
            event.success === true ? '✅' :
                event.success === false ? '⚠️' : 'ℹ️'

        console.log(
            `${emoji} [${event.timestamp}] [${event.agentName}] ${event.action || event.eventType}` +
            (event.duration ? ` (${event.duration}ms)` : '')
        )
    }

    getEvents(): LogEvent[] {
        return [...this.events]
    }

    writeToFile(filename: string, content: string): void {
        const filepath = path.join(this.logDir, filename)
        fs.writeFileSync(filepath, content, 'utf-8')
        console.log(`📝 Log written: ${filepath}`)
    }

    writeJSON(filename: string, data: any): void {
        this.writeToFile(filename, JSON.stringify(data, null, 2))
    }
}

/**
 * AgentLogger - Per-agent logging
 */
export class AgentLogger extends TestLogger {
    private agentId: string
    private agentName: string
    private agentRole: 'tutor' | 'student'

    constructor(
        runId: string,
        agentId: string,
        agentName: string,
        agentRole: 'tutor' | 'student',
        logDir?: string
    ) {
        super(runId, logDir)
        this.agentId = agentId
        this.agentName = agentName
        this.agentRole = agentRole
    }

    logAction(action: string, data?: any, duration?: number, success?: boolean): void {
        this.log({
            timestamp: new Date().toISOString(),
            agentId: this.agentId,
            agentName: this.agentName,
            eventType: 'action',
            action,
            data,
            duration,
            success,
        })
    }

    logError(error: Error | string, action?: string): void {
        this.log({
            timestamp: new Date().toISOString(),
            agentId: this.agentId,
            agentName: this.agentName,
            eventType: 'error',
            action,
            data: {
                error: error instanceof Error ? error.message : error,
                stack: error instanceof Error ? error.stack : undefined,
            },
            success: false,
        })
    }

    logMetric(metricName: string, value: number): void {
        this.log({
            timestamp: new Date().toISOString(),
            agentId: this.agentId,
            agentName: this.agentName,
            eventType: 'metric',
            action: metricName,
            data: { value },
        })
    }

    async saveLogs(): Promise<void> {
        const filename = `agent-${this.agentId}-${this.agentName}.json`
        this.writeJSON(filename, {
            agentId: this.agentId,
            agentName: this.agentName,
            agentRole: this.agentRole,
            events: this.getEvents(),
        })
    }
}

/**
 * ScenarioLogger - Scenario-level logging and metrics
 */
export class ScenarioLogger extends TestLogger {
    private metrics: ScenarioMetrics

    constructor(
        runId: string,
        scenarioId: string,
        scenarioName: string,
        agents: string[],
        logDir?: string
    ) {
        super(runId, logDir)

        this.metrics = {
            scenarioId,
            scenarioName,
            startTime: new Date().toISOString(),
            status: 'running',
            agents,
            events: [],
            metrics: {
                totalActions: 0,
                successfulActions: 0,
                failedActions: 0,
                averageResponseTime: 0,
            },
            errors: [],
        }
    }

    addEvent(event: LogEvent): void {
        this.log(event)
        this.metrics.events.push(event)

        // Update metrics
        if (event.eventType === 'action') {
            this.metrics.metrics.totalActions++
            if (event.success === true) {
                this.metrics.metrics.successfulActions++
            } else if (event.success === false) {
                this.metrics.metrics.failedActions++
            }
        }

        if (event.eventType === 'error') {
            this.metrics.errors.push({
                timestamp: event.timestamp,
                agentId: event.agentId,
                error: event.data?.error || 'Unknown error',
                stack: event.data?.stack,
            })
        }
    }

    complete(status: 'passed' | 'failed' | 'skipped'): void {
        this.metrics.endTime = new Date().toISOString()
        this.metrics.status = status

        const start = new Date(this.metrics.startTime).getTime()
        const end = new Date(this.metrics.endTime).getTime()
        this.metrics.duration = end - start

        // Calculate average response time
        const durations = this.metrics.events
            .filter(e => e.duration !== undefined)
            .map(e => e.duration!)

        if (durations.length > 0) {
            this.metrics.metrics.averageResponseTime =
                durations.reduce((a, b) => a + b, 0) / durations.length
        }
    }

    getMetrics(): ScenarioMetrics {
        return { ...this.metrics }
    }

    async saveLogs(): Promise<void> {
        const filename = `scenario-${this.metrics.scenarioId}.json`
        this.writeJSON(filename, this.metrics)
    }
}

/**
 * TestRunLogger - Aggregates all scenario logs
 */
export class TestRunLogger extends TestLogger {
    private summary: TestRunSummary
    private scenarios: Map<string, ScenarioLogger> = new Map()

    constructor(runId: string, logDir?: string) {
        super(runId, logDir)

        this.summary = {
            runId,
            startTime: new Date().toISOString(),
            scenarios: [],
            totalAgents: 0,
            overallStatus: 'running',
            summary: {
                totalScenarios: 0,
                passedScenarios: 0,
                failedScenarios: 0,
                totalActions: 0,
                successRate: 0,
            },
        }
    }

    addScenario(logger: ScenarioLogger): void {
        this.scenarios.set(logger.getMetrics().scenarioId, logger)
    }

    complete(): void {
        this.summary.endTime = new Date().toISOString()

        const start = new Date(this.summary.startTime).getTime()
        const end = new Date(this.summary.endTime).getTime()
        this.summary.totalDuration = end - start

        // Aggregate all scenario metrics
        this.summary.scenarios = Array.from(this.scenarios.values())
            .map(logger => logger.getMetrics())

        // Calculate summary
        this.summary.summary.totalScenarios = this.summary.scenarios.length
        this.summary.summary.passedScenarios = this.summary.scenarios.filter(s => s.status === 'passed').length
        this.summary.summary.failedScenarios = this.summary.scenarios.filter(s => s.status === 'failed').length

        const totalActions = this.summary.scenarios.reduce((sum, s) => sum + s.metrics.totalActions, 0)
        const successfulActions = this.summary.scenarios.reduce((sum, s) => sum + s.metrics.successfulActions, 0)

        this.summary.summary.totalActions = totalActions
        this.summary.summary.successRate = totalActions > 0 ? successfulActions / totalActions : 0

        // Determine overall status
        if (this.summary.summary.failedScenarios === 0) {
            this.summary.overallStatus = 'passed'
        } else {
            this.summary.overallStatus = 'failed'
        }
    }

    getSummary(): TestRunSummary {
        return { ...this.summary }
    }

    async saveLogs(): Promise<void> {
        // Save individual scenario logs
        for (const logger of this.scenarios.values()) {
            await logger.saveLogs()
        }

        // Save test run summary
        const filename = `test-run-${this.summary.runId}.json`
        this.writeJSON(filename, this.summary)

        console.log(`\n📊 Test Run Summary:`)
        console.log(`   Run ID: ${this.summary.runId}`)
        console.log(`   Duration: ${this.summary.totalDuration}ms`)
        console.log(`   Scenarios: ${this.summary.summary.totalScenarios}`)
        console.log(`   Passed: ${this.summary.summary.passedScenarios}`)
        console.log(`   Failed: ${this.summary.summary.failedScenarios}`)
        console.log(`   Success Rate: ${(this.summary.summary.successRate * 100).toFixed(1)}%`)
        console.log(`   Status: ${this.summary.overallStatus === 'passed' ? '✅ PASSED' : '❌ FAILED'}`)
    }

    async generateHTMLReport(): Promise<void> {
        const html = this.createHTMLReport()
        const filename = `report-${this.summary.runId}.html`
        this.writeToFile(filename, html)
    }

    private createHTMLReport(): string {
        const summary = this.summary

        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Multi-Agent Test Report - ${summary.runId}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background: #f5f5f5; padding: 20px; }
    .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
    .header h1 { font-size: 28px; margin-bottom: 10px; }
    .summary { padding: 30px; border-bottom: 1px solid #e0e0e0; }
    .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-top: 20px; }
    .metric-card { background: #f8f9fa; padding: 20px; border-radius: 6px; border-left: 4px solid #667eea; }
    .metric-card h3 { font-size: 14px; color: #666; margin-bottom: 8px; }
    .metric-card .value { font-size: 32px; font-weight: bold; color: #333; }
    .scenarios { padding: 30px; }
    .scenario-card { background: white; border: 1px solid #e0e0e0; border-radius: 6px; padding: 20px; margin-bottom: 20px; }
    .scenario-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
    .scenario-title { font-size: 18px; font-weight: 600; }
    .status-badge { padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
    .status-passed { background: #d4edda; color: #155724; }
    .status-failed { background: #f8d7da; color: #721c24; }
    .scenario-metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-top: 15px; }
    .metric-item { font-size: 14px; }
    .metric-label { color: #666; }
    .metric-value { font-weight: 600; color: #333; }
    .footer { padding: 20px 30px; background: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎭 Multi-Agent Test Report</h1>
      <p>Run ID: ${summary.runId}</p>
      <p>${new Date(summary.startTime).toLocaleString()}</p>
    </div>
    
    <div class="summary">
      <h2>Summary</h2>
      <div class="summary-grid">
        <div class="metric-card">
          <h3>Total Scenarios</h3>
          <div class="value">${summary.summary.totalScenarios}</div>
        </div>
        <div class="metric-card">
          <h3>Passed</h3>
          <div class="value" style="color: #28a745">${summary.summary.passedScenarios}</div>
        </div>
        <div class="metric-card">
          <h3>Failed</h3>
          <div class="value" style="color: #dc3545">${summary.summary.failedScenarios}</div>
        </div>
        <div class="metric-card">
          <h3>Success Rate</h3>
          <div class="value">${(summary.summary.successRate * 100).toFixed(1)}%</div>
        </div>
        <div class="metric-card">
          <h3>Total Actions</h3>
          <div class="value">${summary.summary.totalActions}</div>
        </div>
        <div class="metric-card">
          <h3>Duration</h3>
          <div class="value">${((summary.totalDuration || 0) / 1000).toFixed(1)}s</div>
        </div>
      </div>
    </div>
    
    <div class="scenarios">
      <h2>Scenarios</h2>
      ${summary.scenarios.map(scenario => `
        <div class="scenario-card">
          <div class="scenario-header">
            <div class="scenario-title">${scenario.scenarioName}</div>
            <span class="status-badge status-${scenario.status}">${scenario.status}</span>
          </div>
          <div class="scenario-metrics">
            <div class="metric-item">
              <span class="metric-label">Actions:</span>
              <span class="metric-value">${scenario.metrics.totalActions}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">Success Rate:</span>
              <span class="metric-value">${scenario.metrics.totalActions > 0 ? ((scenario.metrics.successfulActions / scenario.metrics.totalActions) * 100).toFixed(1) : 0}%</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">Duration:</span>
              <span class="metric-value">${((scenario.duration || 0) / 1000).toFixed(1)}s</span>
            </div>
          </div>
          ${scenario.errors.length > 0 ? `
            <div style="margin-top: 15px; padding: 10px; background: #fff3cd; border-left: 3px solid #ffc107; border-radius: 4px;">
              <strong>Errors (${scenario.errors.length}):</strong>
              <ul style="margin-top: 8px; padding-left: 20px;">
                ${scenario.errors.map(err => `<li style="margin: 4px 0; font-size: 13px;">${err.error}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
        </div>
      `).join('')}
    </div>
    
    <div class="footer">
      Generated by Multi-Agent Testing System • ${new Date().toLocaleString()}
    </div>
  </div>
</body>
</html>`
    }
}
