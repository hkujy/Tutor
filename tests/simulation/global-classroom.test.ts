
import { formatForUser, toUTC } from '../../src/lib/utils/date'

describe('Simulation: The Global Classroom (Timezones)', () => {
  // Scenario:
  // Tutor is in Tokyo (UTC+9)
  // Student is in New York (UTC-5 during Standard Time)
  // Slot is 20:00 (8 PM) Tokyo Time.
  
  // 20:00 Tokyo = 11:00 UTC
  // 11:00 UTC = 06:00 New York
  
  const TOKYO_TZ = 'Asia/Tokyo'
  const NY_TZ = 'America/New_York'
  
  // A fixed point in time: Jan 15, 2024, 20:00 Tokyo Time
  // ISO string for 11:00 UTC
  const SLOT_UTC_ISO = '2024-01-15T11:00:00Z'

  it('should display correct times for Tutor and Student', () => {
    // 1. Verify Tutor sees 20:00
    const tutorView = formatForUser(SLOT_UTC_ISO, TOKYO_TZ, 'HH:mm')
    expect(tutorView).toBe('20:00')

    // 2. Verify Student sees 06:00
    const studentView = formatForUser(SLOT_UTC_ISO, NY_TZ, 'HH:mm')
    expect(studentView).toBe('06:00')
    
    // 3. Verify Date display
    const tutorDate = formatForUser(SLOT_UTC_ISO, TOKYO_TZ, 'yyyy-MM-dd')
    const studentDate = formatForUser(SLOT_UTC_ISO, NY_TZ, 'yyyy-MM-dd')
    
    expect(tutorDate).toBe('2024-01-15')
    expect(studentDate).toBe('2024-01-15')
  })

  it('should handle date crossing scenarios', () => {
    // Scenario: 09:00 Tokyo (Jan 16) = 00:00 UTC = 19:00 New York (Jan 15, prev day)
    const CROSSING_UTC_ISO = '2024-01-16T00:00:00Z'
    
    const tutorTime = formatForUser(CROSSING_UTC_ISO, TOKYO_TZ, 'yyyy-MM-dd HH:mm')
    const studentTime = formatForUser(CROSSING_UTC_ISO, NY_TZ, 'yyyy-MM-dd HH:mm')
    
    expect(tutorTime).toBe('2024-01-16 09:00')
    expect(studentTime).toBe('2024-01-15 19:00')
  })
})
