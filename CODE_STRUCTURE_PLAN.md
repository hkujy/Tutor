# Code Structure Plan

## Project Architecture Overview

This document outlines the modular code structure for the tutoring calendar application, ensuring maintainable, scalable, and well-organized code across multiple files.

Design principles
- Small, focused files with clear boundaries (services, repos, UI, hooks)
- Strong typing at API boundaries with runtime validation (Zod)
- Ports and adapters: repositories as ports, Prisma as adapter
- Cross-cutting concerns centralized (errors, logging, metrics, rate-limit, idempotency)
- Test-first for domain logic; integration tests for boundaries

## Technology Stack
- **Frontend**: Next.js 14 with TypeScript
- **Backend**: Next.js API routes + Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS + shadcn/ui
- **State/Data**: TanStack Query (React Query) + fetch wrappers
- **Validation**: Zod for DTOs and env
- **Caching/Rate limit/Idempotency**: Redis
- **Logging/Tracing**: pino + OpenTelemetry (optional Sentry)

## Root Project Structure

```
tutoring-calendar/
├── README.md
├── package.json
├── .eslintrc.cjs
├── .prettierrc
├── .editorconfig
├── .env.local
├── .env.test
├── .nvmrc
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── middleware.ts                # Auth + rate limit + locale (Edge)
├── .github/
│   └── workflows/
│       └── ci.yml               # Lint, typecheck, tests, build
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── src/
│   ├── app/                    # Next.js 14 app router
│   ├── components/             # Reusable UI components
│   ├── lib/                    # Shared utilities and configurations
│   ├── hooks/                  # Custom React hooks
│   ├── types/                  # TypeScript type definitions
│   ├── services/               # Business logic and API calls
│   ├── jobs/                   # Background jobs & schedulers
│   └── server/                 # Server-only helpers (token, cookies)
├── public/                     # Static assets
├── tests/                      # Test files
│   ├── __mocks__/
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── docs/                       # Documentation files
```

## Backend Structure (src/app/api/)

### Authentication Routes
```
src/app/api/auth/
├── [...nextauth]/
│   └── route.ts                # NextAuth route handler
├── register/
│   └── route.ts                # POST /api/auth/register
├── login/
│   └── route.ts                # POST /api/auth/login
├── logout/
│   └── route.ts                # POST /api/auth/logout
└── verify-email/
    └── route.ts                # POST /api/auth/verify-email
```

### User Management Routes
```
src/app/api/users/
├── route.ts                    # GET /api/users (admin)
├── [id]/
│   ├── route.ts                # GET, PATCH /api/users/[id]
│   └── profile/
│       └── route.ts            # GET, PATCH /api/users/[id]/profile
└── me/
    └── route.ts                # GET, PATCH /api/users/me
```

### Student Management Routes
```
src/app/api/students/
├── route.ts                    # GET /api/students
├── [id]/
│   ├── route.ts                # GET, PATCH /api/students/[id]
│   ├── progress/
│   │   └── route.ts            # GET, POST /api/students/[id]/progress
│   └── comments/
│       └── route.ts            # POST /api/students/[id]/comments
└── dashboard/
    └── route.ts                # GET /api/students/dashboard
```

### Tutor Management Routes
```
src/app/api/tutors/
├── route.ts                    # GET /api/tutors
├── [id]/
│   ├── route.ts                # GET /api/tutors/[id]
│   ├── availability/
│   │   └── route.ts            # GET /api/tutors/[id]/availability
│   └── reviews/
│       └── route.ts            # GET /api/tutors/[id]/reviews
├── availability/
│   ├── route.ts                # POST /api/tutors/availability
│   ├── [id]/
│   │   └── route.ts            # PATCH, DELETE /api/tutors/availability/[id]
│   └── exceptions/
│       └── route.ts            # POST /api/tutors/availability/exceptions
└── dashboard/
    └── route.ts                # GET /api/tutors/dashboard
```

### Appointment Routes
```
src/app/api/appointments/
├── route.ts                    # GET, POST /api/appointments
├── book/
│   └── route.ts                # POST /api/appointments/book
├── [id]/
│   ├── route.ts                # GET, PATCH, DELETE /api/appointments/[id]
│   ├── rating/
│   │   └── route.ts            # POST /api/appointments/[id]/rating
│   └── comments/
│       └── route.ts            # GET /api/appointments/[id]/comments
└── bulk-operations/
    └── route.ts                # POST /api/appointments/bulk-operations
```

Route handler notes
- Apply Zod schemas in each route for input/output
- Enforce Idempotency-Key on booking endpoints (Redis-backed)
- Map domain errors to HTTP problem details consistently

### Assignment Routes
```
src/app/api/assignments/
├── route.ts                    # GET, POST /api/assignments
├── [id]/
│   ├── route.ts                # GET, PATCH /api/assignments/[id]
│   └── submissions/
│       ├── route.ts            # GET, POST /api/assignments/[id]/submissions
│       └── [submissionId]/
│           └── route.ts        # PATCH /api/assignments/submissions/[id]
└── bulk-grade/
    └── route.ts                # POST /api/assignments/bulk-grade
```

### Comment Routes
```
src/app/api/comments/
├── [id]/
│   └── route.ts                # GET, PATCH, DELETE /api/comments/[id]
└── bulk/
    └── route.ts                # POST /api/comments/bulk
```

### Notification Routes
```
src/app/api/notifications/
├── route.ts                    # GET /api/notifications
├── send/
│   └── route.ts                # POST /api/notifications/send
├── preferences/
│   └── route.ts                # GET, PATCH /api/notifications/preferences
├── [id]/
│   └── read/
│       └── route.ts            # PATCH /api/notifications/[id]/read
└── bulk-mark-read/
    └── route.ts                # POST /api/notifications/bulk-mark-read
```

### File Management Routes
```
src/app/api/files/
├── upload/
│   └── route.ts                # POST /api/files/upload
├── [id]/
│   └── route.ts                # GET, DELETE /api/files/[id]
└── bulk-delete/
    └── route.ts                # POST /api/files/bulk-delete
```

### Integration Routes
```
src/app/api/integrations/
├── google/
│   ├── connect/
│   │   └── route.ts            # POST /api/integrations/google/connect
│   └── disconnect/
│       └── route.ts            # DELETE /api/integrations/google/disconnect
└── webhooks/
    ├── google-calendar/
    │   └── route.ts            # POST /api/webhooks/google-calendar
    └── stripe/
        └── route.ts            # POST /api/webhooks/stripe
```

### Analytics & Reports Routes
```
src/app/api/analytics/
├── dashboard/
│   └── route.ts                # GET /api/analytics/dashboard
├── reports/
│   ├── student-progress/
│   │   └── [id]/
│   │       └── route.ts        # GET /api/reports/student-progress/[id]
│   └── tutor-performance/
│       └── [id]/
│           └── route.ts        # GET /api/reports/tutor-performance/[id]
└── export/
    └── route.ts                # POST /api/analytics/export
```

### Advertisement Routes
```
src/app/api/advertisements/
├── route.ts                    # GET, POST /api/advertisements
├── [id]/
│   └── route.ts                # GET, PATCH, DELETE /api/advertisements/[id]
└── analytics/
    └── route.ts                # GET /api/advertisements/analytics
```

## Services Layer (src/services/)

### Core Services
```
src/services/
├── auth/
│   ├── auth.service.ts         # Authentication logic
│   ├── session.service.ts      # Session management
│   └── permission.service.ts   # Role-based permissions
├── common/
│   ├── idempotency.service.ts  # Idempotent operations (Redis)
│   ├── rate-limit.service.ts   # Token-bucket/sliding window (Redis)
│   ├── audit.service.ts        # Audit log writes
│   └── email-template.service.ts # Email templating
├── user/
│   ├── user.service.ts         # User CRUD operations
│   ├── profile.service.ts      # Profile management
│   └── preference.service.ts   # User preferences
├── appointment/
│   ├── appointment.service.ts  # Appointment CRUD
│   ├── booking.service.ts      # Booking logic with conflicts
│   ├── availability.service.ts # Availability management
│   └── scheduler.service.ts    # Scheduling algorithms
├── assignment/
│   ├── assignment.service.ts   # Assignment CRUD
│   ├── submission.service.ts   # Submission handling
│   └── grading.service.ts      # Grading logic
├── notification/
│   ├── notification.service.ts # Notification CRUD
│   ├── email.service.ts        # Email sending
│   ├── sms.service.ts          # SMS sending
│   └── scheduler.service.ts    # Notification scheduling
├── file/
│   ├── upload.service.ts       # File upload handling
│   ├── storage.service.ts      # Cloud storage interface
│   └── validation.service.ts   # File validation
├── analytics/
│   ├── analytics.service.ts    # Analytics computation
│   ├── reporting.service.ts    # Report generation
│   └── export.service.ts       # Data export
└── integration/
    ├── google-calendar.service.ts # Google Calendar sync
    ├── webhook.service.ts      # Webhook handling
    └── payment.service.ts      # Payment processing
```

Service design
- Keep services pure where possible; inject repositories, cache, clock, logger
- Use small function groups; split when >5 core operations
- Return Result<E, T> or throw typed errors from /lib/errors

## Database Layer (src/lib/db/)

### Database Utilities
```
src/lib/db/
├── client.ts                   # Prisma client instance
├── connection.ts               # DB connection management
├── transaction.ts              # Transaction helpers
├── clock.ts                    # Centralized clock (testable time)
├── seed/
│   ├── users.ts               # User seed data
│   ├── appointments.ts        # Appointment seed data
│   └── assignments.ts         # Assignment seed data
├── repositories/
│   ├── user.repository.ts     # User data access
│   ├── appointment.repository.ts # Appointment data access
│   ├── assignment.repository.ts # Assignment data access
│   ├── notification.repository.ts # Notification data access
│   └── analytics.repository.ts # Analytics queries
└── migrations/
    └── custom/                 # Custom migration scripts
```

Repository pattern
- Define repository interfaces in src/types or alongside repos
- Keep all Prisma calls in repositories; never in services or routes
- Expose query methods with narrow DTOs (no Prisma types leaking)

## Utilities and Configuration (src/lib/)

### Core Utilities
```
src/lib/
├── auth/
│   ├── config.ts              # Auth configuration
│   ├── providers.ts           # Auth providers setup
│   └── middleware.ts          # Auth middleware
├── http/
│   ├── client.ts              # Fetch wrapper with retries and JSON
│   ├── errors.ts              # HTTP error types & mappers
│   └── rate-limit.ts          # Edge-safe rate limiter helpers
├── validation/
│   ├── schemas.ts             # Zod validation schemas
│   ├── appointment.schema.ts  # Appointment validation
│   ├── assignment.schema.ts   # Assignment validation
│   └── user.schema.ts         # User validation
├── utils/
│   ├── date.ts                # Date/time utilities
│   ├── timezone.ts            # Timezone handling
│   ├── format.ts              # Data formatting
│   ├── encryption.ts          # Encryption utilities
│   ├── logger.ts              # Logging (pino) setup
│   ├── result.ts              # Result/Either helpers
│   └── idempotency.ts         # Idempotency helpers (keys, hashing)
├── constants/
│   ├── api.ts                 # API constants
│   ├── ui.ts                  # UI constants
│   └── system.ts              # System constants
├── types/
│   ├── api.types.ts           # API type definitions
│   ├── auth.types.ts          # Auth type definitions
│   ├── appointment.types.ts   # Appointment types
│   ├── assignment.types.ts    # Assignment types
│   └── notification.types.ts  # Notification types
└── config/
    ├── env.ts                 # Env validation (Zod)
    ├── database.ts            # DB configuration
    ├── email.ts               # Email configuration
    ├── storage.ts             # File storage config
    ├── cache.ts               # Redis config & clients
    └── integrations.ts        # Third-party integrations

Observability (src/lib/observability)
- logger.ts: pino instance with serializers
- metrics.ts: OTEL metrics setup
- tracing.ts: OTEL tracing setup (optional)
```

## Frontend Structure (src/app/ and src/components/)

### Page Components (App Router)
```
src/app/
├── (auth)/
│   ├── login/
│   │   └── page.tsx           # Login page
│   ├── register/
│   │   └── page.tsx           # Registration page
│   └── layout.tsx             # Auth layout
├── (dashboard)/
│   ├── student/
│   │   ├── page.tsx           # Student dashboard
│   │   ├── appointments/
│   │   │   ├── page.tsx       # Student appointments
│   │   │   └── book/
│   │   │       └── page.tsx   # Book appointment
│   │   ├── assignments/
│   │   │   ├── page.tsx       # Student assignments
│   │   │   └── [id]/
│   │   │       └── page.tsx   # Assignment detail
│   │   └── progress/
│   │       └── page.tsx       # Student progress
│   ├── tutor/
│   │   ├── page.tsx           # Tutor dashboard
│   │   ├── schedule/
│   │   │   └── page.tsx       # Tutor schedule
│   │   ├── students/
│   │   │   ├── page.tsx       # Student list
│   │   │   └── [id]/
│   │   │       └── page.tsx   # Student detail
│   │   └── assignments/
│   │       ├── page.tsx       # Assignment management
│   │       └── create/
│   │           └── page.tsx   # Create assignment
│   └── layout.tsx             # Dashboard layout
├── calendar/
│   └── page.tsx               # Public calendar view
├── settings/
│   ├── page.tsx               # General settings
│   ├── profile/
│   │   └── page.tsx           # Profile settings
│   └── notifications/
│       └── page.tsx           # Notification preferences
├── layout.tsx                 # Root layout
├── loading.tsx                # Global loading component
├── error.tsx                  # Global error component
└── not-found.tsx              # 404 page
```

Feature-sliced UI (optional)
- src/features/booking, /assignments, /notifications: colocate domain UI, hooks, and API calls per feature
- Keep shared primitives in src/components and cross-feature hooks in src/hooks

### Reusable Components
```
src/components/
├── ui/                        # shadcn/ui components
│   ├── button.tsx
│   ├── input.tsx
│   ├── calendar.tsx
│   ├── dialog.tsx
│   └── ...
├── forms/
│   ├── appointment-form.tsx   # Appointment booking form
│   ├── assignment-form.tsx    # Assignment creation form
│   ├── profile-form.tsx       # Profile editing form
│   ├── login-form.tsx         # Login form
│   └── register-form.tsx      # Registration form
├── calendar/
│   ├── calendar-view.tsx      # Main calendar component
│   ├── time-slot.tsx          # Individual time slot
│   ├── availability-grid.tsx  # Availability display
│   └── booking-modal.tsx      # Booking confirmation modal
├── appointments/
│   ├── appointment-card.tsx   # Appointment display card
│   ├── appointment-list.tsx   # List of appointments
│   ├── status-badge.tsx       # Appointment status indicator
│   └── rating-widget.tsx      # Rating/review component
├── assignments/
│   ├── assignment-card.tsx    # Assignment display card
│   ├── assignment-list.tsx    # List of assignments
│   ├── submission-form.tsx    # Assignment submission
│   ├── grading-form.tsx       # Grading interface
│   └── progress-tracker.tsx   # Progress visualization
├── navigation/
│   ├── navbar.tsx             # Main navigation
│   ├── sidebar.tsx            # Dashboard sidebar
│   ├── breadcrumbs.tsx        # Breadcrumb navigation
│   └── mobile-nav.tsx         # Mobile navigation
├── dashboard/
│   ├── stats-card.tsx         # Statistics display card
│   ├── activity-feed.tsx      # Recent activity
│   ├── quick-actions.tsx      # Quick action buttons
│   └── upcoming-sessions.tsx  # Upcoming sessions widget
├── notifications/
│   ├── notification-bell.tsx  # Notification icon with badge
│   ├── notification-list.tsx  # List of notifications
│   ├── toast-provider.tsx     # Toast notification provider
│   └── preferences-panel.tsx  # Notification settings
├── profile/
│   ├── avatar-upload.tsx      # Avatar upload component
│   ├── profile-card.tsx       # Profile display card
│   └── timezone-selector.tsx  # Timezone selection
└── common/
    ├── loading-spinner.tsx    # Loading indicators
    ├── error-boundary.tsx     # Error boundary component
    ├── confirm-dialog.tsx     # Confirmation dialog
    ├── data-table.tsx         # Reusable data table
    ├── date-picker.tsx        # Date selection component
    └── file-upload.tsx        # File upload component
```

### Custom Hooks
```
src/hooks/
├── auth/
│   ├── useAuth.ts             # Authentication state
│   ├── useSession.ts          # Session management
│   └── usePermissions.ts      # Permission checking
├── api/
│   ├── useAppointments.ts     # Appointments API calls
│   ├── useAssignments.ts      # Assignments API calls
│   ├── useStudents.ts         # Students API calls
│   ├── useNotifications.ts    # Notifications API calls
│   └── useAnalytics.ts        # Analytics API calls
├── calendar/
│   ├── useCalendar.ts         # Calendar state management
│   ├── useAvailability.ts     # Availability management
│   └── useTimeSlots.ts        # Time slot calculations
├── forms/
│   ├── useFormValidation.ts   # Form validation logic
│   └── useFormSubmission.ts   # Form submission handling
└── utils/
    ├── useLocalStorage.ts     # Local storage management
    ├── useDebounce.ts         # Debounced values
    ├── useMediaQuery.ts       # Responsive design
    └── useTimezone.ts         # Timezone handling
```

Data fetching strategy
- Use TanStack Query for caching, retries, and background refresh
- Keep API calls in hooks (src/hooks/api/*) using lib/http/client
- Normalize time handling with utils/date + timezone; store and transmit ISO UTC; render in user TZ

## Testing Structure
```
tests/
├── unit/
│   ├── services/              # Service layer tests
│   ├── utils/                 # Utility function tests
│   ├── hooks/                 # Custom hook tests
│   └── components/            # Component unit tests
├── integration/
│   ├── api/                   # API route tests
│   ├── auth/                  # Authentication flow tests
│   └── database/              # Database operation tests
├── e2e/
│   ├── booking-flow.test.ts   # End-to-end booking test
│   ├── assignment-flow.test.ts # Assignment creation to submission
│   └── notification-flow.test.ts # Notification delivery test
├── __mocks__/
│   ├── prisma.ts              # Prisma client mock
│   ├── nextauth.ts            # NextAuth mock
│   └── services/              # Service mocks
└── fixtures/
    ├── users.json             # Test user data
    ├── appointments.json      # Test appointment data
    └── assignments.json       # Test assignment data
```

Testing guidance
- Unit: services and utils with deterministic clock
- Integration: API routes with Next.js test runtime + Testcontainers for Postgres/Redis
- E2E: Playwright against dev server, seed DB before suite
- Factories/data builders in tests/factories; avoid coupling to Prisma types

## File Size Guidelines

### Maximum File Sizes (Lines of Code)
- **API Routes**: 150 lines max
- **Service Files**: 200 lines max
- **Component Files**: 250 lines max
- **Utility Files**: 100 lines max
- **Hook Files**: 150 lines max
- **Type Definition Files**: 200 lines max

### When to Split Files
- **API Routes**: Split when handling more than 3 HTTP methods
- **Services**: Split when handling more than 5 core operations
- **Components**: Split when component has more than 3 distinct responsibilities
- **Hooks**: Split when managing more than 2 different state concerns

How to keep files small
- Extract pure helpers to utils; keep side-effects at boundaries
- Break large components into presentational + container parts
- Use composition over props drilling; colocate small subcomponents

## Development Workflow

### File Naming Conventions
- **API Routes**: `route.ts` (Next.js 14 convention)
- **Services**: `[entity].service.ts`
- **Components**: `kebab-case.tsx`
- **Hooks**: `use[PascalCase].ts`
- **Types**: `[entity].types.ts`
- **Utils**: `kebab-case.ts`
- **Tests**: `[filename].test.ts`

### Import Organization
```typescript
// 1. External libraries
import React from 'react'
import { NextRequest } from 'next/server'

// 2. Internal utilities/configs
import { db } from '@/lib/db/client'
import { validateSchema } from '@/lib/validation/schemas'

// 3. Services
import { appointmentService } from '@/services/appointment/appointment.service'

// 4. Types
import type { AppointmentCreateInput } from '@/types/appointment.types'

// 5. Components (if applicable)
import { Button } from '@/components/ui/button'
```

### Code Organization Principles
1. **Single Responsibility**: Each file handles one primary concern
2. **Dependency Injection**: Services receive dependencies rather than importing directly
3. **Error Boundaries**: Wrap components with error handling
4. **Type Safety**: Comprehensive TypeScript coverage
5. **Testability**: Design for easy unit and integration testing

Security & resilience
- Rate limit public APIs; authz checks in services, not routes
- Validate all inputs and serialize outputs (no prisma types to client)
- Standardize errors to problem+json; log with correlation IDs
- Add security headers (CSP, CORP, Referrer-Policy) in next.config or middleware

Runtime concerns
- Idempotency for booking: require Idempotency-Key; lock window by (tutorId,startAt)
- Background jobs: reminders, digest emails, cleanup; define in src/jobs with simple cron or a queue
- Caching: cache read-heavy lists in Redis with short TTL; bust on write

DX & CI
- Husky + lint-staged for pre-commit (lint, typecheck on changed files)
- CI workflow (ci.yml): pnpm install, prisma generate, lint, typecheck, unit, integration, build
- Scripts: dev, build, start, test:unit, test:int, test:e2e, typecheck, lint, format, prisma:migrate, seed

This structure ensures maintainable, scalable code with clear separation of concerns and easy navigation for developers.
