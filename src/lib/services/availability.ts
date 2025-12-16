
import { Availability, AvailabilityException } from '@prisma/client'

export interface CombinedAvailability {
  recurring: Availability[]
  individual: AvailabilityException[]
}

export interface RecurringSlotInput {
  tutorId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  startDate: Date
  endDate: Date
}

export interface GeneratedSlot {
  tutorId: string
  date: Date
  startTime: string
  endTime: string
  available: boolean
  reason: string
}

export class AvailabilityService {
  /**
   * Generates individual slots from a recurring pattern for a given date range.
   * This is used when "exploding" a recurring slot into individual exceptions.
   */
  static generateRecurringSlots(data: RecurringSlotInput): GeneratedSlot[] {
    const slots: GeneratedSlot[] = []
    const currentDate = new Date(data.startDate)
    
    // Reset time to ensure we only compare dates
    currentDate.setHours(0, 0, 0, 0)
    const end = new Date(data.endDate)
    end.setHours(23, 59, 59, 999)

    // Find the first occurrence of the target day of week
    // 0 = Sunday, 1 = Monday, ...
    while (currentDate.getDay() !== data.dayOfWeek && currentDate <= end) {
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    // Create slots for each occurrence
    while (currentDate <= end) {
      slots.push({
        tutorId: data.tutorId,
        date: new Date(currentDate),
        startTime: data.startTime,
        endTime: data.endTime,
        available: true,
        reason: 'Recurring availability slot'
      })
      
      // Move to next week
      currentDate.setDate(currentDate.getDate() + 7)
    }

    return slots
  }

  /**
   * Combines recurring rules and individual exceptions to determine actual availability.
   * (Placeholder for future logic where we might overlay them)
   */
  static combineAvailability(
    recurring: Availability[], 
    exceptions: AvailabilityException[]
  ): CombinedAvailability {
    return {
      recurring,
      individual: exceptions
    }
  }
}
