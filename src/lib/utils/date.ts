
import { format, toDate, utcToZonedTime } from 'date-fns-tz'

export function toUTC(date: Date | string, timeZone: string = 'UTC'): Date {
  const d = typeof date === 'string' ? new Date(date) : date
  return utcToZonedTime(d, timeZone)
}

export function formatForUser(date: Date | string, timeZone: string, pattern: string = 'yyyy-MM-dd HH:mm'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const zonedDate = utcToZonedTime(d, timeZone)
  return format(zonedDate, pattern, { timeZone })
}

export function isValidDateString(dateStr: string): boolean {
  return !isNaN(Date.parse(dateStr))
}

export function getWeekDay(date: Date): number {
  return date.getDay()
}
