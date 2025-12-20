// src/constants.ts

export const APPOINTMENT_STATUS_MAP: Record<string, string> = {
  SCHEDULED: 'status.scheduled',
  CONFIRMED: 'status.confirmed',
  IN_PROGRESS: 'status.in_progress',
  COMPLETED: 'status.completed',
  CANCELLED: 'status.cancelled',
  NO_SHOW: 'status.no_show'
}

export const PAYMENT_STATUS_MAP: Record<string, string> = {
  PENDING: 'paymentStatus.pending',
  PAID: 'paymentStatus.paid',
  OVERDUE: 'paymentStatus.overdue'
}

export const DIFFICULTY_LEVEL_MAP: Record<string, string> = {
  BEGINNER: 'difficulty.beginner',
  INTERMEDIATE: 'difficulty.intermediate',
  ADVANCED: 'difficulty.advanced'
}

export const ASSIGNMENT_STATUS_MAP: Record<string, string> = {
  ASSIGNED: 'assignmentStatus.assigned',
  IN_PROGRESS: 'assignmentStatus.in_progress',
  SUBMITTED: 'assignmentStatus.submitted',
  GRADED: 'assignmentStatus.graded',
  OVERDUE: 'assignmentStatus.overdue'
}
