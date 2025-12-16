
import { AvailabilityService } from '../../../src/lib/services/availability'

describe('AvailabilityService', () => {
  describe('generateRecurringSlots', () => {
    it('should generate slots for every Monday for 3 weeks', () => {
      // Monday = 1
      const start = new Date('2023-01-01') // Sunday
      const end = new Date('2023-01-22') // 3 weeks later
      
      const slots = AvailabilityService.generateRecurringSlots({
        tutorId: 'tutor1',
        dayOfWeek: 1, // Monday
        startTime: '09:00',
        endTime: '10:00',
        startDate: start,
        endDate: end
      })

      // Expect Jan 2, Jan 9, Jan 16
      expect(slots).toHaveLength(3)
      expect(slots[0].date.toISOString().split('T')[0]).toBe('2023-01-02')
      expect(slots[1].date.toISOString().split('T')[0]).toBe('2023-01-09')
      expect(slots[2].date.toISOString().split('T')[0]).toBe('2023-01-16')
    })

    it('should handle case where start date IS the day of week', () => {
      // Jan 2, 2023 is Monday
      const start = new Date('2023-01-02') 
      const end = new Date('2023-01-09')
      
      const slots = AvailabilityService.generateRecurringSlots({
        tutorId: 'tutor1',
        dayOfWeek: 1, // Monday
        startTime: '09:00',
        endTime: '10:00',
        startDate: start,
        endDate: end
      })

      // Expect Jan 2, Jan 9
      expect(slots).toHaveLength(2)
      expect(slots[0].date.toISOString().split('T')[0]).toBe('2023-01-02')
      expect(slots[1].date.toISOString().split('T')[0]).toBe('2023-01-09')
    })

    it('should return empty array if range is too short', () => {
      // Jan 1 (Sun) to Jan 1 (Sun). Target Monday (1).
      const start = new Date('2023-01-01')
      const end = new Date('2023-01-01')
      
      const slots = AvailabilityService.generateRecurringSlots({
        tutorId: 'tutor1',
        dayOfWeek: 1, // Monday
        startTime: '09:00',
        endTime: '10:00',
        startDate: start,
        endDate: end
      })

      expect(slots).toHaveLength(0)
    })
    
    it('should set correct properties on generated slots', () => {
      const start = new Date('2023-01-02') // Monday
      const end = new Date('2023-01-02')
      
      const slots = AvailabilityService.generateRecurringSlots({
        tutorId: 'tutor123',
        dayOfWeek: 1,
        startTime: '14:00',
        endTime: '15:00',
        startDate: start,
        endDate: end
      })

      expect(slots[0]).toEqual({
        tutorId: 'tutor123',
        date: expect.any(Date),
        startTime: '14:00',
        endTime: '15:00',
        available: true,
        reason: 'Recurring availability slot'
      })
    })
  })
})
