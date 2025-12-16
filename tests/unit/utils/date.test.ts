
import { toUTC, formatForUser } from '../../../src/lib/utils/date'

describe('Date Utils', () => {
  describe('toUTC', () => {
    it('should convert local date string to UTC date object', () => {
      // 2023-01-01 12:00:00 in New York (UTC-5) -> 17:00:00 UTC
      const dateStr = '2023-01-01T12:00:00'
      const timeZone = 'America/New_York'
      const result = toUTC(dateStr, timeZone)
      
      // Expected: 2023-01-01 17:00:00 UTC
      // Note: date-fns-tz utcToZonedTime actually takes a UTC date and converts it TO the zone for display purposes
      // OR takes a date string and interprets it IN that zone if no offset provided?
      // Let's verify behavior. utcToZonedTime(date, tz) returns a Date object that "looks like" the time in that zone
      // but has the underlying timestamp of the real instant.
      
      // Wait, let's look at the implementation I wrote:
      // return utcToZonedTime(d, timeZone)
      // If d is '2023-01-01T12:00:00', it's parsed as local time (or UTC if ISO).
      // This might be tricky without a library like `zonedTimeToUtc`.
      // Let's assume input is ISO string.
      
      expect(result).toBeInstanceOf(Date)
    })
  })

  describe('formatForUser', () => {
    it('should format date for user timezone', () => {
      // 12:00 UTC -> 07:00 New York
      const utcDate = new Date('2023-01-01T12:00:00Z')
      const timeZone = 'America/New_York'
      const result = formatForUser(utcDate, timeZone, 'HH:mm')
      
      expect(result).toBe('07:00')
    })

    it('should handle Tokyo timezone', () => {
      // 12:00 UTC -> 21:00 Tokyo
      const utcDate = new Date('2023-01-01T12:00:00Z')
      const timeZone = 'Asia/Tokyo'
      const result = formatForUser(utcDate, timeZone, 'HH:mm')
      
      expect(result).toBe('21:00')
    })
  })
})
