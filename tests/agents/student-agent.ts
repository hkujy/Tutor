import { Browser } from '@playwright/test'
import { BaseAgent } from './agent-framework'

/**
 * Student-specific behavior patterns
 */
export type StudentBehaviorPattern = 'eager' | 'browsing' | 'indecisive'

/**
 * StudentAgent - Simulates student user behavior
 * 
 * Students can:
 * - Browse and search for tutors
 * - View tutor availability
 * - Book appointments
 * - View their schedule
 * - Cancel or reschedule appointments
 * - Check notifications
 */
export class StudentAgent extends BaseAgent {
    public behaviorPattern: StudentBehaviorPattern

    constructor(browser: Browser, name: string, behaviorPattern: StudentBehaviorPattern = 'eager') {
        super(browser, name, 'student')
        this.behaviorPattern = behaviorPattern
    }

    /**
     * Browse available tutors
     */
    async browseTutors(subject?: string): Promise<number> {
        const actionName = 'browseTutors'
        const startTime = Date.now()

        try {
            if (!this.page) throw new Error('Agent not initialized')

            this.log(`Browsing tutors${subject ? ` for ${subject}` : ''}`)

            await this.navigateTo('/en/student')
            await this.humanDelay(500, 1000)

            // Look for tutor list or browse section
            const tutorCards = await this.page.locator('[data-testid="tutor-card"], .tutor-card, .tutor-item').count()

            this.state.sessionData.availableTutors = tutorCards
            this.log(`Found ${tutorCards} available tutors`)

            // If looking for specific subject, try filtering
            if (subject && tutorCards > 0) {
                const filterInput = this.page.locator('input[placeholder*="subject"], input[name="subject"]')
                if (await filterInput.count() > 0) {
                    await filterInput.first().fill(subject)
                    await this.humanDelay(500, 1000)

                    const filteredCount = await this.page.locator('[data-testid="tutor-card"], .tutor-card').count()
                    this.log(`Filtered to ${filteredCount} tutors for ${subject}`)
                }
            }

            this.recordAction(actionName, startTime, true)
            return tutorCards
        } catch (error) {
            this.recordAction(actionName, startTime, false)
            this.log(`Failed to browse tutors: ${error}`, 'error')
            return 0
        }
    }

    /**
     * View a specific tutor's profile and availability
     */
    async viewTutorProfile(tutorIndex: number = 0): Promise<boolean> {
        const actionName = 'viewTutorProfile'
        const startTime = Date.now()

        try {
            if (!this.page) throw new Error('Agent not initialized')

            this.log(`Viewing tutor profile at index ${tutorIndex}`)

            const tutorCards = this.page.locator('[data-testid="tutor-card"], .tutor-card, .tutor-item')
            const count = await tutorCards.count()

            if (count === 0) {
                throw new Error('No tutors available to view')
            }

            // Click on a tutor card
            const index = Math.min(tutorIndex, count - 1)
            await tutorCards.nth(index).click()
            await this.humanDelay(800, 1500)

            // Check for availability calendar
            const hasCalendar = await this.page.locator('[data-testid="availability-calendar"], .calendar, .availability-grid').count() > 0
            this.log(`Tutor profile loaded, calendar visible: ${hasCalendar}`)

            this.recordAction(actionName, startTime, true)
            return hasCalendar
        } catch (error) {
            this.recordAction(actionName, startTime, false)
            this.log(`Failed to view tutor profile: ${error}`, 'error')
            return false
        }
    }

    /**
     * Book an appointment with available slot
     */
    async bookAppointment(subject: string = 'Mathematics'): Promise<boolean> {
        const actionName = 'bookAppointment'
        const startTime = Date.now()

        try {
            if (!this.page) throw new Error('Agent not initialized')

            this.log(`Attempting to book appointment for ${subject}`)

            // Look for available time slots
            const timeSlots = this.page.locator('[data-testid="time-slot"], .time-slot, button[data-time]')
            const availableSlots = await timeSlots.filter({ hasText: /available|open/i }).count()

            if (availableSlots === 0) {
                this.log('No available time slots found', 'warn')
                this.recordAction(actionName, startTime, false)
                return false
            }

            this.log(`Found ${availableSlots} available slots`)

            // Select a random available slot
            const slotIndex = Math.floor(Math.random() * availableSlots)
            await timeSlots.filter({ hasText: /available|open/i }).nth(slotIndex).click()
            await this.humanDelay(300, 600)

            // Fill in booking form if present
            const subjectInput = this.page.locator('input[name="subject"], select[name="subject"]')
            if (await subjectInput.count() > 0) {
                await subjectInput.first().fill(subject)
                await this.humanDelay(200, 400)
            }

            const notesInput = this.page.locator('textarea[name="notes"], textarea[placeholder*="note"]')
            if (await notesInput.count() > 0) {
                const notes = this.decide({
                    choices: [
                        'Looking forward to the session!',
                        'Need help with homework',
                        'Preparing for exam',
                        'Want to improve understanding',
                    ],
                    strategy: 'random',
                })
                await notesInput.first().fill(notes)
                await this.humanDelay(200, 400)
            }

            // Confirm booking
            await this.page.click('button:has-text("Book"), button:has-text("Confirm"), button[type="submit"]')
            await this.humanDelay(1000, 2000)

            // Wait for confirmation
            const successMessage = await this.page.locator('text=/booked|confirmed|success/i').count()
            const isBooked = successMessage > 0

            this.recordAction(actionName, startTime, isBooked)
            this.log(isBooked ? 'Appointment booked successfully' : 'Booking may have failed')

            return isBooked
        } catch (error) {
            this.recordAction(actionName, startTime, false)
            this.log(`Failed to book appointment: ${error}`, 'error')
            return false
        }
    }

    /**
     * View student's appointment schedule
     */
    async viewSchedule(): Promise<number> {
        const actionName = 'viewSchedule'
        const startTime = Date.now()

        try {
            if (!this.page) throw new Error('Agent not initialized')

            this.log('Viewing schedule')

            await this.navigateTo('/en/student/schedule')
            await this.humanDelay(500, 1000)

            const appointments = await this.page.locator('[data-testid="appointment"], .appointment-card').count()
            this.state.sessionData.myAppointments = appointments
            this.log(`Found ${appointments} appointments in schedule`)

            this.recordAction(actionName, startTime, true)
            return appointments
        } catch (error) {
            this.recordAction(actionName, startTime, false)
            this.log(`Failed to view schedule: ${error}`, 'error')
            return 0
        }
    }

    /**
     * Cancel an appointment
     */
    async cancelAppointment(appointmentIndex: number = 0): Promise<boolean> {
        const actionName = 'cancelAppointment'
        const startTime = Date.now()

        try {
            if (!this.page) throw new Error('Agent not initialized')

            this.log(`Cancelling appointment at index ${appointmentIndex}`)

            await this.navigateTo('/en/student/schedule')
            await this.humanDelay(500, 1000)

            const appointments = this.page.locator('[data-testid="appointment"], .appointment-card')
            const count = await appointments.count()

            if (count === 0) {
                this.log('No appointments to cancel', 'warn')
                this.recordAction(actionName, startTime, false)
                return false
            }

            // Click on appointment to view details or find cancel button
            const index = Math.min(appointmentIndex, count - 1)
            const appointment = appointments.nth(index)

            // Look for cancel button
            const cancelButton = appointment.locator('button:has-text("Cancel")')
            if (await cancelButton.count() > 0) {
                await cancelButton.click()
                await this.humanDelay(300, 600)

                // Confirm cancellation
                const confirmButton = this.page.locator('button:has-text("Confirm"), button:has-text("Yes")')
                if (await confirmButton.count() > 0) {
                    await confirmButton.click()
                    await this.humanDelay(500, 1000)
                }

                this.recordAction(actionName, startTime, true)
                this.log('Appointment cancelled successfully')
                return true
            }

            this.log('Could not find cancel button', 'warn')
            this.recordAction(actionName, startTime, false)
            return false
        } catch (error) {
            this.recordAction(actionName, startTime, false)
            this.log(`Failed to cancel appointment: ${error}`, 'error')
            return false
        }
    }

    /**
     * Check notifications
     */
    async checkNotifications(): Promise<number> {
        const actionName = 'checkNotifications'
        const startTime = Date.now()

        try {
            if (!this.page) throw new Error('Agent not initialized')

            this.log('Checking notifications')

            const notifButton = this.page.locator('[data-testid="notifications"], button[aria-label*="notification"]')
            if (await notifButton.count() > 0) {
                await notifButton.first().click()
                await this.humanDelay(300, 600)

                const unreadCount = await this.page.locator('.notification.unread, [data-unread="true"]').count()
                this.log(`Found ${unreadCount} unread notifications`)

                this.recordAction(actionName, startTime, true)
                return unreadCount
            }

            this.recordAction(actionName, startTime, true)
            return 0
        } catch (error) {
            this.recordAction(actionName, startTime, false)
            this.log(`Failed to check notifications: ${error}`, 'error')
            return 0
        }
    }

    /**
     * Main action logic based on behavior pattern
     */
    async performActions(): Promise<void> {
        this.log(`Starting actions with ${this.behaviorPattern} behavior pattern`)

        switch (this.behaviorPattern) {
            case 'eager':
                // Eager students book quickly
                await this.browseTutors()
                await this.humanDelay(500, 1000)

                await this.viewTutorProfile(0) // View first tutor
                await this.humanDelay(300, 700)

                await this.bookAppointment()
                await this.humanDelay(500, 1000)

                await this.viewSchedule()
                break

            case 'browsing':
                // Browsing students explore multiple options
                const tutorCount = await this.browseTutors('Mathematics')
                await this.humanDelay(1000, 2000)

                if (tutorCount > 0) {
                    await this.viewTutorProfile(0)
                    await this.humanDelay(1000, 2000)

                    // Maybe view another tutor
                    if (tutorCount > 1) {
                        await this.browseTutors()
                        await this.humanDelay(800, 1500)
                        await this.viewTutorProfile(1)
                        await this.humanDelay(1000, 2000)
                    }
                }

                await this.checkNotifications()
                break

            case 'indecisive':
                // Indecisive students browse, book, then sometimes cancel
                await this.browseTutors()
                await this.humanDelay(1000, 2000)

                await this.viewTutorProfile(0)
                await this.humanDelay(1500, 3000)

                const booked = await this.bookAppointment()
                await this.humanDelay(2000, 4000)

                // 30% chance to cancel after booking
                if (booked && Math.random() < 0.3) {
                    this.log('Changed mind, cancelling appointment')
                    await this.viewSchedule()
                    await this.humanDelay(1000, 2000)
                    await this.cancelAppointment(0)
                } else {
                    await this.viewSchedule()
                }
                break
        }

        this.log('Actions completed')
    }
}
