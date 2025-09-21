# System Architecture Diagrams

This document provides visual representations of the tutoring calendar application's architecture, showing relationships and connections between files, classes, and functions.

## 1. High-Level Architecture Overview

```mermaid
graph TB
    subgraph "Frontend Layer"
        UI[Next.js App Router Pages]
        COMP[React Components]
        HOOKS[Custom Hooks]
    end

    subgraph "API Layer"
        AUTH[Auth Routes]
        APPT[Appointment Routes]
        ASSIGN[Assignment Routes]
        NOTIF[Notification Routes]
        USER[User Routes]
        TUTOR[Tutor Routes]
    end

    subgraph "Service Layer"
        AS[Auth Service]
        APS[Appointment Service]
        ASSIGNS[Assignment Service]
        NS[Notification Service]
        US[User Service]
        TS[Tutor Service]
        IS[Integration Service]
    end

    subgraph "Data Layer"
        REPO[Repositories]
        PRISMA[Prisma Client]
        DB[(PostgreSQL)]
    end

    subgraph "External Services"
        EMAIL[Email Service]
        SMS[SMS Service]
        GCAL[Google Calendar]
        STORAGE[File Storage]
    end

    UI --> COMP
    COMP --> HOOKS
    HOOKS --> AUTH
    HOOKS --> APPT
    HOOKS --> ASSIGN
    HOOKS --> NOTIF

    AUTH --> AS
    APPT --> APS
    ASSIGN --> ASSIGNS
    NOTIF --> NS
    USER --> US
    TUTOR --> TS

    AS --> REPO
    APS --> REPO
    ASSIGNS --> REPO
    NS --> REPO
    US --> REPO
    TS --> REPO

    REPO --> PRISMA
    PRISMA --> DB

    NS --> EMAIL
    NS --> SMS
    IS --> GCAL
    ASSIGNS --> STORAGE
```

## 2. API Routes to Services Mapping

```mermaid
graph LR
    subgraph "API Routes (/api/)"
        A1[auth/register/route.ts]
        A2[auth/login/route.ts]
        A3[appointments/route.ts]
        A4[appointments/book/route.ts]
        A5[assignments/route.ts]
        A6[notifications/route.ts]
        A7[students/[id]/progress/route.ts]
        A8[tutors/availability/route.ts]
    end

    subgraph "Services (/services/)"
        S1[auth/auth.service.ts]
        S2[appointment/appointment.service.ts]
        S3[appointment/booking.service.ts]
        S4[assignment/assignment.service.ts]
        S5[notification/notification.service.ts]
        S6[user/user.service.ts]
        S7[appointment/availability.service.ts]
    end

    subgraph "Repositories (/lib/db/repositories/)"
        R1[user.repository.ts]
        R2[appointment.repository.ts]
        R3[assignment.repository.ts]
        R4[notification.repository.ts]
    end

    A1 --> S1
    A2 --> S1
    A3 --> S2
    A4 --> S3
    A5 --> S4
    A6 --> S5
    A7 --> S6
    A8 --> S7

    S1 --> R1
    S2 --> R2
    S3 --> R2
    S4 --> R3
    S5 --> R4
    S6 --> R1
    S7 --> R2
```

## 3. Database Relationships and Repository Pattern

```mermaid
erDiagram
    USERS ||--o| STUDENTS : has
    USERS ||--o| TUTORS : has
    USERS ||--o{ NOTIFICATIONS : receives
    USERS ||--o| NOTIFICATION_PREFERENCES : has

    TUTORS ||--o{ AVAILABILITY : sets
    TUTORS ||--o{ AVAILABILITY_EXCEPTIONS : has
    TUTORS ||--o{ APPOINTMENTS : teaches
    TUTORS ||--o{ ASSIGNMENTS : creates

    STUDENTS ||--o{ APPOINTMENTS : books
    STUDENTS ||--o{ ASSIGNMENTS : receives
    STUDENTS ||--o{ STUDENT_PROGRESS : tracks
    STUDENTS ||--o{ ASSIGNMENT_SUBMISSIONS : submits

    APPOINTMENTS ||--o{ SESSION_COMMENTS : has
    APPOINTMENTS ||--o{ ASSIGNMENTS : generates

    ASSIGNMENTS ||--o{ ASSIGNMENT_FILES : contains
    ASSIGNMENTS ||--o{ ASSIGNMENT_SUBMISSIONS : receives

    USERS {
        string id PK
        string email UK
        string role
        string firstName
        string lastName
    }

    STUDENTS {
        string id PK
        string userId FK
        string gradeLevel
        string subjects
    }

    TUTORS {
        string id PK
        string userId FK
        string specializations
        decimal rating
    }
```

## 4. Service Layer Architecture

```mermaid
graph TB
    subgraph "Core Services"
        AUTH_S[AuthService]
        USER_S[UserService]
        PERM_S[PermissionService]
    end

    subgraph "Business Services"
        APPT_S[AppointmentService]
        BOOK_S[BookingService]
        AVAIL_S[AvailabilityService]
        ASSIGN_S[AssignmentService]
        GRADE_S[GradingService]
    end

    subgraph "Communication Services"
        NOTIF_S[NotificationService]
        EMAIL_S[EmailService]
        SMS_S[SMSService]
        SCHED_S[SchedulerService]
    end

    subgraph "Integration Services"
        GCAL_S[GoogleCalendarService]
        WEBHOOK_S[WebhookService]
        FILE_S[FileService]
    end

    subgraph "Repositories"
        USER_R[UserRepository]
        APPT_R[AppointmentRepository]
        ASSIGN_R[AssignmentRepository]
        NOTIF_R[NotificationRepository]
    end

    AUTH_S --> USER_R
    USER_S --> USER_R
    APPT_S --> APPT_R
    BOOK_S --> APPT_R
    AVAIL_S --> APPT_R
    ASSIGN_S --> ASSIGN_R
    NOTIF_S --> NOTIF_R

    BOOK_S --> NOTIF_S
    ASSIGN_S --> NOTIF_S
    NOTIF_S --> EMAIL_S
    NOTIF_S --> SMS_S
    SCHED_S --> NOTIF_S

    APPT_S --> GCAL_S
    AVAIL_S --> GCAL_S
```

## 5. Frontend Component Hierarchy

```mermaid
graph TB
    subgraph "Layout Components"
        ROOT[RootLayout]
        AUTH_LAY[AuthLayout]
        DASH_LAY[DashboardLayout]
        NAV[Navbar]
        SIDE[Sidebar]
    end

    subgraph "Page Components"
        LOGIN[LoginPage]
        REGISTER[RegisterPage]
        STUDENT_DASH[StudentDashboard]
        TUTOR_DASH[TutorDashboard]
        CALENDAR[CalendarPage]
        APPOINTMENTS[AppointmentsPage]
        ASSIGNMENTS[AssignmentsPage]
    end

    subgraph "Feature Components"
        CAL_VIEW[CalendarView]
        APPT_FORM[AppointmentForm]
        ASSIGN_FORM[AssignmentForm]
        BOOK_MODAL[BookingModal]
        RATING[RatingWidget]
        PROGRESS[ProgressTracker]
    end

    subgraph "UI Components"
        BUTTON[Button]
        INPUT[Input]
        DIALOG[Dialog]
        CALENDAR_UI[Calendar]
        TABLE[DataTable]
    end

    ROOT --> AUTH_LAY
    ROOT --> DASH_LAY
    DASH_LAY --> NAV
    DASH_LAY --> SIDE

    AUTH_LAY --> LOGIN
    AUTH_LAY --> REGISTER
    DASH_LAY --> STUDENT_DASH
    DASH_LAY --> TUTOR_DASH
    DASH_LAY --> CALENDAR
    DASH_LAY --> APPOINTMENTS
    DASH_LAY --> ASSIGNMENTS

    CALENDAR --> CAL_VIEW
    APPOINTMENTS --> APPT_FORM
    ASSIGNMENTS --> ASSIGN_FORM
    CAL_VIEW --> BOOK_MODAL
    APPOINTMENTS --> RATING
    STUDENT_DASH --> PROGRESS

    APPT_FORM --> BUTTON
    APPT_FORM --> INPUT
    BOOK_MODAL --> DIALOG
    CAL_VIEW --> CALENDAR_UI
    ASSIGNMENTS --> TABLE
```

## 6. Custom Hooks Dependencies

```mermaid
graph LR
    subgraph "Auth Hooks"
        USE_AUTH[useAuth]
        USE_SESSION[useSession]
        USE_PERM[usePermissions]
    end

    subgraph "API Hooks"
        USE_APPTS[useAppointments]
        USE_ASSIGNS[useAssignments]
        USE_STUDENTS[useStudents]
        USE_NOTIFS[useNotifications]
    end

    subgraph "Calendar Hooks"
        USE_CAL[useCalendar]
        USE_AVAIL[useAvailability]
        USE_SLOTS[useTimeSlots]
    end

    subgraph "Utility Hooks"
        USE_LOCAL[useLocalStorage]
        USE_DEBOUNCE[useDebounce]
        USE_TZ[useTimezone]
    end

    USE_SESSION --> USE_AUTH
    USE_PERM --> USE_AUTH
    USE_APPTS --> USE_AUTH
    USE_ASSIGNS --> USE_AUTH
    USE_STUDENTS --> USE_AUTH
    USE_NOTIFS --> USE_AUTH

    USE_CAL --> USE_APPTS
    USE_CAL --> USE_AVAIL
    USE_AVAIL --> USE_SLOTS
    USE_SLOTS --> USE_TZ

    USE_APPTS --> USE_LOCAL
    USE_ASSIGNS --> USE_LOCAL
    USE_CAL --> USE_DEBOUNCE
```

## 7. Data Flow - Appointment Booking Process

```mermaid
sequenceDiagram
    participant Student as Student UI
    participant Hook as useAppointments
    participant API as /api/appointments/book
    participant Service as BookingService
    participant Repo as AppointmentRepository
    participant DB as Database
    participant NotifService as NotificationService

    Student->>Hook: selectTimeSlot(slotId)
    Hook->>API: POST /api/appointments/book
    API->>Service: bookingService.createAppointment()
    Service->>Repo: appointmentRepo.checkConflicts()
    Repo->>DB: SELECT conflicting appointments
    DB-->>Repo: conflicts result
    Repo-->>Service: conflict check result

    alt No Conflicts
        Service->>Repo: appointmentRepo.create()
        Repo->>DB: INSERT appointment
        DB-->>Repo: appointment created
        Repo-->>Service: appointment data
        Service->>NotifService: scheduleReminders()
        NotifService-->>Service: reminders scheduled
        Service-->>API: success response
        API-->>Hook: appointment data
        Hook-->>Student: booking confirmed
    else Conflicts Found
        Service-->>API: conflict error
        API-->>Hook: 409 error
        Hook-->>Student: slot unavailable
    end
```

## 8. Service Dependencies Graph

```mermaid
graph TB
    subgraph "External Dependencies"
        PRISMA_CLIENT[Prisma Client]
        REDIS[Redis Client]
        SENDGRID[SendGrid API]
        TWILIO[Twilio API]
        GOOGLE_API[Google Calendar API]
    end

    subgraph "Repository Layer"
        USER_REPO[UserRepository]
        APPT_REPO[AppointmentRepository]
        ASSIGN_REPO[AssignmentRepository]
        NOTIF_REPO[NotificationRepository]
    end

    subgraph "Service Layer"
        AUTH_SERVICE[AuthService]
        BOOKING_SERVICE[BookingService]
        NOTIF_SERVICE[NotificationService]
        EMAIL_SERVICE[EmailService]
        SMS_SERVICE[SMSService]
        GCAL_SERVICE[GoogleCalendarService]
    end

    PRISMA_CLIENT --> USER_REPO
    PRISMA_CLIENT --> APPT_REPO
    PRISMA_CLIENT --> ASSIGN_REPO
    PRISMA_CLIENT --> NOTIF_REPO

    REDIS --> AUTH_SERVICE
    USER_REPO --> AUTH_SERVICE
    APPT_REPO --> BOOKING_SERVICE
    NOTIF_REPO --> NOTIF_SERVICE

    BOOKING_SERVICE --> NOTIF_SERVICE
    NOTIF_SERVICE --> EMAIL_SERVICE
    NOTIF_SERVICE --> SMS_SERVICE

    SENDGRID --> EMAIL_SERVICE
    TWILIO --> SMS_SERVICE
    GOOGLE_API --> GCAL_SERVICE

    APPT_REPO --> GCAL_SERVICE
```

## 9. Function Call Flow - Assignment Creation

```mermaid
flowchart TD
    A[Tutor clicks 'Create Assignment'] --> B[AssignmentForm.onSubmit()]
    B --> C[useAssignments.createAssignment()]
    C --> D[POST /api/assignments]
    D --> E[assignmentService.create()]
    E --> F[validateAssignmentData()]
    F --> G[assignmentRepo.create()]
    G --> H[prisma.assignment.create()]
    H --> I[notificationService.notifyStudent()]
    I --> J[emailService.sendAssignmentNotification()]
    I --> K[smsService.sendAssignmentNotification()]
    J --> L[Assignment created & notifications sent]
    K --> L
    L --> M[Update UI with new assignment]

    style A fill:#e1f5fe
    style L fill:#c8e6c9
    style M fill:#c8e6c9
```

## 10. File Structure Relationships

```mermaid
graph LR
    subgraph "src/app/"
        PAGES[Page Components]
        API_ROUTES[API Routes]
        LAYOUTS[Layout Components]
    end

    subgraph "src/components/"
        UI_COMP[UI Components]
        FEATURE_COMP[Feature Components]
        FORMS[Form Components]
    end

    subgraph "src/hooks/"
        CUSTOM_HOOKS[Custom Hooks]
    end

    subgraph "src/services/"
        SERVICES[Service Classes]
    end

    subgraph "src/lib/"
        UTILS[Utilities]
        CONFIG[Configuration]
        TYPES[Type Definitions]
        DB_LIB[Database Layer]
    end

    PAGES --> UI_COMP
    PAGES --> FEATURE_COMP
    PAGES --> CUSTOM_HOOKS

    FEATURE_COMP --> UI_COMP
    FEATURE_COMP --> FORMS
    FEATURE_COMP --> CUSTOM_HOOKS

    CUSTOM_HOOKS --> API_ROUTES
    API_ROUTES --> SERVICES
    SERVICES --> DB_LIB

    SERVICES --> UTILS
    SERVICES --> CONFIG
    SERVICES --> TYPES

    DB_LIB --> TYPES
    CUSTOM_HOOKS --> TYPES
```

## Diagram Legend

### Symbols Used:

- **Rectangles**: Classes, Services, Components
- **Cylinders**: Databases
- **Diamonds**: Decision Points
- **Circles**: Start/End Points
- **Arrows**: Dependencies/Relationships

### Color Coding:

- **Blue**: Frontend Components
- **Green**: Backend Services
- **Orange**: External Services
- **Purple**: Database Layer
- **Red**: Error/Conflict States

These diagrams provide a comprehensive visual overview of how all the components in the tutoring calendar application connect and interact with each other, making it easier to understand the system architecture and maintain the codebase.
