# API Design Specification

## API Conventions

- Authentication: Bearer JWT in `Authorization` header for all protected endpoints.
- Pagination: `limit` (default 20, max 100) and `offset` or `cursor` where noted; responses include `total` and `nextCursor` when applicable.
- Idempotency: All POST operations that create resources (e.g., bookings, assignments, notifications send) accept an `Idempotency-Key` header. Duplicate requests with the same key within 24h return the original result.
- Time & Timezones: All times are ISO 8601 in UTC. User profile timezone (IANA) is used for display.
- Versioning: Reserve `/api/v1/*` prefix; initially alias `/api/*` to v1.
- Errors: Consistent error body with machine-readable `code` (see Error Responses).

## Authentication Endpoints

### POST /api/auth/register

Create new user account

```json
{
  "email": "student@example.com",
  "password": "securepassword",
  "role": "student", // "student" or "tutor"
  "profile": {
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "timezone": "America/New_York"
  }
}
```

### POST /api/auth/login

Authenticate user

```json
{
  "email": "student@example.com",
  "password": "securepassword"
}
```

## Calendar & Appointments

### GET /api/appointments

Get appointments for authenticated user
Query params: `startDate`, `endDate`, `status`

### POST /api/appointments

Create new appointment (tutor only)

```json
{
  "studentId": "uuid",
  "startTime": "2025-09-22T10:00:00Z",
  "endTime": "2025-09-22T11:00:00Z",
  "subject": "Mathematics",
  "notes": "Algebra review session"
}
```

### POST /api/appointments/book

Book appointment (student only)

```json
{
  "tutorId": "uuid",
  "timeSlotId": "uuid",
  "subject": "Mathematics",
  "notes": "Need help with calculus"
}
```

Headers:

- `Idempotency-Key`: A unique key per booking attempt to prevent double-booking on retries.

Errors:

- `409 CONFLICT` with `code = "SLOT_TAKEN"` if the slot is no longer available.
- `422 UNPROCESSABLE_ENTITY` for validation errors.

### PATCH /api/appointments/:id

Update appointment status or details

### DELETE /api/appointments/:id

Cancel appointment

## Availability Management

### GET /api/tutors/:id/availability

Get tutor's available time slots
Query params: `startDate`, `endDate`

### POST /api/tutors/availability

Create availability slots (tutor only)

```json
{
  "recurringPattern": {
    "daysOfWeek": [1, 2, 3, 4, 5], // Monday-Friday
    "startTime": "09:00",
    "endTime": "17:00",
    "duration": 60 // minutes
  },
  "exceptions": [
    {
      "date": "2025-09-25",
      "unavailable": true
    }
  ]
}
```

### PATCH /api/tutors/availability/:id

Update specific availability slot

### DELETE /api/tutors/availability/:id

Delete availability slot

### POST /api/tutors/availability/exceptions

Add availability exception for specific date

```json
{
  "date": "2025-09-25",
  "available": false,
  "reason": "Personal appointment"
}
```

## Calendar Sync Integrations

### POST /api/integrations/google/connect

Initiate OAuth to connect Google Calendar (tutor only). Returns OAuth URL or completes token exchange.

### DELETE /api/integrations/google/disconnect

Disconnect Google Calendar (tutor only).

### POST /api/webhooks/google-calendar

Receive Google Calendar push notifications (internal webhook). Verifies signature and enqueues sync.

## Assignments & Tasks

### GET /api/assignments

Get assignments for student or created by tutor
Query params: `studentId`, `status`, `dueDate`

### POST /api/assignments

Create assignment (tutor only)

```json
{
  "appointmentId": "uuid",
  "studentId": "uuid",
  "title": "Complete Chapter 5 Exercises",
  "description": "Work through problems 1-20",
  "dueDate": "2025-09-30T23:59:59Z",
  "attachments": ["file1.pdf", "file2.jpg"]
}
```

### PATCH /api/assignments/:id

Update assignment status or content

### GET /api/assignments/:id/submissions

Get all submissions for an assignment (tutor only)

### POST /api/assignments/:id/submissions

Submit assignment work (student only)

```json
{
  "submissionText": "Here are my solutions to problems 1-20...",
  "attemptNumber": 1
}
```

### PATCH /api/assignments/submissions/:id

Grade assignment submission (tutor only)

```json
{
  "grade": 85.5,
  "feedback": "Good work! Pay attention to step 3 in problem 15."
}
```

## Rating & Reviews

### POST /api/appointments/:id/rating

Rate and review completed appointment (student only)

```json
{
  "rating": 5,
  "feedback": "Excellent session, very helpful with algebra concepts"
}
```

### GET /api/tutors/:id/reviews

Get tutor's reviews and ratings
Query params: `limit`, `offset`

## Student Management

### GET /api/students

Get all students (tutor only)

### GET /api/students/:id/progress

Get student's learning progress and statistics

### POST /api/students/:id/progress

Update student progress (tutor only)

```json
{
  "subject": "Mathematics",
  "skill": "Algebraic Equations",
  "proficiencyLevel": "proficient",
  "assessmentNotes": "Shows good understanding of basic concepts"
}
```

### POST /api/students/:id/comments

Add session comments (tutor only)

```json
{
  "appointmentId": "uuid",
  "content": "Great progress on algebraic equations",
  "type": "progress", // "progress", "concern", "achievement"
  "private": false
}
```

### GET /api/appointments/:id/comments

Get session comments for an appointment
Query params: `includePrivate` (tutor only)

### PATCH /api/comments/:id

Update session comment (tutor only)

### DELETE /api/comments/:id

Delete session comment (tutor only)

## Notifications

### GET /api/notifications

Get user's notifications

### POST /api/notifications/send

Send notification (system use)

```json
{
  "userId": "uuid",
  "type": "appointment_reminder",
  "channels": ["email", "sms"],
  "scheduledFor": "2025-09-22T09:00:00Z",
  "data": {
    "appointmentId": "uuid",
    "customMessage": "Don't forget your math session tomorrow!"
  }
}
```

### PATCH /api/notifications/:id/read

Mark notification as read

### GET /api/notifications/preferences

Get user's notification preferences

### PATCH /api/notifications/preferences

Update notification preferences

```json
{
  "emailNotifications": true,
  "smsNotifications": true,
  "reminderTiming": 24, // hours before appointment
  "assignmentReminders": true,
  "marketingEmails": false
}
```

Notes:

- Preferences are stored per-user and respected by the scheduler.

## Advertisements

### GET /api/advertisements

Get active advertisements
Query params: `position`, `targetAudience`

### POST /api/advertisements

Create advertisement (admin only)

```json
{
  "title": "Learn Python Programming",
  "content": "Join our intensive Python bootcamp",
  "imageUrl": "https://example.com/image.jpg",
  "targetUrl": "https://pythoncourse.com",
  "position": "sidebar", // "header", "sidebar", "footer"
  "targetAudience": "students",
  "active": true,
  "expiryDate": "2025-12-31T23:59:59Z"
}
```

## File Uploads

### POST /api/files/upload

Upload assignment files or profile pictures
Multipart form data with file validation

### DELETE /api/files/:id

Delete uploaded file

## Analytics & Reports

### GET /api/analytics/dashboard

Get tutor dashboard statistics

```json
{
  "totalStudents": 25,
  "upcomingAppointments": 8,
  "completedSessions": 142,
  "averageRating": 4.8,
  "revenue": {
    "thisMonth": 2400,
    "lastMonth": 2100
  }
}
```

### GET /api/reports/student-progress/:id

Get detailed student progress report

## Error Responses

All endpoints return consistent error format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "email": "Email format is invalid"
    }
  }
}
```

Common error codes:

- `AUTH_REQUIRED`, `FORBIDDEN`, `NOT_FOUND`
- `VALIDATION_ERROR`, `RATE_LIMITED`, `IDEMPOTENCY_CONFLICT`
- `SLOT_TAKEN`, `OVERLAPPING_AVAILABILITY`, `EXTERNAL_SYNC_ERROR`

## WebSocket Events

### Real-time Updates

- `appointment_booked`: New appointment created
- `appointment_cancelled`: Appointment cancelled
- `assignment_submitted`: Student submitted assignment
- `notification_received`: New notification for user

## Rate Limiting

- Authentication: 5 requests/minute
- Appointment booking: 10 requests/minute
- File uploads: 20 requests/hour
- General API: 100 requests/minute

Abuse protection:

- SMS sends capped per-user per-day (default 10) to avoid cost abuse.

## Security Headers

- CORS configured for frontend domain
- JWT tokens with 24-hour expiry
- Request validation and sanitization
- SQL injection prevention
- XSS protection
