import { Browser } from '@playwright/test'
import { BaseAgent } from './agent-framework'

/**
 * Student-specific behavior patterns
 */
export type StudentBehaviorPattern = 'eager' | 'browsing' | 'indecisive'

/**
 * StudentAgent - Simulates student user behavior
 */
export class StudentAgent extends BaseAgent {
    public behaviorPattern: StudentBehaviorPattern

    constructor(browser: Browser, name: string, behaviorPattern: StudentBehaviorPattern = 'eager') {
        super(browser, name, 'student')
        this.behaviorPattern = behaviorPattern
    }

    async browseTutors(subject?: string): Promise<number> {
        const actionName = 'browseTutors'
        const startTime = Date.now()

        try {
            if (!this.page) throw new Error('Agent not initialized')

            this.log(`Browsing tutors${subject ? ` for ${subject}` : ''}`)

            await this.navigateTo('/en/student')
            await this.humanDelay(500, 1000)

            const tutorCards = await this.page.locator('[data-testid="tutor-card"], .tutor-card, .tutor-item').count()
            this.state.sessionData.availableTutors = tutorCards
            this.log(`Found ${tutorCards} available tutors`)

            if (subject && tutorCards > 0) {
                const filterInput = this.page.locator('input[placeholder*="subject"], input[name="subject"], input[placeholder*="Subject"]')
                if (await filterInput.count() > 0) {
                    await filterInput.first().fill(subject)
                    await this.humanDelay(500, 1000)

                    let filteredCount = await this.page.locator('[data-testid="tutor-card"], .tutor-card').count()
                    if (filteredCount === 0) {
                        this.log(`No tutors found for ${subject}, clearing filter...`, 'warn')
                        await filterInput.first().fill('')
                        await this.humanDelay(500, 1000)
                    }
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

    async viewTutorProfile(tutorIndex: number = 0): Promise<boolean> {
        const actionName = 'viewTutorProfile'
        const startTime = Date.now()

        try {
            if (!this.page) throw new Error('Agent not initialized')

            this.log(`Viewing tutor profile/booking at index ${tutorIndex}`)

            const tutorCards = this.page.locator('[data-testid="tutor-card"], .tutor-card, .tutor-item')
            const count = await tutorCards.count()

            if (count === 0) {
                throw new Error('No tutors available to book')
            }

            const index = Math.min(tutorIndex, count - 1)
            const bookButton = tutorCards.nth(index).locator('button:has-text("Book")')

            if (await bookButton.count() > 0) {
                this.log('Clicking "Book Session" button')
                await bookButton.first().click()
                await this.humanDelay(1500, 3000)
            } else {
                this.log('Could not find Book button, clicking card instead', 'warn')
                await tutorCards.nth(index).click()
                await this.humanDelay(1500, 3000)
            }

            this.recordAction(actionName, startTime, true)
            return true
        } catch (error) {
            this.recordAction(actionName, startTime, false)
            this.log(`Failed to view tutor profile: ${error}`, 'error')
            return false
        }
    }

    async bookAppointment(subject: string = 'Mathematics'): Promise<boolean> {
        const actionName = 'bookAppointment'
        const startTime = Date.now()

        try {
            if (!this.page) throw new Error('Agent not initialized')

            this.log(`Attempting to book appointment for ${subject}`)

            // Step 0: Handle "Step 1" - Select Subject if it's visible
            const step1Title = this.page.locator('h3:has-text("Step 1"), h4:has-text("Select a Subject")')
            if (await step1Title.count() > 0) {
                this.log('On Step 1, selecting subject explicitly')
                const subjectBtn = this.page.locator(`button:has-text("${subject}")`)
                if (await subjectBtn.count() > 0) {
                    await subjectBtn.first().click()
                } else {
                    this.log(`Subject "${subject}" not found, clicking first available subject button`, 'warn')
                    const anySubjectBtn = this.page.locator('h4:has-text("Select a Subject") + div button, .subject-button, button:has-text("Music"), button:has-text("Mathematics"), button:has-text("English")').first()
                    await anySubjectBtn.click()
                }
                await this.humanDelay(1000, 2000)
            }

            // Step 1: Handle calendar if time slots aren't visible yet
            const timeSlots = this.page.locator('[data-testid="time-slot"], .time-slot, button[data-time]')
            const calendarGrid = this.page.locator('.grid-cols-7')

            if (await calendarGrid.count() > 0 && await timeSlots.count() === 0) {
                this.log('Selecting a date from calendar')
                const days = this.page.locator('.grid-cols-7 button:not([disabled])')
                if (await days.count() > 0) {
                    await days.first().click()
                    await this.humanDelay(1000, 2000)
                }
            }

            const finalSlots = this.page.locator('[data-testid="time-slot"], .time-slot, button[data-time]')
            const availableCount = await finalSlots.count()

            if (availableCount === 0) {
                this.log('No available time slots found', 'warn')
                await this.screenshot('no-slots-found')
                this.recordAction(actionName, startTime, false)
                return false
            }

            this.log(`Found ${availableCount} available slots, selecting first one`)
            await finalSlots.first().click()
            await this.humanDelay(500, 1000)

            // Step 2: Confirmation/Notes
            const continueButton = this.page.locator('button:has-text("Continue")')
            if (await continueButton.count() > 0) {
                await continueButton.first().click()
                await this.humanDelay(500, 1000)
            }

            const notesInput = this.page.locator('textarea[name="notes"], textarea[placeholder*="note"]')
            if (await notesInput.count() > 0) {
                await notesInput.first().fill('Test booking from student agent')
                await this.humanDelay(300, 600)
            }

            // Step 3: Final Book button
            const finalBookBtn = this.page.locator('button:has-text("Book Appointment"), button:has-text("Confirm Booking"), button:has-text("Book")')
            await finalBookBtn.first().click()
            await this.humanDelay(3000, 5000)

            // Verify success
            const successIndicator = await this.page.locator('text=/success|booked|confirmed/i').count()
            const isBooked = successIndicator > 0

            this.recordAction(actionName, startTime, isBooked)
            this.log(isBooked ? 'Appointment booked successfully' : 'Booking verification failed')
            if (!isBooked) await this.screenshot('booking-failed')

            return isBooked
        } catch (error) {
            this.recordAction(actionName, startTime, false)
            this.log(`Failed to book appointment: ${error}`, 'error')
            return false
        }
    }

    async viewSchedule(): Promise<number> {
        const actionName = 'viewSchedule'
        const startTime = Date.now()

        try {
            if (!this.page) throw new Error('Agent not initialized')

            this.log('Viewing schedule')

            await this.navigateTo('/en/student')
            await this.humanDelay(1000, 2000)

            const sessionsTab = this.page.locator('button:has-text("Sessions"), button:has-text("课程"), button:has-text("预约")')
            if (await sessionsTab.count() > 0) {
                await sessionsTab.first().click()
                await this.humanDelay(1000, 2000)
            }

            const appointments = await this.page.locator('[data-testid="appointment"], .appointment-card, [role="tabpanel"] table tr').count()
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

    async cancelAppointment(appointmentIndex: number = 0): Promise<boolean> {
        const actionName = 'cancelAppointment'
        const startTime = Date.now()

        try {
            if (!this.page) throw new Error('Agent not initialized')

            this.log(`Cancelling appointment at index ${appointmentIndex}`)

            await this.navigateTo('/en/student')
            await this.humanDelay(1000, 2000)

            const sessionsTab = this.page.locator('button:has-text("Sessions")')
            if (await sessionsTab.count() > 0) {
                await sessionsTab.first().click()
                await this.humanDelay(1000, 2000)
            }

            const appointments = this.page.locator('button:has-text("Cancel")')
            const count = await appointments.count()

            if (count === 0) {
                this.log('No appointments to cancel', 'warn')
                this.recordAction(actionName, startTime, false)
                return false
            }

            const index = Math.min(appointmentIndex, count - 1)
            await appointments.nth(index).click()
            await this.humanDelay(1000, 2000)

            const confirmBtn = this.page.locator('button:has-text("Confirm"), button:has-text("Yes")')
            if (await confirmBtn.count() > 0) {
                await confirmBtn.first().click()
                await this.humanDelay(1000, 2000)
            }

            this.recordAction(actionName, startTime, true)
            return true
        } catch (error) {
            this.recordAction(actionName, startTime, false)
            this.log(`Failed to cancel appointment: ${error}`, 'error')
            return false
        }
    }

    async checkNotifications(): Promise<number> {
        const actionName = 'checkNotifications'
        const startTime = Date.now()

        try {
            if (!this.page) throw new Error('Agent not initialized')
            const notifBtn = this.page.locator('[data-testid="notifications"], .notification-bell')
            if (await notifBtn.count() > 0) {
                await notifBtn.first().click()
                await this.humanDelay(500, 1000)
            }
            this.recordAction(actionName, startTime, true)
            return 0
        } catch (error) {
            this.recordAction(actionName, startTime, false)
            return 0
        }
    }

    async performActions(): Promise<void> {
        this.log(`Starting actions with ${this.behaviorPattern} behavior pattern`)

        switch (this.behaviorPattern) {
            case 'eager':
                await this.browseTutors()
                await this.viewTutorProfile(0)
                await this.bookAppointment()
                await this.viewSchedule()
                break

            case 'browsing':
                await this.browseTutors('Mathematics')
                await this.viewTutorProfile(0)
                await this.checkNotifications()
                break

            case 'indecisive':
                await this.browseTutors()
                await this.viewTutorProfile(0)
                const booked = await this.bookAppointment()
                if (booked && Math.random() < 0.5) {
                    await this.viewSchedule()
                    await this.cancelAppointment(0)
                }
                break
        }
        this.log('Actions completed')
    }
}
