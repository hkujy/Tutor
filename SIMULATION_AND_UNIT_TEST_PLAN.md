# Simulation and Unit Test Plan

This document outlines the strategy for implementing simulation scenarios and unit tests to validate the "Tutoring Calendar" application. It builds upon the existing `TEST_PLAN_AND_TASKS.md` and `USER_STORIES.md`.

## Part 1: Simulation Scenarios (End-to-End / System Testing)

These scenarios are designed to mimic real-world usage patterns, stressing the system's logic, concurrency handling, and state management.

### Scenario A: The "New Semester" Rush (Concurrency & Load)
**Goal:** Validate system stability when multiple students compete for the same popular tutor slots.
**Actors:** 1 Tutor ("Dr. Smith"), 5 Students ("Alice", "Bob", "Charlie", "Dave", "Eve").
**Flow:**
1.  **Setup:** Dr. Smith opens availability for Monday 9 AM - 12 PM (3 slots).
2.  **Action:** All 5 students attempt to book the 9 AM - 10 AM slot simultaneously (within milliseconds).
3.  **Expectation:**
    *   Only **one** booking succeeds.
    *   Four students receive a clear "Slot unavailable" message.
    *   Database integrity is maintained (no double bookings).
    *   Tutor receives exactly one notification.

### Scenario B: The "Indecisive Student" (State Consistency)
**Goal:** Test the robustness of the booking/cancellation state machine and notification triggers.
**Actors:** 1 Student ("Frank"), 1 Tutor ("Ms. Jones").
**Flow:**
1.  **Booking:** Frank books a slot for next Friday.
2.  **Verification:** Check status is `SCHEDULED`. Notifications sent to both.
3.  **Cancellation:** Frank cancels the appointment 1 hour later.
4.  **Verification:** Check status is `CANCELLED`. Slot becomes available again in `Availability`. Cancellation notifications sent.
5.  **Re-booking:** Frank changes his mind and re-books the same slot.
6.  **Expectation:**
    *   System handles the rapid state changes without error.
    *   The slot correctly toggles between blocked and free.
    *   Notifications are accurate sequence (Booked -> Cancelled -> Booked).

### Scenario C: The "Global Classroom" (Timezones & Formatting)
**Goal:** Verify that appointment times appear correctly for users in different timezones.
**Actors:** Tutor (Tokyo, UTC+9), Student (New York, UTC-5).
**Flow:**
1.  **Setup:** Tutor sets availability for 8 PM Tokyo time (7 AM New York).
2.  **Action:** Student views the calendar.
3.  **Expectation:**
    *   Student sees the slot as 7 AM.
    *   Student books the slot.
    *   Confirmation email to Tutor says "8 PM".
    *   Confirmation email to Student says "7 AM".
    *   Database stores the time in UTC.

### Scenario D: The "Full Lifecycle" (Feature Integration)
**Goal:** Test the integration of Booking -> Assignment -> Grading -> Feedback.
**Actors:** 1 Tutor, 1 Student.
**Flow:**
1.  **Booking:** Appointment created.
2.  **Assignment:** Tutor creates a pre-session assignment.
3.  **Submission:** Student submits a file (mock upload).
4.  **Grading:** Tutor grades the submission and leaves comments.
5.  **Completion:** Session marked as `COMPLETED`.
6.  **Expectation:**
    *   All links between Appointment, Assignment, and Submission are correct.
    *   Progress is tracked in `StudentProgress`.

---

## Part 2: Unit Test Plan

Focusing on high-value, complex logic that is prone to errors.

### 2.1 Core Business Logic

#### **Availability Logic (`src/lib/services/availability.ts`)**
*   **Recurring vs. Exceptions:**
    *   Test: `getAvailableSlots(dateRange)` correctly overlays `AvailabilityException` on top of weekly `Availability`.
    *   Test: Specific date overrides (blocking a usually free slot).
    *   Test: Opening a slot on a usually blocked day.
*   **Time Slot Generation:**
    *   Test: Breaking down a 4-hour block into 1-hour chunks.
    *   Test: Handling "buffer times" if implemented.

#### **Appointment Management (`src/lib/services/appointment.ts`)**
*   **Conflict Detection:**
    *   Test: `isSlotAvailable()` returns false if an appointment already exists.
    *   Test: Overlap detection (e.g., trying to book 10:30-11:30 when 10:00-11:00 is booked).
*   **Status Transitions:**
    *   Test: Valid transitions (Scheduled -> Confirmed -> Completed).
    *   Test: Invalid transitions (Cancelled -> Completed).

#### **Notification Rules (`src/lib/services/notification.ts`)**
*   **Preference Filtering:**
    *   Test: `shouldSendNotification(user, type)` respects `NotificationPreference`.
    *   Test: Do not send SMS if `smsNotifications` is false.
*   **Rate Limiting:**
    *   Test: Function throws or returns false if limit exceeded.

### 2.2 Utilities & Helpers

#### **Timezone Helpers (`src/lib/utils/date.ts`)**
*   Test: `formatForUser(utcDate, timezone)` returns correct string.
*   Test: `toUTC(localDate, timezone)` accurately converts.
*   Test: Handling of Daylight Saving Time transitions.

#### **Input Validation (`src/lib/validation/*.ts`)**
*   Test: Schema validation for Booking Request (required fields, valid future date).
*   Test: Sanitization of text inputs (notes, feedback) to prevent XSS.

---

## Part 3: Implementation Strategy

1.  **Scaffold Tests:**
    *   Create `tests/simulation/` for the scenarios.
    *   Create `tests/unit/core/` and `tests/unit/utils/` for unit tests.
2.  **Mocking:**
    *   Use `jest` and `msw` to mock Database calls for Unit tests.
    *   Use a dedicated "Seed" script to set up state for Simulation tests.
3.  **Execution:**
    *   Run Unit tests on every commit (CI).
    *   Run Simulation tests nightly or before release.
