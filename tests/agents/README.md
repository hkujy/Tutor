# Multi-Agent Testing System

## Overview

An intelligent multi-agent testing framework for the tutoring calendar application. This system simulates realistic interactions between tutors and students using autonomous browser-based agents powered by Playwright.

## Architecture

### Core Components

- **BaseAgent**: Abstract base class providing browser management, authentication, state tracking, and decision-making capabilities
- **AgentOrchestrator**: Coordinates multiple agents for scenario execution (parallel or sequential)
- **TutorAgent**: Simulates tutor behaviors (setting availability, managing students, checking notifications)
- **StudentAgent**: Simulates student behaviors (browsing tutors, booking appointments, managing schedule)

### Behavior Patterns

**Tutor Patterns:**
- `conservative`: Rarely changes schedule, mostly views dashboard and checks notifications
- `active`: Frequently updates availability and actively manages students
- `flexible`: Adapts actions based on current state (e.g., responds to notifications)

**Student Patterns:**
- `eager`: Books appointments quickly without much browsing
- `browsing`: Explores multiple tutors before deciding
- `indecisive`: Books then sometimes cancels appointments

## Test Scenarios

### Basic Scenarios (`multi-agent-basic.spec.ts`)

1. **Single Booking**: Tutor sets availability → Student books appointment
2. **Cancellation Flow**: Student books → cancels → Tutor receives notification
3. **Full Student Journey**: Complete workflow from browsing to scheduling

### Concurrent Scenarios (`multi-agent-concurrent.spec.ts`)

4. **Rush Hour**: 5 students compete for limited tutor slots
5. **Multi-Tutor Marketplace**: 3 tutors, 6 students, realistic booking patterns
6. **Peak Load**: 15 concurrent agents (5 tutors, 10 students)
7. **Double Booking Prevention**: 2 students attempt to book the same slot

## Quick Start

### Installation

```bash
# Install dependencies (if not already done)
npm install
```

### Running Tests

```bash
# Run all agent tests
npx playwright test tests/agents/

# Run specific scenario
npx playwright test tests/agents/multi-agent-basic.spec.ts

# Run in headed mode (watch agents in action!)
npx playwright test tests/agents/multi-agent-basic.spec.ts --headed

# Run specific test
npx playwright test tests/agents/ -g "Single Booking"

# Run with UI mode for debugging
npx playwright test tests/agents/ --ui
```

### Example: Watching Agents Live

```bash
# Run the demo test in headed mode
npx playwright test tests/agents/multi-agent-basic.spec.ts -g "Demo" --headed --workers=1
```

You'll see browser windows open with agents performing actions autonomously!

## Creating Custom Scenarios

### Define a Scenario

```typescript
import { Scenario } from './scenarios'

const myScenario: Scenario = {
  name: 'Custom Scenario',
  description: 'Your scenario description',
  agents: [
    {
      type: 'tutor',
      name: 'CustomTutor',
      email: 'tutor@custom.com',
      password: 'password123',
      behaviorPattern: 'active',
    },
    {
      type: 'student',
      name: 'CustomStudent',
      email: 'student@custom.com',
      password: 'password123',
      behaviorPattern: 'eager',
    },
  ],
  executionMode: 'sequential',
  successCriteria: [
    'Student successfully books',
    'Tutor receives notification',
  ],
  performanceBenchmarks: {
    maxDuration: 20000,
    minSuccessRate: 0.9,
  },
}
```

### Execute the Scenario

```typescript
import { executeScenario } from './scenarios'
import { AgentOrchestrator } from './agent-framework'

test('My custom scenario', async ({ browser }) => {
  const orchestrator = new AgentOrchestrator()
  const result = await executeScenario(myScenario, browser, orchestrator)
  
  expect(result.success).toBe(true)
  expect(result.metrics.successRate).toBeGreaterThan(0.9)
})
```

## Agent API

### TutorAgent Methods

```typescript
// Set weekly recurring availability
await tutor.setWeeklyAvailability({
  daysOfWeek: [1, 2, 3, 4, 5], // Monday-Friday
  startTime: '09:00',
  endTime: '17:00',
  duration: 60, // minutes
})

// Block specific dates
await tutor.blockDates(['2025-12-25', '2025-12-26'])

// View dashboard
await tutor.viewDashboard()

// View student roster  
await tutor.viewStudents()

// Check notifications
const unreadCount = await tutor.checkNotifications()
```

### StudentAgent Methods

```typescript
// Browse tutors (optionally filter by subject)
const tutorCount = await student.browseTutors('Mathematics')

// View specific tutor profile
await student.viewTutorProfile(0) // Index 0 = first tutor

// Book appointment
const booked = await student.bookAppointment('Physics')

// View schedule
const appointmentCount = await student.viewSchedule()

// Cancel appointment
await student.cancelAppointment(0) // Cancel first appointment

// Check notifications
await student.checkNotifications()
```

### BaseAgent Features

```typescript
// Login
await agent.login('email@test.com', 'password')

// Navigate
await agent.navigateTo('/en/student/dashboard')

// Decision making
const choice = agent.decide({
  choices: ['Option A', 'Option B', 'Option C'],
  weights: [0.5, 0.3, 0.2], // Weighted probability
  strategy: 'weighted', // 'random', 'weighted', 'sequential', 'first'
})

// Human-like delays
await agent.humanDelay(500, 1500) // Random delay between 500-1500ms

// Get metrics
const metrics = agent.getMetrics()
console.log(`Success rate: ${metrics.successfulActions / metrics.actionsPerformed}`)

// Take screenshot
await agent.screenshot('error-state')

// Cleanup
await agent.cleanup()
```

## Performance Metrics

Each agent tracks:
- **Actions performed**: Total number of operations
- **Success rate**: Percentage of successful actions
- **Response times**: Duration of each action
- **Action timestamps**: Detailed timing information

```typescript
const metrics = orchestrator.getAggregatedMetrics()

console.log(`Total actions: ${metrics.totalActions}`)
console.log(`Success rate: ${(metrics.successRate * 100).toFixed(1)}%`)
console.log(`Avg response time: ${metrics.averageResponseTime}ms`)
console.log(`Per-agent breakdown:`, metrics.agentMetrics)
```

## Test Data

### Generate Test Users

```typescript
import { TestDataFactory } from './test-data-factory'

// Generate tutor profiles
const tutors = TestDataFactory.generateTutors(5)

// Generate student profiles
const students = TestDataFactory.generateStudents(10)

// Generate availability schedules
const fullTime = TestDataFactory.generateAvailabilitySchedule('full-time')
const partTime = TestDataFactory.generateAvailabilitySchedule('part-time')
const weekends = TestDataFactory.generateAvailabilitySchedule('weekends')
```

## Debugging

### View Test Results

```bash
# Open HTML report
npx playwright show-report
```

### Screenshots and Videos

Failed tests automatically capture:
- Screenshots (on failure)
- Videos (retained on failure)
- Traces (on first retry)

Files are saved to `test-results/` and `playwright-report/`

### Verbose Logging

Agents log all actions to console:

```
[2025-12-25T21:00:00Z] [StudentBob] [student] ℹ️  Logging in as student1@test.com
[2025-12-25T21:00:02Z] [StudentBob] [student] ℹ️  Successfully logged in
[2025-12-25T21:00:03Z] [StudentBob] [student] ℹ️  Browsing tutors for Mathematics
[2025-12-25T21:00:05Z] [StudentBob] [student] ℹ️  Found 3 available tutors
```

### Headed Mode

Run tests with `--headed` to watch agents in action:

```bash
npx playwright test tests/agents/multi-agent-basic.spec.ts --headed --workers=1
```

The `--workers=1` option ensures browser windows open sequentially for better visibility.

## CI/CD Integration

### GitHub Actions Example

```yaml
- name: Run multi-agent tests
  run: npx playwright test tests/agents/multi-agent-basic.spec.ts
  
- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## Best Practices

1. **Test Isolation**: Each test should clean up data and logout agents
2. **Realistic Delays**: Use `humanDelay()` to simulate real user behavior
3. **Error Handling**: Agents should gracefully handle failures
4. **Metrics Tracking**: Always verify success rates and performance
5. **Concurrent Testing**: Be aware of race conditions in parallel tests

## Troubleshooting

### Tests Timeout

- Increase test timeout: `test.setTimeout(60000)`
- Check network connectivity to tunnel URL
- Verify PM2 app is running

### Agents Can't Login

- Verify user accounts exist in database
- Check credentials in test configuration
- Ensure authentication is working manually

### Booking Failures

- Verify tutor has set availability
- Check for timing/synchronization issues
- Ensure database has no conflicting appointments

### Double Booking Occurs

- This indicates a race condition bug - investigation needed!
- Check transaction isolation levels
- Verify slot locking mechanism

## Future Enhancements

- [ ] AdminAgent for administrative tasks
- [ ] Scenario DSL for no-code scenario definition
- [ ] Real-time dashboard for monitoring agent activity
- [ ] AI-powered decision strategies
- [ ] Integration with load testing tools
- [ ] Multi-language testing scenarios

## Contributing

To add new agent behaviors or scenarios:

1. Extend `BaseAgent` or create new agent types
2. Add methods to `TutorAgent` or `StudentAgent`
3. Define new scenarios in `scenarios.ts`
4. Create test files in `tests/agents/`
5. Update this README with examples

## License

MIT
