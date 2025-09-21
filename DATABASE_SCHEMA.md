# Database Schema Design

## Overview

This document outlines the database schema for the tutoring calendar application using PostgreSQL with Prisma ORM.

## Schema Diagram

```
Users (1) ←→ (1) Students
Users (1) ←→ (1) Tutors
Tutors (1) ←→ (M) Appointments ←→ (1) Students
Tutors (1) ←→ (M) Availability
Appointments (1) ←→ (M) Assignments
Appointments (1) ←→ (M) SessionComments
Students (1) ←→ (M) StudentProgre// ... (continue with other models)

model NotificationPreference {
  userId              String  @id @map("user_id")
  emailNotifications  Boolean @default(true)  @map("email_notifications")
  smsNotifications    Boolean @default(false) @map("sms_notifications")
  reminderTiming      Int     @default(24)    @map("reminder_timing")
  assignmentReminders Boolean @default(true)  @map("assignment_reminders")
  marketingEmails     Boolean @default(false) @map("marketing_emails")
  createdAt           DateTime @default(now()) @map("created_at")
  updatedAt           DateTime @updatedAt      @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("notification_preferences")
}

model Tutor {
  id               String   @id @default(cuid())
  userId           String   @unique @map("user_id")
  specializations  String[]
  experienceYears  Int?     @map("experience_years")
  education        String?
  certifications   String[]
  bio              String?
  hourlyRate       Decimal? @map("hourly_rate") @db.Decimal(10,2)
  currency         String   @default("USD")
  rating           Decimal  @default(0.00) @db.Decimal(3,2)
  totalSessions    Int      @default(0) @map("total_sessions")
  languages        String[] @default(["English"])
  verified         Boolean  @default(false)
  backgroundCheck  Boolean  @default(false) @map("background_check")
  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")

  user          User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  availability  Availability[]
  exceptions    AvailabilityException[]
  appointments  Appointment[]
  assignments   Assignment[]
  comments      SessionComment[]

  @@map("tutors")
}

model Availability {
  id              String   @id @default(cuid())
  tutorId         String   @map("tutor_id")
  dayOfWeek       Int      @map("day_of_week")
  startTime       String   @map("start_time") // TIME stored as string
  endTime         String   @map("end_time")   // TIME stored as string
  durationMinutes Int      @default(60) @map("duration_minutes")
  active          Boolean  @default(true)
  effectiveFrom   DateTime @default(now()) @map("effective_from") @db.Date
  effectiveUntil  DateTime? @map("effective_until") @db.Date
  createdAt       DateTime @default(now()) @map("created_at")

  tutor Tutor @relation(fields: [tutorId], references: [id], onDelete: Cascade)

  @@unique([tutorId, dayOfWeek, startTime])
  @@map("availability")
}

model AvailabilityException {
  id        String   @id @default(cuid())
  tutorId   String   @map("tutor_id")
  date      DateTime @db.Date
  available Boolean  @default(false)
  startTime String?  @map("start_time")
  endTime   String?  @map("end_time")
  reason    String?
  createdAt DateTime @default(now()) @map("created_at")

  tutor Tutor @relation(fields: [tutorId], references: [id], onDelete: Cascade)

  @@unique([tutorId, date, startTime])
  @@map("availability_exceptions")
}

model Appointment {
  id                  String    @id @default(cuid())
  tutorId             String    @map("tutor_id")
  studentId           String    @map("student_id")
  startTime           DateTime  @map("start_time")
  endTime             DateTime  @map("end_time")
  subject             String
  status              AppointmentStatus @default(SCHEDULED)
  meetingLink         String?   @map("meeting_link")
  studentNotes        String?   @map("student_notes")
  tutorNotes          String?   @map("tutor_notes")
  cancellationReason  String?   @map("cancellation_reason")
  cancelledBy         String?   @map("cancelled_by")
  cancelledAt         DateTime? @map("cancelled_at")
  remindedAt          DateTime? @map("reminded_at")
  rating              Int?
  feedback            String?
  price               Decimal?  @db.Decimal(10,2)
  createdAt           DateTime  @default(now()) @map("created_at")
  updatedAt           DateTime  @updatedAt @map("updated_at")

  tutor       Tutor             @relation(fields: [tutorId], references: [id], onDelete: Cascade)
  student     Student           @relation(fields: [studentId], references: [id], onDelete: Cascade)
  assignments Assignment[]
  comments    SessionComment[]

  @@map("appointments")
}

enum AppointmentStatus {
  SCHEDULED @map("scheduled")
  CONFIRMED @map("confirmed")
  IN_PROGRESS @map("in_progress")
  COMPLETED @map("completed")
  CANCELLED @map("cancelled")
  NO_SHOW @map("no_show")
}

model Assignment {
  id                String     @id @default(cuid())
  appointmentId     String?    @map("appointment_id")
  tutorId           String     @map("tutor_id")
  studentId         String     @map("student_id")
  title             String
  description       String?
  subject           String?
  difficultyLevel   DifficultyLevel? @map("difficulty_level")
  estimatedHours    Decimal?   @map("estimated_hours") @db.Decimal(4,2)
  dueDate           DateTime?  @map("due_date")
  status            AssignmentStatus @default(ASSIGNED)
  pointsPossible    Int?       @map("points_possible")
  pointsEarned      Int?       @map("points_earned")
  createdAt         DateTime   @default(now()) @map("created_at")
  updatedAt         DateTime   @updatedAt @map("updated_at")

  appointment Appointment? @relation(fields: [appointmentId], references: [id])
  tutor       Tutor        @relation(fields: [tutorId], references: [id], onDelete: Cascade)
  student     Student      @relation(fields: [studentId], references: [id], onDelete: Cascade)
  files       AssignmentFile[]
  submissions AssignmentSubmission[]

  @@map("assignments")
}

enum DifficultyLevel {
  BEGINNER     @map("beginner")
  INTERMEDIATE @map("intermediate")
  ADVANCED     @map("advanced")
}

enum AssignmentStatus {
  ASSIGNED   @map("assigned")
  IN_PROGRESS @map("in_progress")
  SUBMITTED  @map("submitted")
  REVIEWED   @map("reviewed")
  COMPLETED  @map("completed")
}

model AssignmentFile {
  id           String   @id @default(cuid())
  assignmentId String   @map("assignment_id")
  filename     String
  originalName String   @map("original_name")
  fileSize     Int      @map("file_size")
  mimeType     String   @map("mime_type")
  fileUrl      String   @map("file_url")
  uploadedBy   String   @map("uploaded_by")
  fileType     FileType @map("file_type")
  createdAt    DateTime @default(now()) @map("created_at")

  assignment Assignment @relation(fields: [assignmentId], references: [id], onDelete: Cascade)

  @@map("assignment_files")
}

enum FileType {
  INSTRUCTION @map("instruction")
  SUBMISSION  @map("submission")
  FEEDBACK    @map("feedback")
}

model AssignmentSubmission {
  id             String   @id @default(cuid())
  assignmentId   String   @map("assignment_id")
  studentId      String   @map("student_id")
  submissionText String?  @map("submission_text")
  submittedAt    DateTime @default(now()) @map("submitted_at")
  gradedAt       DateTime? @map("graded_at")
  grade          Decimal? @db.Decimal(5,2)
  feedback       String?
  attemptNumber  Int      @default(1) @map("attempt_number")

  assignment Assignment @relation(fields: [assignmentId], references: [id], onDelete: Cascade)
  student    Student     @relation(fields: [studentId], references: [id], onDelete: Cascade)

  @@map("assignment_submissions")
}

model SessionComment {
  id            String      @id @default(cuid())
  appointmentId String      @map("appointment_id")
  tutorId       String      @map("tutor_id")
  content       String
  commentType   CommentType @default(GENERAL) @map("comment_type")
  private       Boolean     @default(false)
  createdAt     DateTime    @default(now()) @map("created_at")
  updatedAt     DateTime    @updatedAt @map("updated_at")

  appointment Appointment @relation(fields: [appointmentId], references: [id], onDelete: Cascade)
  tutor       Tutor       @relation(fields: [tutorId], references: [id], onDelete: Cascade)

  @@map("session_comments")
}

enum CommentType {
  GENERAL     @map("general")
  PROGRESS    @map("progress")
  CONCERN     @map("concern")
  ACHIEVEMENT @map("achievement")
  HOMEWORK    @map("homework")
}

model StudentProgress {
  id              String          @id @default(cuid())
  studentId       String          @map("student_id")
  subject         String
  skill           String
  proficiencyLevel ProficiencyLevel @map("proficiency_level")
  lastAssessed    DateTime        @default(now()) @map("last_assessed")
  assessmentNotes String?         @map("assessment_notes")
  createdAt       DateTime        @default(now()) @map("created_at")
  updatedAt       DateTime        @updatedAt @map("updated_at")

  student Student @relation(fields: [studentId], references: [id], onDelete: Cascade)

  @@unique([studentId, subject, skill])
  @@map("student_progress")
}

enum ProficiencyLevel {
  BEGINNER    @map("beginner")
  DEVELOPING  @map("developing")
  PROFICIENT  @map("proficient")
  ADVANCED    @map("advanced")
}

model Notification {
  id           String           @id @default(cuid())
  userId       String           @map("user_id")
  title        String
  message      String
  type         NotificationType
  channels     String[]         @default(["in_app"])
  read         Boolean          @default(false)
  scheduledFor DateTime?        @map("scheduled_for")
  sentAt       DateTime?        @map("sent_at")
  emailSent    Boolean          @default(false) @map("email_sent")
  smsSent      Boolean          @default(false) @map("sms_sent")
  createdAt    DateTime         @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("notifications")
}

enum NotificationType {
  APPOINTMENT_REMINDER  @map("appointment_reminder")
  APPOINTMENT_BOOKED   @map("appointment_booked")
  APPOINTMENT_CANCELLED @map("appointment_cancelled")
  ASSIGNMENT_DUE       @map("assignment_due")
  ASSIGNMENT_GRADED    @map("assignment_graded")
  PAYMENT_REMINDER     @map("payment_reminder")
  SYSTEM               @map("system")
}

model Advertisement {
  id             String    @id @default(cuid())
  title          String
  content        String?
  imageUrl       String?   @map("image_url")
  targetUrl      String?   @map("target_url")
  position       String?
  targetAudience String?   @map("target_audience")
  priority       Int       @default(1)
  active         Boolean   @default(true)
  impressions    Int       @default(0)
  clicks         Int       @default(0)
  startDate      DateTime  @default(now()) @map("start_date") @db.Date
  endDate        DateTime? @map("end_date") @db.Date
  createdBy      String    @map("created_by")
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")

  @@map("advertisements")
}

model UserSession {
  id           String   @id @default(cuid())
  userId       String   @map("user_id")
  sessionToken String   @unique @map("session_token")
  ipAddress    String?  @map("ip_address")
  userAgent    String?  @map("user_agent")
  expiresAt    DateTime @map("expires_at")
  createdAt    DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_sessions")
}

model AuditLog {
  id           String    @id @default(cuid())
  userId       String?   @map("user_id")
  action       String
  resourceType String    @map("resource_type")
  resourceId   String?   @map("resource_id")
  oldValues    Json?     @map("old_values")
  newValues    Json?     @map("new_values")
  ipAddress    String?   @map("ip_address")
  userAgent    String?   @map("user_agent")
  createdAt    DateTime  @default(now()) @map("created_at")

  user User? @relation(fields: [userId], references: [id])

  @@map("audit_logs")
}(M) Notifications
Assignments (1) ←→ (M) AssignmentSubmissions
System ←→ (M) Advertisements
```

## Tables

### users

Base user table for authentication and common user data

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'tutor', 'admin')),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    avatar_url VARCHAR(500),
    timezone VARCHAR(50) DEFAULT 'UTC',
    email_verified BOOLEAN DEFAULT false,
    active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### students

Student-specific information

```sql
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    grade_level VARCHAR(20),
    school VARCHAR(200),
    subjects TEXT[], -- Array of subjects interested in
    learning_goals TEXT,
    parent_name VARCHAR(200),
    parent_email VARCHAR(255),
    parent_phone VARCHAR(20),
    emergency_contact VARCHAR(500),
    special_needs TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### tutors

Tutor-specific information

```sql
CREATE TABLE tutors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    specializations TEXT[] NOT NULL, -- Array of subjects they teach
    experience_years INTEGER,
    education TEXT,
    certifications TEXT[],
    bio TEXT,
    hourly_rate DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_sessions INTEGER DEFAULT 0,
    languages TEXT[] DEFAULT '{"English"}',
    verified BOOLEAN DEFAULT false,
    background_check BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### availability

Tutor availability patterns

```sql
CREATE TABLE availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID REFERENCES tutors(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    active BOOLEAN DEFAULT true,
    effective_from DATE DEFAULT CURRENT_DATE,
    effective_until DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tutor_id, day_of_week, start_time)
);
```

### availability_exceptions

Specific date overrides for availability

```sql
CREATE TABLE availability_exceptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID REFERENCES tutors(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    available BOOLEAN DEFAULT false,
    start_time TIME,
    end_time TIME,
    reason VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tutor_id, date, start_time)
);
```

### appointments

Scheduled tutoring sessions

```sql
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID REFERENCES tutors(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    subject VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN
        ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
    meeting_link VARCHAR(500),
    student_notes TEXT, -- Notes from student when booking
    tutor_notes TEXT, -- Notes from tutor
    cancellation_reason TEXT,
    cancelled_by UUID REFERENCES users(id),
    cancelled_at TIMESTAMP,
    reminded_at TIMESTAMP,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    feedback TEXT,
    price DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### session_comments

Comments added by tutors after sessions

```sql
CREATE TABLE session_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    tutor_id UUID REFERENCES tutors(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    comment_type VARCHAR(20) DEFAULT 'general' CHECK (comment_type IN
        ('general', 'progress', 'concern', 'achievement', 'homework')),
    private BOOLEAN DEFAULT false, -- If true, only visible to tutor
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### assignments

Tasks and homework assigned by tutors

```sql
CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID REFERENCES appointments(id),
    tutor_id UUID REFERENCES tutors(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    subject VARCHAR(100),
    difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    estimated_hours DECIMAL(4,2),
    due_date TIMESTAMP,
    status VARCHAR(20) DEFAULT 'assigned' CHECK (status IN
        ('assigned', 'in_progress', 'submitted', 'reviewed', 'completed')),
    points_possible INTEGER,
    points_earned INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### assignment_files

Files attached to assignments

```sql
CREATE TABLE assignment_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    uploaded_by UUID REFERENCES users(id),
    file_type VARCHAR(20) CHECK (file_type IN ('instruction', 'submission', 'feedback')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### assignment_submissions

Student submissions for assignments

```sql
CREATE TABLE assignment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    submission_text TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    graded_at TIMESTAMP,
    grade DECIMAL(5,2),
    feedback TEXT,
    attempt_number INTEGER DEFAULT 1
);
```

### student_progress

Track student learning progress

```sql
CREATE TABLE student_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    subject VARCHAR(100) NOT NULL,
    skill VARCHAR(200) NOT NULL,
    proficiency_level VARCHAR(20) CHECK (proficiency_level IN
        ('beginner', 'developing', 'proficient', 'advanced')),
    last_assessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assessment_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, subject, skill)
);
```

### notifications

System notifications for users

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN
        ('appointment_reminder', 'appointment_booked', 'appointment_cancelled',
         'assignment_due', 'assignment_graded', 'payment_reminder', 'system')),
    channels TEXT[] DEFAULT '{"in_app"}', -- in_app, email, sms
    read BOOLEAN DEFAULT false,
    scheduled_for TIMESTAMP,
    sent_at TIMESTAMP,
    email_sent BOOLEAN DEFAULT false,
    sms_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### notification_preferences

Per-user notification settings

```sql
CREATE TABLE notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT true,
    sms_notifications BOOLEAN DEFAULT false,
    reminder_timing INTEGER DEFAULT 24, -- hours before appointment
    assignment_reminders BOOLEAN DEFAULT true,
    marketing_emails BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### advertisements

Advertisement content and placement

```sql
CREATE TABLE advertisements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    content TEXT,
    image_url VARCHAR(500),
    target_url VARCHAR(500),
    position VARCHAR(50) CHECK (position IN ('header', 'sidebar', 'footer', 'modal')),
    target_audience VARCHAR(50) CHECK (target_audience IN ('all', 'students', 'tutors')),
    priority INTEGER DEFAULT 1,
    active BOOLEAN DEFAULT true,
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### user_sessions

Track user sessions for analytics

```sql
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(500) UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### audit_logs

Track important system events

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Indexes

```sql
-- Performance indexes
CREATE INDEX idx_appointments_tutor_date ON appointments(tutor_id, start_time);
CREATE INDEX idx_appointments_student_date ON appointments(student_id, start_time);
CREATE INDEX idx_assignments_student_due ON assignments(student_id, due_date);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read);
CREATE INDEX idx_availability_tutor_day ON availability(tutor_id, day_of_week);
CREATE INDEX idx_notification_prefs_user ON notification_preferences(user_id);

-- Search indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_tutors_specializations ON tutors USING GIN(specializations);
CREATE INDEX idx_students_subjects ON students USING GIN(subjects);
```

## Prisma Schema

```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String    @map("password_hash")
  role          Role
  firstName     String    @map("first_name")
  lastName      String    @map("last_name")
  phone         String?
  avatarUrl     String?   @map("avatar_url")
  timezone      String    @default("UTC")
  emailVerified Boolean   @default(false) @map("email_verified")
  active        Boolean   @default(true)
  lastLogin     DateTime? @map("last_login")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  student       Student?
  tutor         Tutor?
  notifications Notification[]
  sessions      UserSession[]
  auditLogs     AuditLog[]
  preferences   NotificationPreference?

  @@map("users")
}

enum Role {
  student
  tutor
  admin
}

model Student {
  id               String  @id @default(cuid())
  userId           String  @unique @map("user_id")
  gradeLevel       String? @map("grade_level")
  school           String?
  subjects         String[]
  learningGoals    String? @map("learning_goals")
  parentName       String? @map("parent_name")
  parentEmail      String? @map("parent_email")
  parentPhone      String? @map("parent_phone")
  emergencyContact String? @map("emergency_contact")
  specialNeeds     String? @map("special_needs")
  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")

  user          User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  appointments  Appointment[]
  assignments   Assignment[]
  submissions   AssignmentSubmission[]
  progress      StudentProgress[]

  @@map("students")
}

// ... (continue with other models)

model NotificationPreference {
    userId              String  @id @map("user_id")
    emailNotifications  Boolean @default(true)  @map("email_notifications")
    smsNotifications    Boolean @default(false) @map("sms_notifications")
    reminderTiming      Int     @default(24)    @map("reminder_timing")
    assignmentReminders Boolean @default(true)  @map("assignment_reminders")
    marketingEmails     Boolean @default(false) @map("marketing_emails")
    createdAt           DateTime @default(now()) @map("created_at")
    updatedAt           DateTime @updatedAt      @map("updated_at")

    user User @relation(fields: [userId], references: [id], onDelete: Cascade)

    @@map("notification_preferences")
}
```

## Migration Strategy

### Phase 1: Core Tables

1. Users, Students, Tutors
2. Basic authentication and profiles

### Phase 2: Scheduling

1. Availability, Appointments
2. Basic booking functionality

### Phase 3: Learning Management

1. Assignments, Comments, Progress
2. Enhanced tutor-student interaction

### Phase 4: System Features

1. Notifications, Advertisements
2. Analytics and reporting

## Data Seeding

Sample data will include:

- Test users (students and tutors)
- Sample availability patterns
- Demo appointments and assignments
- System notifications templates
