import * as fs from 'fs';
import * as path from 'path';

export interface LogEvent {
    timestamp: string;
    agentId: string;
    agentName: string;
    eventType: 'action' | 'error' | 'metric';
    action?: string;
    duration?: number;
    success?: boolean;
    data?: any;
}

export class AgentLogger {
    constructor(private runId: string, private agentId: string, private agentName: string) { }
}

export class ScenarioLogger {
    private events: LogEvent[] = [];
    private startTime: number;
    private endTime?: number;
    private status: 'passed' | 'failed' | 'running' = 'running';

    constructor(
        private runId: string,
        private scenarioId: string,
        private scenarioName: string,
        private agents: string[]
    ) {
        this.startTime = Date.now();
    }

    addEvent(event: LogEvent) {
        this.events.push(event);
    }

    complete(status: 'passed' | 'failed') {
        this.status = status;
        this.endTime = Date.now();
    }

    getSummary() {
        return {
            id: this.scenarioId,
            name: this.scenarioName,
            status: this.status,
            duration: (this.endTime || Date.now()) - this.startTime,
            eventCount: this.events.length,
            agents: this.agents,
            events: this.events
        };
    }
}

export class TestRunLogger {
    private scenarios: ScenarioLogger[] = [];
    private startTime: number;
    private endTime?: number;

    constructor(private runId: string) {
        this.startTime = Date.now();
    }

    addScenario(scenario: ScenarioLogger) {
        this.scenarios.push(scenario);
    }

    complete() {
        this.endTime = Date.now();
    }

    async saveLogs() {
        const logDir = path.join(process.cwd(), 'test-results', 'logs');
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }

        const data = {
            runId: this.runId,
            startTime: new Date(this.startTime).toISOString(),
            endTime: this.endTime ? new Date(this.endTime).toISOString() : null,
            duration: (this.endTime || Date.now()) - this.startTime,
            scenarios: this.scenarios.map(s => s.getSummary())
        };

        const logPath = path.join(logDir, `${this.runId.replace(/[:\s]/g, '-')}.json`);
        fs.writeFileSync(logPath, JSON.stringify(data, null, 2));
        console.log(`Logs saved to ${logPath}`);
    }

    async generateHTMLReport() {
        const reportDir = path.join(process.cwd(), 'test-results', 'reports');
        if (!fs.existsSync(reportDir)) {
            fs.mkdirSync(reportDir, { recursive: true });
        }

        const reportPath = path.join(reportDir, `${this.runId.replace(/[:\s]/g, '-')}.html`);
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Test Run Report - ${this.runId}</title>
                <style>
                    body { font-family: sans-serif; padding: 20px; }
                    .scenario { border: 1px solid #ccc; padding: 10px; margin-bottom: 10px; border-radius: 4px; }
                    .passed { border-left: 10px solid green; }
                    .failed { border-left: 10px solid red; }
                    .event { font-size: 0.9em; color: #666; }
                </style>
            </head>
            <body>
                <h1>Test Run Report: ${this.runId}</h1>
                ${this.scenarios.map(s => {
            const data = s.getSummary();
            return `
                        <div class="scenario ${data.status}">
                            <h2>${data.name} (${data.status})</h2>
                            <p>Duration: ${data.duration}ms | Events: ${data.eventCount}</p>
                            <p>Agents: ${data.agents.join(', ')}</p>
                        </div>
                    `;
        }).join('')}
            </body>
            </html>
        `;

        fs.writeFileSync(reportPath, html);
        console.log(`HTML Report generated at ${reportPath}`);
    }
}
