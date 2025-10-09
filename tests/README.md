# Testing Setup for Tutoring Calendar

## Overview

This testing setup validates the hydration fixes, reliability improvements, and overall system robustness implemented in the tutoring calendar application.

## Test Structure

```
tests/
├── components/           # React component tests
│   ├── appointment-list.test.tsx    # Hydration-sensitive component
│   └── nossr.test.tsx              # NoSSR wrapper component
├── api/                 # API endpoint tests  
│   └── notifications-rate-limiting.test.ts  # Rate limiting & security
├── e2e/                 # End-to-end tests
│   └── hydration-extensions.spec.ts         # Browser extension compatibility
└── mocks/               # Test mocks and fixtures
    ├── server.ts        # MSW server setup
    └── handlers.ts      # API mock handlers
```

## Key Testing Areas

### 🚨 Critical Tests

1. **Hydration Mismatch Prevention**
   - Browser extension compatibility (DarkReader, Grammarly)
   - SVG elements with `suppressHydrationWarning`
   - Date/time component synchronization

2. **API Security & Rate Limiting**
   - 50 notifications/hour rate limit enforcement
   - Input validation and XSS prevention
   - Authentication and authorization

3. **Memory Leak Prevention**
   - useEffect cleanup in React components
   - Race condition protection
   - Component lifecycle management

## Running Tests

### Unit and Component Tests
```bash
# Run all tests
npm test

# Run with watch mode
npm run test:watch

# Run specific test suites
npm run test:components
npm run test:api

# Run with coverage
npm run test:coverage
```

### End-to-End Tests
```bash
# Run E2E tests
npm run test:e2e

# Run specific browser
npx playwright test --project=chromium

# Run with UI mode
npx playwright test --ui
```

## Test Configuration

### Jest Configuration (`jest.config.js`)
- Next.js integration with `next/jest`
- React Testing Library setup
- MSW for API mocking
- Custom module mapping for `@/` imports

### Playwright Configuration (`playwright.config.ts`)
- Multi-browser testing (Chrome, Firefox, Safari, Edge)
- Mobile device testing
- Automatic dev server startup
- Browser extension emulation

## Test Data and Mocks

### Mock Users
```typescript
const testUsers = {
  student: { id: 'test-student-1', role: 'STUDENT' },
  tutor: { id: 'test-tutor-1', role: 'TUTOR' }
}
```

### API Mocking (MSW)
- Notification CRUD operations
- Analytics data endpoints
- Authentication session mocking
- Rate limiting simulation

## Key Test Cases

### Hydration Tests
- ✅ Zero hydration warnings with browser extensions
- ✅ SVG elements render correctly
- ✅ Date-based components sync properly
- ✅ NoSSR wrapper prevents SSR/client mismatches

### API Security Tests
- ✅ Rate limiting blocks >50 notifications/hour
- ✅ Input sanitization prevents XSS attacks
- ✅ Authentication required for protected routes
- ✅ Database errors handled gracefully

### Component Reliability Tests
- ✅ Memory leaks prevented with proper cleanup
- ✅ Race conditions handled in async operations
- ✅ Error boundaries catch and display errors
- ✅ Loading states render without hydration conflicts

## Browser Extension Emulation

### DarkReader Simulation
```javascript
// Emulates DarkReader adding attributes to SVG elements
svg.setAttribute('data-darkreader-inline-stroke', 'currentColor')
svg.setAttribute('data-darkreader-inline-fill', 'currentColor')
```

### Grammarly Simulation
```javascript
// Emulates Grammarly modifying input elements
input.setAttribute('data-gramm', 'true')
input.setAttribute('data-gramm_editor', 'true')
```

## Success Criteria

### Zero Hydration Warnings
```bash
# Console should show no hydration mismatch errors
Console: [] (no hydration warnings)
```

### Rate Limiting Enforcement
```bash
# 51st request should return 429 status
Response: 429 Too Many Requests
```

### Memory Leak Prevention
```bash
# No memory warnings during component lifecycle
Memory warnings: [] (empty)
```

## Debugging Tests

### Component Test Debugging
```bash
# Run specific test with verbose output
npm test -- --verbose appointment-list.test.tsx

# Debug with Node inspector
node --inspect-brk node_modules/.bin/jest --runInBand
```

### E2E Test Debugging
```bash
# Run with headed browser
npx playwright test --headed

# Debug mode
npx playwright test --debug

# Generate trace
npx playwright test --trace on
```

## Dependencies

### Testing Framework
- Jest + React Testing Library (component tests)
- Playwright (E2E tests)
- MSW (API mocking)
- Supertest (API testing)

### Key Packages
```json
{
  "jest": "^29.3.0",
  "@testing-library/react": "^13.4.0",
  "@testing-library/jest-dom": "^5.16.5",
  "@playwright/test": "^1.28.0",
  "msw": "^0.49.0",
  "supertest": "^6.3.0"
}
```

## Continuous Integration

### GitHub Actions Example
```yaml
- name: Run Tests
  run: |
    npm test -- --coverage
    npm run test:e2e

- name: Upload Coverage
  uses: codecov/codecov-action@v3
```

## Troubleshooting

### Common Issues

1. **Hydration Warnings**: Check `suppressHydrationWarning` attributes
2. **Test Timeouts**: Increase timeout in `jest.config.js`
3. **E2E Failures**: Ensure dev server is running on correct port
4. **Mock Issues**: Verify MSW handlers match API routes

### Debug Commands
```bash
# Check test environment
npm run typecheck

# Validate Jest config
npx jest --showConfig

# Test MSW setup
npm test -- --verbose server.test.ts
```

This comprehensive testing setup ensures the reliability improvements and hydration fixes are thoroughly validated across all critical system components.