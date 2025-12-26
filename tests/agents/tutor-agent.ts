import { Browser } from '@playwright/test'
import { BaseAgent } from './agent-framework'

/**
 * Tutor-specific behavior patterns
 */
export type TutorBehaviorPattern = 'conservative' | 'active' | 'flexible'

/**
 * TutorAgent - Simulates tutor user behavior
 * 
 * Tutors can:
 * - Set and manage availability
 * - Create appointments for students
 * - View and manage their student roster
 * - Add session notes and track student progress
 * - Respond to booking notifications
 */
export class TutorAgent extends BaseAgent {
    public behaviorPattern: TutorBehaviorPattern

    constructor(browser: Browser, name: string, behaviorPattern: TutorBehaviorPattern = 'active') {
        super(browser, name, 'tutor')
        this.behaviorPattern = behaviorPattern
    }

    /**
     * Set recurring weekly availability
     */
    async setWeeklyAvailability(schedule: {
        daysOfWeek: number[] // 0=Sunday, 1=Monday, etc.
        startTime: string // HH:MM format
        endTime: string
        duration?: number // minutes per session
    }): Promise<boolean> {
        const actionName = 'setWeeklyAvailability'
        const startTime = Date.now()

        try {
            if (!this.page) throw new Error('Agent not initialized')

            this.log('Setting weekly availability')

            // Navigate to availability page
            await this.navigateTo('/en/tutor/availability')
            await this.humanDelay(300, 700)

            // Look for add/create availability button
            const addButton = this.page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("Set Availability")')
            if (await addButton.count() > 0) {
                await addButton.first().click()
                await this.humanDelay(200, 400)
            }

            // Fill in the schedule form
            for (const day of schedule.daysOfWeek) {
                // Select day of week checkbox or option
                const dayCheckbox = this.page.locator(`input[value="${day}"], label:has-text("${this.getDayName(day)}")`)
                if (await dayCheckbox.count() > 0) {
                    await dayCheckbox.first().click()
                    await this.humanDelay(100, 200)
                }
            }

            // Set time range
            await this.page.fill('input[name="startTime"], input[type="time"]:first-of-type', schedule.startTime)
            await this.humanDelay(100, 200)

            await this.page.fill('input[name="endTime"], input[type="time"]:last-of-type', schedule.endTime)
            await this.humanDelay(100, 200)

            if (schedule.duration) {
                await this.page.fill('input[name="duration"], input[placeholder*="duration"]', schedule.duration.toString())
                await this.humanDelay(100, 200)
            }

            // Save availability
            await this.page.click('button[type="submit"], button:has-text("Save"), button:has-text("Confirm")')
            await this.page.waitForTimeout(1000)

            this.recordAction(actionName, startTime, true)
            this.log('Weekly availability set successfully')
            return true
        } catch (error) {
            this.recordAction(actionName, startTime, false)
            this.log(`Failed to set availability: ${error}`, 'error')
            return false
        }
    }

    /**
     * Block specific dates (availability exceptions)
     */
    async blockDates(dates: string[]): Promise<boolean> {
        const actionName = 'blockDates'
        const startTime = Date.now()

        try {
            if (!this.page) throw new Error('Agent not initialized')

            this.log(`Blocking ${dates.length} dates`)

            await this.navigateTo('/en/tutor/availability')
            await this.humanDelay(300, 700)

            for (const date of dates) {
                // Look for exception/block button
                const blockButton = this.page.locator('button:has-text("Block"), button:has-text("Exception"), button:has-text("Add Exception")')
                if (await blockButton.count() > 0) {
                    await blockButton.first().click()
                    await this.humanDelay(200, 400)
                }

                // Fill in date
                await this.page.fill('input[type="date"]', date)
                await this.humanDelay(100, 200)

                // Mark as unavailable
                const unavailableCheckbox = this.page.locator('input[name="available"], input[type="checkbox"]')
                if (await unavailableCheckbox.count() > 0) {
                    await unavailableCheckbox.first().uncheck()
                }

                // Save
                await this.page.click('button[type="submit"], button:has-text("Save")')
                await this.humanDelay(500, 1000)
            }

            this.recordAction(actionName, startTime, true)
            this.log('Dates blocked successfully')
            return true
        } catch (error) {
            this.recordAction(actionName, startTime, false)
            this.log(`Failed to block dates: ${error}`, 'error')
            return false
        }
    }

    /**
     * View tutor dashboard
     */
    async viewDashboard(): Promise<void> {
        const actionName = 'viewDashboard'
        const startTime = Date.now()

        try {
            if (!this.page) throw new Error('Agent not initialized')

            this.log('Viewing dashboard')

            await this.navigateTo('/en/tutor')
            await this.humanDelay(500, 1000)

            // Check for upcoming appointments
            const appointments = await this.page.locator('[data-testid="appointment"], .appointment-card').count()
            this.state.sessionData.upcomingAppointments = appointments
            this.log(`Found ${appointments} upcoming appointments`)

            this.recordAction(actionName, startTime, true)
        } catch (error) {
            this.recordAction(actionName, startTime, false)
            this.log(`Failed to view dashboard: ${error}`, 'error')
        }
    }

    /**
     * View student roster
     */
    async viewStudents(): Promise<void> {
        const actionName = 'viewStudents'
        const startTime = Date.now()

        try {
            if (!this.page) throw new Error('Agent not initialized')

            this.log('Viewing students')

            await this.navigateTo('/en/tutor/students')
            await this.humanDelay(500, 1000)

            const studentCount = await this.page.locator('[data-testid="student"], .student-card').count()
            this.state.sessionData.studentCount = studentCount
            this.log(`Found ${studentCount} students`)

            this.recordAction(actionName, startTime, true)
        } catch (error) {
            this.recordAction(actionName, startTime, false)
            this.log(`Failed to view students: ${error}`, 'error')
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

            // Click notification icon
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
            case 'conservative':
                // Conservative tutors rarely change availability
                await this.viewDashboard()
                await this.humanDelay(1000, 2000)
                await this.checkNotifications()
                await this.humanDelay(1000, 2000)
                await this.viewStudents()
                break

            case 'active':
                // Active tutors frequently update their schedule
                await this.viewDashboard()
                await this.humanDelay(500, 1000)

                await this.setWeeklyAvailability({
                    daysOfWeek: [1, 2, 3, 4, 5], // Monday-Friday
                    startTime: '09:00',
                    endTime: '17:00',
                    duration: 60,
                })
                await this.humanDelay(1000, 2000)

                await this.checkNotifications()
                await this.humanDelay(500, 1000)

                await this.viewStudents()
                break

            case 'flexible':
                // Flexible tutors adapt based on available data
                await this.viewDashboard()
                await this.humanDelay(500, 1000)

                const notifications = await this.checkNotifications()
                if (notifications > 0) {
                    // If there are notifications, check students
                    await this.humanDelay(500, 1000)
                    await this.viewStudents()
                } else {
                    // Otherwise update availability
                    await this.humanDelay(500, 1000)
                    await this.setWeeklyAvailability({
                        daysOfWeek: this.decide({
                            choices: [
                                [1, 2, 3, 4, 5], // Weekdays
                                [0, 6], // Weekends
                                [1, 3, 5], // MWF
                            ],
                            strategy: 'random',
                        }),
                        startTime: '10:00',
                        endTime: '16:00',
                        duration: 60,
                    })
                }
                break
        }

        this.log('Actions completed')
    }

    /**
     * Helper to get day name from number
     */
    private getDayName(day: number): string {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        return days[day] || ''
    }
}
