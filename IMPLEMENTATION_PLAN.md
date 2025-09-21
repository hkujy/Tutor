# Implementation Plan - Tutoring Calendar Application

## Overview

This document outlines a step-by-step implementation plan for the tutoring calendar application. Each phase includes specific tasks, testing milestones, and validation criteria to ensure quality delivery.

## Phase 1: Project Foundation & Setup (Week 1-2)

### 1.1 Project Initialization

**Tasks:**

- [ ] Initialize Next.js 14 project with TypeScript
- [ ] Set up project structure according to CODE_STRUCTURE_PLAN.md
- [ ] Configure package.json with all required dependencies
- [ ] Set up ESLint, Prettier, and EditorConfig
- [ ] Create .nvmrc for Node.js version consistency
- [ ] Configure Husky + lint-staged for pre-commit lint/typecheck/format
- [ ] Wire up App providers (TanStack Query, Theme, Toast)
- [ ] Choose and configure client state (Zustand) for UI-only state

**Dependencies to Install:**

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "@prisma/client": "^5.0.0",
    "next-auth": "^4.24.0",
    "zod": "^3.22.0",
    "@tanstack/react-query": "^5.0.0",
    "tailwindcss": "^3.3.0",
    "@radix-ui/react-slot": "^1.0.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0",
    "pino": "^8.15.0",
    "redis": "^4.6.0",
    "@sendgrid/mail": "^7.7.0",
    "date-fns": "^2.30.0",
    "date-fns-tz": "^2.0.0",
    "react-hook-form": "^7.48.0",
    "@hookform/resolvers": "^3.3.0"
  },
  "devDependencies": {
    "prisma": "^5.0.0",
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "typescript": "^5.0.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0",
    "@playwright/test": "^1.40.0",
    "vitest": "^0.34.0",
    "@testing-library/react": "^13.4.0",
    "testcontainers": "^10.0.0"
  }
}
```

**Testing:**

- [ ] Verify Next.js dev server starts successfully
- [ ] Confirm TypeScript compilation works
- [ ] Test ESLint and Prettier configuration
- [ ] Validate project structure matches plan

**Acceptance Criteria:**

- Project builds without errors
- Linting passes with zero issues
- All configuration files are properly set up

### 1.2 Database Setup

**Tasks:**

- [ ] Initialize Prisma with PostgreSQL
- [ ] Create database schema based on DATABASE_SCHEMA.md
- [ ] Set up database migrations
- [ ] Create seed data files
- [ ] Configure database connection and client

**Database Schema Implementation:**

- [ ] Create all tables: users, students, tutors, appointments, assignments, notifications, etc.
- [ ] Define all relationships and foreign key constraints
- [ ] Add indexes for performance (user queries, appointment lookups, availability searches)
- [ ] Create enums for status fields (AppointmentStatus, AssignmentStatus, NotificationType, etc.)
- [ ] Set up proper @map directives for snake_case database fields

**Testing:**

- [ ] Test database connection
- [ ] Run migrations successfully
- [ ] Verify seed data insertion
- [ ] Test basic CRUD operations

**Acceptance Criteria:**

- Database schema matches design specification
- All migrations run without errors
- Seed data populates correctly

### 1.3 Environment Configuration

**Tasks:**

- [ ] Create env.ts with Zod validation
- [ ] Set up environment variables for all services
- [ ] Configure Redis connection
- [ ] Set up logging with pino
- [ ] Create development and test environments

**Environment Variables:**

```env
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Auth
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"

# Redis
REDIS_URL="redis://localhost:6379"

# Email
SMTP_HOST="..."
SMTP_PORT=587
SMTP_USER="..."
SMTP_PASSWORD="..."

# File Storage
UPLOAD_DIR="uploads"
MAX_FILE_SIZE="10485760"

# External APIs
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

**Testing:**

- [ ] Validate environment variable parsing
- [ ] Test Redis connection
- [ ] Verify logging configuration
- [ ] Test environment switching (dev/test)

**Acceptance Criteria:**

- All environment variables validate correctly
- External service connections work
- Logging outputs structured data

## Phase 2: Core Infrastructure (Week 2-3)

### 2.1 Authentication & Authorization

**Tasks:**

- [ ] Set up NextAuth.js with providers
- [ ] Implement user registration and login
- [ ] Create role-based permission system
- [ ] Set up session management
- [ ] Add email verification

**Authentication Components:**

- [ ] Login form with validation
- [ ] Registration form with email verification
- [ ] Password reset functionality
- [ ] Role selection (student/tutor)

**Testing:**

- [ ] Unit tests for auth services
- [ ] Integration tests for auth API routes
- [ ] E2E tests for login/registration flow
- [ ] Security testing (rate limiting, validation)

**Test Scenarios:**

- User can register with valid email
- Email verification works correctly
- Login with valid credentials succeeds
- Invalid login attempts are handled
- Session persistence works
- Role-based access control functions

**Acceptance Criteria:**

- Complete authentication flow works
- Security measures are in place
- All auth tests pass

### 2.2 Repository Layer

**Tasks:**

- [ ] Create repository interfaces
- [ ] Implement Prisma repositories
- [ ] Add transaction support
- [ ] Create repository tests
- [ ] Set up connection pooling

**Repository Implementation:**

- [ ] UserRepository with CRUD operations
- [ ] AppointmentRepository with conflict detection
- [ ] AssignmentRepository with file handling
- [ ] NotificationRepository with preferences
- [ ] AnalyticsRepository with aggregations

**Testing:**

- [ ] Unit tests for each repository
- [ ] Integration tests with test database
- [ ] Transaction rollback tests
- [ ] Performance tests for complex queries

**Acceptance Criteria:**

- All repositories implement their interfaces
- Database operations are properly abstracted
- Transaction handling works correctly

### 2.3 Service Layer Foundation

**Tasks:**

- [ ] Create base service classes
- [ ] Implement error handling system
- [ ] Set up result/either pattern
- [ ] Create service dependency injection
- [ ] Add audit logging

**Core Services:**

- [ ] IdempotencyService for booking conflicts
- [ ] RateLimitService for API protection
- [ ] AuditService for activity tracking
- [ ] EmailTemplateService for notifications

**Testing:**

- [ ] Unit tests for all services
- [ ] Mock repository dependencies
- [ ] Test error handling scenarios
- [ ] Validate audit log creation

**Acceptance Criteria:**

- Services are properly isolated
- Error handling is consistent
- Dependency injection works
- Audit trail is captured

### 2.4 Edge Middleware & Security Headers

**Tasks:**

- [ ] Implement edge middleware for rate limiting on public endpoints
- [ ] Add security headers (CSP, CORP, Referrer-Policy, X-Frame-Options)
- [ ] Correlation ID propagation and request logging
- [ ] Healthcheck endpoint for uptime monitoring

**Testing:**

- [ ] Rate limit unit/integration tests (burst and sustained traffic)
- [ ] Header presence and CSP report-only validation
- [ ] Healthcheck monitored in CI pipeline

**Acceptance Criteria:**

- Public APIs are rate limited with clear 429 responses
- Security headers applied consistently
- Healthcheck returns 200 with version/build info

## Phase 3: Core Features Implementation (Week 4-7)

### 3.1 User Management

**Tasks:**

- [ ] User profile creation and editing
- [ ] Student profile with preferences
- [ ] Tutor profile with subjects/rates
- [ ] File upload for avatars
- [ ] Timezone handling

**API Endpoints:**

- [ ] GET/PATCH /api/users/me
- [ ] GET/PATCH /api/users/[id]/profile
- [ ] POST /api/files/upload (avatar)
- [ ] GET /api/users (admin only)
- [ ] GET /api/students/dashboard (student-specific data)
- [ ] GET /api/tutors/dashboard (tutor-specific data)

**Testing:**

- [ ] Profile CRUD operations
- [ ] File upload validation
- [ ] Authorization checks
- [ ] Timezone conversion accuracy

**Test Scenarios:**

- User can view and edit their profile
- File uploads work with proper validation
- Timezone changes are handled correctly
- Admin can view all users
- Non-admin cannot access other profiles

**Acceptance Criteria:**

- Complete profile management works
- File uploads are secure and validated
- Timezone handling is accurate

### 3.2 Availability Management

**Tasks:**

- [ ] Tutor availability CRUD
- [ ] Recurring availability patterns
- [ ] Availability exceptions
- [ ] Timezone-aware scheduling
- [ ] Conflict detection

**Components:**

- [ ] Availability grid component
- [ ] Time slot picker
- [ ] Recurring schedule editor
- [ ] Exception date picker

**API Endpoints:**

- [ ] GET/POST /api/tutors/availability
- [ ] PATCH/DELETE /api/tutors/availability/[id]
- [ ] POST /api/tutors/availability/exceptions
- [ ] GET /api/tutors/[id]/availability

**Testing:**

- [ ] Availability CRUD operations
- [ ] Recurring pattern calculations
- [ ] Exception handling
- [ ] Timezone conversion tests
- [ ] Conflict detection accuracy

**Acceptance Criteria:**

- Tutors can set complex availability schedules
- Recurring patterns work correctly
- Exceptions override recurring patterns
- All times are timezone-aware

### 3.3 Appointment Booking System

**Tasks:**

- [ ] Booking form with validation
- [ ] Idempotent booking with Redis locks
- [ ] Conflict detection and prevention
- [ ] Booking confirmation system
- [ ] Cancellation and rescheduling

**Core Logic:**

- [ ] Available slot calculation
- [ ] Double-booking prevention
- [ ] Idempotency key handling
- [ ] Booking state management
- [ ] Automatic confirmations

**API Endpoints:**

- [ ] POST /api/appointments/book (with Idempotency-Key)
- [ ] GET /api/appointments
- [ ] PATCH /api/appointments/[id]
- [ ] DELETE /api/appointments/[id]
- [ ] POST /api/appointments/[id]/rating (student review)
- [ ] GET /api/appointments/[id]/comments (session comments)

**Testing:**

- [ ] Booking flow end-to-end tests
- [ ] Concurrent booking prevention
- [ ] Idempotency key validation
- [ ] Cancellation and refund logic
- [ ] Edge cases (DST, holidays)

**Test Scenarios:**

- Student can book available time slot
- Double booking is prevented
- Idempotent requests work correctly
- Cancellation within policy works
- DST transitions handled properly
- Concurrent bookings fail appropriately

**Acceptance Criteria:**

- Booking system prevents conflicts
- Idempotency ensures consistency
- All booking states are handled
- Edge cases are properly managed

### 3.4 Assignment System

**Tasks:**

- [ ] Assignment creation by tutors
- [ ] File attachment handling
- [ ] Student submission system
- [ ] Grading and feedback
- [ ] Progress tracking
- [ ] Storage abstraction (local adapter for dev, S3 adapter for prod)

**Components:**

- [ ] Assignment creation form
- [ ] File upload with drag-and-drop
- [ ] Submission interface
- [ ] Grading interface
- [ ] Progress visualization

**API Endpoints:**

- [ ] GET/POST /api/assignments
- [ ] GET/PATCH /api/assignments/[id]
- [ ] GET/POST /api/assignments/[id]/submissions
- [ ] PATCH /api/assignments/submissions/[id] (grading)
- [ ] GET /api/students/[id]/progress (progress tracking)
- [ ] POST /api/students/[id]/progress (update progress)
- [ ] POST /api/files/upload (assignment files)
- [ ] DELETE /api/files/[id]

**Testing:**

- [ ] Assignment CRUD operations
- [ ] File upload and validation
- [ ] Submission workflow
- [ ] Grading functionality
- [ ] Progress calculations

**Acceptance Criteria:**

- Complete assignment lifecycle works
- File handling is secure
- Progress tracking is accurate
- Grading system functions properly

## Phase 4: Advanced Features (Week 8-10)

### 4.1 Notification System

**Tasks:**

- [ ] Email notification service with SendGrid
- [ ] SMS notification service (Twilio integration - future)
- [ ] In-app notification system with real-time updates (SSE or WebSocket)
- [ ] Notification preferences management
- [ ] Scheduled notifications with background jobs
- [ ] Notification templates and localization

**Notification Types:**

- [ ] Appointment confirmations
- [ ] Assignment due dates
- [ ] Cancellation notices
- [ ] Reminder notifications
- [ ] System announcements

**Testing:**

- [ ] Email delivery testing
- [ ] Template rendering tests
- [ ] Preference handling
- [ ] Scheduled delivery
- [ ] Rate limiting for notifications

**Acceptance Criteria:**

- All notification types work correctly
- User preferences are respected
- Scheduled notifications fire properly
- Email templates render correctly

### 4.3 Advertisements Management

**Tasks:**

- [ ] Advertisement CRUD (admin)
- [ ] Placement components and client rendering
- [ ] Targeting rules and feature flags (basic)
- [ ] Analytics tracking for impressions/clicks

**API Endpoints:**

- [ ] GET/POST /api/advertisements
- [ ] GET/PATCH/DELETE /api/advertisements/[id]
- [ ] GET /api/advertisements/analytics

**Testing:**

- [ ] Admin-only access controls
- [ ] Placement rendering tests
- [ ] Analytics event correctness

**Acceptance Criteria:**

- Admin can manage ads
- Ads display in configured positions
- Analytics provide basic performance insights

### 4.2 Calendar Integration

**Tasks:**

- [ ] Google Calendar OAuth setup and flow
- [ ] Calendar sync functionality (bidirectional)
- [ ] Webhook handling for external calendar updates
- [ ] Two-way synchronization with conflict resolution
- [ ] Calendar disconnect and cleanup functionality

**Integration Features:**

- [ ] Connect/disconnect Google Calendar
- [ ] Sync appointments to external calendar
- [ ] Handle external calendar changes via webhooks
- [ ] Manage sync conflicts and user preferences
- [ ] Support multiple calendar providers (future: Outlook)

**API Endpoints:**

- [ ] POST /api/integrations/google/connect
- [ ] DELETE /api/integrations/google/disconnect
- [ ] POST /api/webhooks/google-calendar (webhook handler)
- [ ] GET /api/users/me/integrations (connection status)

**Testing:**

- [ ] OAuth flow testing
- [ ] Sync accuracy validation
- [ ] Webhook handling tests
- [ ] Conflict resolution scenarios

**Acceptance Criteria:**

- Calendar integration works reliably
- Sync is bidirectional and accurate
- Conflicts are resolved properly
- OAuth flow is secure

### 4.3 Analytics and Reporting

**Tasks:**

- [ ] Student progress analytics
- [ ] Tutor performance metrics
- [ ] Booking statistics
- [ ] Revenue reporting
- [ ] Data export functionality

**Dashboard Features:**

- [ ] Student dashboard with progress and upcoming sessions
- [ ] Tutor dashboard with metrics and student overview
- [ ] Admin analytics overview with system health
- [ ] Customizable reports and data visualization
- [ ] Advertisement performance tracking

**API Endpoints:**

- [ ] GET /api/analytics/dashboard (role-specific)
- [ ] GET /api/analytics/reports/student-progress/[id]
- [ ] GET /api/analytics/reports/tutor-performance/[id]
- [ ] GET /api/advertisements/analytics
- [ ] POST /api/analytics/export (CSV, PDF formats)

**Testing:**

- [ ] Analytics calculation accuracy
- [ ] Dashboard loading performance
- [ ] Report generation tests
- [ ] Data export validation

**Acceptance Criteria:**

- Analytics provide meaningful insights
- Dashboards load quickly
- Reports generate correctly
- Data export works properly

## Phase 5: Testing and Quality Assurance (Week 11-12)

### 5.1 Comprehensive Testing

**Tasks:**

- [ ] Complete unit test coverage
- [ ] Integration test suite
- [ ] End-to-end test scenarios
- [ ] Performance testing
- [ ] Security testing

**Testing Goals:**

- [ ] > 90% code coverage for services
- [ ] All API endpoints tested
- [ ] Critical user flows covered
- [ ] Performance benchmarks met
- [ ] Security vulnerabilities addressed

**Test Types:**

- [ ] Unit tests (services, utilities)
- [ ] Integration tests (API routes, database)
- [ ] E2E tests (user workflows)
- [ ] Load tests (booking system)
- [ ] Security tests (auth, validation)

**Acceptance Criteria:**

- All tests pass consistently
- Coverage targets are met
- Performance is acceptable
- Security issues are resolved

### 5.3 PWA & Offline Support

**Tasks:**

- [ ] Add web app manifest and icons
- [ ] Configure service worker (Next PWA or custom) for offline cache of assignments
- [ ] Offline queue for assignment submissions (retry on reconnect)
- [ ] Installability checks and testing

**Testing:**

- [ ] Lighthouse PWA audits >90
- [ ] Offline reads for assignment pages
- [ ] Retry queue works after reconnect

**Acceptance Criteria:**

- App is installable
- Assignments accessible offline (read-only)
- Submission queue retries on network restore

### 5.4 Privacy & Compliance

**Tasks:**

- [ ] GDPR data export endpoint
- [ ] GDPR account deletion with cascading data cleanup
- [ ] Data retention policies and cleanup jobs
- [ ] Audit of PII storage and encryption at rest/in transit

**Testing:**

- [ ] Export includes all user data and is downloadable securely
- [ ] Deletion removes PII and anonymizes analytics
- [ ] Retention jobs verified on schedule

**Acceptance Criteria:**

- Compliance endpoints function securely
- Documentation updated for users/admins

### 5.2 Bug Fixes and Polish

**Tasks:**

- [ ] Address test failures
- [ ] Fix identified bugs
- [ ] UI/UX improvements
- [ ] Performance optimizations
- [ ] Accessibility compliance

**Quality Checks:**

- [ ] Cross-browser compatibility
- [ ] Mobile responsiveness
- [ ] Accessibility audit
- [ ] Performance profiling
- [ ] Security review

**Acceptance Criteria:**

- All critical bugs resolved
- UI is polished and responsive
- Accessibility standards met
- Performance targets achieved

## Phase 6: Deployment and Monitoring (Week 13-14)

### 6.1 Production Setup

**Tasks:**

- [ ] Set up production database
- [ ] Configure production Redis
- [ ] Set up monitoring and logging
- [ ] Configure error tracking
- [ ] Set up backup systems

**Infrastructure:**

- [ ] Production database with backups
- [ ] Redis cluster for caching
- [ ] CDN for static assets
- [ ] Monitoring dashboard
- [ ] Error tracking service

**Testing:**

- [ ] Production deployment test
- [ ] Load testing in staging
- [ ] Monitoring validation
- [ ] Backup/restore testing

**Acceptance Criteria:**

- Production environment is stable
- Monitoring captures all metrics
- Backup systems work correctly
- Error tracking is functional

### 6.2 CI/CD Pipeline

**Tasks:**

- [ ] Set up GitHub Actions workflow
- [ ] Automated testing pipeline
- [ ] Database migration automation
- [ ] Production deployment automation
- [ ] Rollback procedures

**Pipeline Stages:**

- [ ] Code quality checks (lint, format)
- [ ] Automated testing (unit, integration)
- [ ] Build and security scan
- [ ] Staging deployment
- [ ] Production deployment

**Testing:**

- [ ] Pipeline execution tests
- [ ] Deployment verification
- [ ] Rollback testing
- [ ] Migration testing

**Acceptance Criteria:**

- CI/CD pipeline runs reliably
- All quality gates function
- Deployments are automated
- Rollback procedures work

## Testing Strategy Summary

### Unit Testing (Throughout Development)

- **Tools:** Vitest, Testing Library
- **Coverage:** Services, utilities, hooks
- **Goal:** >90% coverage for business logic
- **Frequency:** Every feature implementation

### Integration Testing (Per Phase)

- **Tools:** Testcontainers, Next.js test runner
- **Coverage:** API routes, database operations
- **Goal:** All endpoints tested with real dependencies
- **Frequency:** End of each implementation phase

### End-to-End Testing (Major Milestones)

- **Tools:** Playwright
- **Coverage:** Critical user journeys
- **Scenarios:**
  - Complete booking flow
  - Assignment submission workflow
  - User registration and profile setup
  - Calendar integration
  - Notification delivery

### Performance Testing (Pre-Production)

- **Tools:** Artillery, Lighthouse
- **Metrics:** Response times, throughput, memory usage
- **Scenarios:** Peak booking loads, concurrent users
- **Targets:** <500ms API responses, >90 Lighthouse score

## Risk Mitigation

### Technical Risks

- **Database performance:** Index optimization, query profiling
- **Concurrent bookings:** Redis-based locking, idempotency
- **Calendar sync reliability:** Robust error handling, retry logic
- **File upload security:** Validation, scanning, size limits

### Timeline Risks

- **Complex integrations:** Calendar sync and OAuth flows - Start early, have fallback plans
- **Testing delays:** Write tests alongside features, not after
- **Performance issues:** Monitor early with realistic data, optimize continuously
- **Concurrent booking race conditions:** Implement Redis-based locking from the start
- **Database migration complexity:** Plan schema changes carefully, test with production-like data

## Success Metrics

### Development Metrics

- [ ] Code coverage >90%
- [ ] All E2E tests passing
- [ ] Zero security vulnerabilities
- [ ] Performance targets met

### Business Metrics

- [ ] User registration flow <2 minutes
- [ ] Booking success rate >95%
- [ ] System uptime >99.5%
- [ ] Page load times <2 seconds

## Timeline Summary

- **Weeks 1-2:** Foundation and setup
- **Weeks 2-3:** Core infrastructure
- **Weeks 4-7:** Core features (users, booking, assignments)
- **Weeks 8-10:** Advanced features (notifications, calendar, analytics)
- **Weeks 11-12:** Testing and quality assurance
- **Weeks 13-14:** Deployment and monitoring

**Total Duration:** 14 weeks (3.5 months)
**Team Size:** 2-3 developers
**Effort:** Approximately 500-750 developer hours

This plan provides a solid foundation for implementing the tutoring calendar application with proper testing, quality assurance, and deployment practices.
