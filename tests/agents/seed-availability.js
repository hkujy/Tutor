const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

/**
 * Seed Tutor Availability Data
 * Sets up realistic availability patterns for the 5 test tutors
 */

const AVAILABILITY_DATA = [
    {
        // Dr. Sarah Chen - Full-time (M-F 9-5)
        tutorEmail: 'sarah.chen@tutortest.com',
        schedule: [
            { day: 1, startTime: '09:00', endTime: '17:00' }, // Monday
            { day: 2, startTime: '09:00', endTime: '17:00' }, // Tuesday
            { day: 3, startTime: '09:00', endTime: '17:00' }, // Wednesday
            { day: 4, startTime: '09:00', endTime: '17:00' }, // Thursday
            { day: 5, startTime: '09:00', endTime: '17:00' }, // Friday
        ],
    },
    {
        // Prof. James Williams - Part-time afternoons (M/W/F 2-6)
        tutorEmail: 'james.williams@tutortest.com',
        schedule: [
            { day: 1, startTime: '14:00', endTime: '18:00' }, // Monday
            { day: 3, startTime: '14:00', endTime: '18:00' }, // Wednesday
            { day: 5, startTime: '14:00', endTime: '18:00' }, // Friday
        ],
    },
    {
        // Maria Rodriguez - Evenings + Weekends
        tutorEmail: 'maria.rodriguez@tutortest.com',
        schedule: [
            { day: 2, startTime: '18:00', endTime: '21:00' }, // Tuesday evening
            { day: 4, startTime: '18:00', endTime: '21:00' }, // Thursday evening
            { day: 6, startTime: '10:00', endTime: '16:00' }, // Saturday
            { day: 0, startTime: '10:00', endTime: '16:00' }, // Sunday
        ],
    },
    {
        // Dr. Raj Patel - Limited premium slots
        tutorEmail: 'raj.patel@tutortest.com',
        schedule: [
            { day: 1, startTime: '16:00', endTime: '19:00' }, // Monday evening
            { day: 3, startTime: '16:00', endTime: '19:00' }, // Wednesday evening
            { day: 6, startTime: '09:00', endTime: '12:00' }, // Saturday morning
        ],
    },
    {
        // Emily Zhang - Rotating schedule (simplified to M-F afternoons)
        tutorEmail: 'emily.zhang@tutortest.com',
        schedule: [
            { day: 1, startTime: '15:00', endTime: '19:00' }, // Monday
            { day: 2, startTime: '15:00', endTime: '19:00' }, // Tuesday
            { day: 3, startTime: '15:00', endTime: '19:00' }, // Wednesday
            { day: 4, startTime: '15:00', endTime: '19:00' }, // Thursday
            { day: 5, startTime: '15:00', endTime: '19:00' }, // Friday
        ],
    },
]

async function seedAvailability() {
    console.log('🌱 Seeding Tutor Availability Data...\n')

    try {
        for (const tutorData of AVAILABILITY_DATA) {
            // Find the tutor
            const user = await prisma.user.findUnique({
                where: { email: tutorData.tutorEmail },
                include: { tutor: true },
            })

            if (!user || !user.tutor) {
                console.log(`  ⚠️  Tutor not found: ${tutorData.tutorEmail}`)
                continue
            }

            console.log(`\n📅 Setting availability for ${user.firstName} ${user.lastName}`)

            // Insert availability records into database
            for (const slot of tutorData.schedule) {
                const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][slot.day]

                // Check if this slot already exists
                const existing = await prisma.availability.findFirst({
                    where: {
                        tutorId: user.tutor.id,
                        dayOfWeek: slot.day,
                        startTime: slot.startTime,
                    }
                })

                if (existing) {
                    console.log(`  ⏭️  ${dayName} ${slot.startTime}-${slot.endTime} already exists`)
                    continue
                }

                // Create the availability record
                await prisma.availability.create({
                    data: {
                        tutorId: user.tutor.id,
                        dayOfWeek: slot.day,
                        startTime: slot.startTime,
                        endTime: slot.endTime,
                        isActive: true,
                    },
                })

                console.log(`  ✅ ${dayName}: ${slot.startTime} - ${slot.endTime}`)
            }

            console.log(`  ✨ Schedule saved (${tutorData.schedule.length} slots)`)
        }

        console.log('\n✅ Availability seeding complete!')
        console.log('\n📊 Summary:')
        console.log('   5 tutors configured')
        console.log('   Availability records inserted into database')
        console.log('\n💡 Next Steps:')
        console.log('   1. Test availability page: http://localhost:3000/en/tutor/availability')
        console.log('   2. Students can now find tutors when browsing!')
        console.log('   3. Run agent tests to verify booking flow works')

    } catch (error) {
        console.error('❌ Error seeding availability:', error)
        throw error
    } finally {
        await prisma.$disconnect()
    }
}

// Run if called directly
if (require.main === module) {
    seedAvailability()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error)
            process.exit(1)
        })
}

module.exports = { seedAvailability }
