const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

/**
 * Seed Multi-Agent Test Users
 * Creates 5 tutors and 10 students for comprehensive testing
 */

const TUTORS = [
    {
        id: 'tutor-chen-001',
        email: 'sarah.chen@tutortest.com',
        password: 'TutorTest123!',
        role: 'TUTOR',
        firstName: 'Sarah',
        lastName: 'Chen',
        phone: '+1-555-0101',
        tutor: {
            specializations: ['Mathematics', 'Physics', 'Computer Science'],
            hourlyRate: 75,
            bio: 'PhD in Mathematics with 10 years of tutoring experience. Specializes in college-level math and SAT prep.',
            languages: ['English', 'Mandarin'],
            experience: 10,
        },
        availability: {
            pattern: 'weekdays',
            schedule: 'Monday-Friday: 9:00 AM - 5:00 PM',
            sessionDuration: 60,
            weeklyCapacity: 40,
        }
    },
    {
        id: 'tutor-williams-002',
        email: 'james.williams@tutortest.com',
        password: 'TutorTest123!',
        role: 'TUTOR',
        firstName: 'James',
        lastName: 'Williams',
        phone: '+1-555-0102',
        tutor: {
            specializations: ['English Literature', 'Creative Writing', 'History'],
            hourlyRate: 60,
            bio: 'University professor offering personalized writing coaching and literature analysis.',
            languages: ['English'],
            experience: 15,
        },
        availability: {
            pattern: 'part-time-afternoons',
            schedule: 'Monday, Wednesday, Friday: 2:00 PM - 6:00 PM',
            sessionDuration: 90,
            weeklyCapacity: 8,
        }
    },
    {
        id: 'tutor-rodriguez-003',
        email: 'maria.rodriguez@tutortest.com',
        password: 'TutorTest123!',
        role: 'TUTOR',
        firstName: 'Maria',
        lastName: 'Rodriguez',
        phone: '+1-555-0103',
        tutor: {
            specializations: ['Spanish', 'French', 'Portuguese'],
            hourlyRate: 50,
            bio: 'Native Spanish speaker with trilingual expertise. Offers conversational practice and exam prep.',
            languages: ['Spanish', 'French', 'Portuguese', 'English'],
            experience: 8,
        },
        availability: {
            pattern: 'evenings-weekends',
            schedule: 'Tue/Thu 6-9 PM, Sat/Sun 10 AM - 4 PM',
            sessionDuration: 60,
            weeklyCapacity: 18,
        }
    },
    {
        id: 'tutor-patel-004',
        email: 'raj.patel@tutortest.com',
        password: 'TutorTest123!',
        role: 'TUTOR',
        firstName: 'Raj',
        lastName: 'Patel',
        phone: '+1-555-0104',
        tutor: {
            specializations: ['Chemistry', 'Biology', 'MCAT Preparation'],
            hourlyRate: 80,
            bio: 'Medical school instructor specializing in MCAT preparation and advanced sciences.',
            languages: ['English', 'Hindi'],
            experience: 12,
        },
        availability: {
            pattern: 'limited-premium',
            schedule: 'Mon/Wed 4-7 PM, Sat 9 AM - 12 PM',
            sessionDuration: 90,
            weeklyCapacity: 6,
        }
    },
    {
        id: 'tutor-zhang-005',
        email: 'emily.zhang@tutortest.com',
        password: 'TutorTest123!',
        role: 'TUTOR',
        firstName: 'Emily',
        lastName: 'Zhang',
        phone: '+1-555-0105',
        tutor: {
            specializations: ['SAT Prep', 'ACT Prep', 'Test Strategies'],
            hourlyRate: 65,
            bio: 'Test prep specialist with 99th percentile scores. Proven track record of 200+ point SAT improvements.',
            languages: ['English', 'Cantonese'],
            experience: 7,
        },
        availability: {
            pattern: 'rotating',
            schedule: 'Week 1: M-F 3-7 PM, Week 2: Tu/Th/Sat 10 AM - 2 PM',
            sessionDuration: 120,
            weeklyCapacity: 14,
        }
    },
]

const STUDENTS = [
    {
        id: 'student-thompson-001',
        email: 'alex.thompson@studenttest.com',
        password: 'StudentTest123!',
        role: 'STUDENT',
        firstName: 'Alex',
        lastName: 'Thompson',
        phone: '+1-555-0201',
        student: {
            gradeLevel: '11th Grade',
            age: 16,
            subjects: ['Mathematics', 'Physics'],
            goals: 'College prep, improve GPA from 3.5 to 3.8',
            budget: 300,
            behaviorPattern: 'eager',
        }
    },
    {
        id: 'student-martinez-002',
        email: 'sophie.martinez@studenttest.com',
        password: 'StudentTest123!',
        role: 'STUDENT',
        firstName: 'Sophie',
        lastName: 'Martinez',
        phone: '+1-555-0202',
        student: {
            gradeLevel: '10th Grade',
            age: 15,
            subjects: ['Spanish', 'English'],
            goals: 'AP Spanish preparation',
            budget: 200,
            behaviorPattern: 'browsing',
        }
    },
    {
        id: 'student-lee-003',
        email: 'michael.lee@studenttest.com',
        password: 'StudentTest123!',
        role: 'STUDENT',
        firstName: 'Michael',
        lastName: 'Lee',
        phone: '+1-555-0203',
        student: {
            gradeLevel: '12th Grade',
            age: 17,
            subjects: ['SAT Prep', 'Chemistry'],
            goals: 'SAT 1500+, college admission',
            budget: 400,
            behaviorPattern: 'eager',
        }
    },
    {
        id: 'student-johnson-004',
        email: 'emma.johnson@studenttest.com',
        password: 'StudentTest123!',
        role: 'STUDENT',
        firstName: 'Emma',
        lastName: 'Johnson',
        phone: '+1-555-0204',
        student: {
            gradeLevel: '9th Grade',
            age: 14,
            subjects: ['Mathematics', 'Biology'],
            goals: 'Build strong foundation',
            budget: 150,
            behaviorPattern: 'indecisive',
        }
    },
    {
        id: 'student-kim-005',
        email: 'david.kim@studenttest.com',
        password: 'StudentTest123!',
        role: 'STUDENT',
        firstName: 'David',
        lastName: 'Kim',
        phone: '+1-555-0205',
        student: {
            gradeLevel: '12th Grade',
            age: 17,
            subjects: ['Chemistry', 'Physics'],
            goals: 'MCAT 520+, medical school',
            budget: 500,
            behaviorPattern: 'eager',
        }
    },
    {
        id: 'student-brown-006',
        email: 'olivia.brown@studenttest.com',
        password: 'StudentTest123!',
        role: 'STUDENT',
        firstName: 'Olivia',
        lastName: 'Brown',
        phone: '+1-555-0206',
        student: {
            gradeLevel: '11th Grade',
            age: 16,
            subjects: ['English', 'Writing'],
            goals: 'College essays, AP exam prep',
            budget: 250,
            behaviorPattern: 'browsing',
        }
    },
    {
        id: 'student-davis-007',
        email: 'ethan.davis@studenttest.com',
        password: 'StudentTest123!',
        role: 'STUDENT',
        firstName: 'Ethan',
        lastName: 'Davis',
        phone: '+1-555-0207',
        student: {
            gradeLevel: '10th Grade',
            age: 15,
            subjects: ['Mathematics', 'Computer Science'],
            goals: 'Math competition prep',
            budget: 350,
            behaviorPattern: 'eager',
        }
    },
    {
        id: 'student-wilson-008',
        email: 'ava.wilson@studenttest.com',
        password: 'StudentTest123!',
        role: 'STUDENT',
        firstName: 'Ava',
        lastName: 'Wilson',
        phone: '+1-555-0208',
        student: {
            gradeLevel: '9th Grade',
            age: 14,
            subjects: ['Spanish', 'French'],
            goals: 'Become fluent in multiple languages',
            budget: 180,
            behaviorPattern: 'indecisive',
        }
    },
    {
        id: 'student-garcia-009',
        email: 'noah.garcia@studenttest.com',
        password: 'StudentTest123!',
        role: 'STUDENT',
        firstName: 'Noah',
        lastName: 'Garcia',
        phone: '+1-555-0209',
        student: {
            gradeLevel: '12th Grade',
            age: 17,
            subjects: ['SAT Prep'],
            goals: 'SAT improvement 1200 → 1400',
            budget: 200,
            behaviorPattern: 'browsing',
        }
    },
    {
        id: 'student-anderson-010',
        email: 'isabella.anderson@studenttest.com',
        password: 'StudentTest123!',
        role: 'STUDENT',
        firstName: 'Isabella',
        lastName: 'Anderson',
        phone: '+1-555-0210',
        student: {
            gradeLevel: '11th Grade',
            age: 16,
            subjects: ['Biology', 'Chemistry'],
            goals: 'AP Bio/Chem preparation',
            budget: 300,
            behaviorPattern: 'eager',
        }
    },
]

async function seedTestUsers() {
    console.log('🌱 Seeding Multi-Agent Test Users...\n')

    try {
        // Hash password once for all users
        const hashedPassword = await bcrypt.hash('TutorTest123!', 10)
        const hashedStudentPassword = await bcrypt.hash('StudentTest123!', 10)

        // Create tutors
        console.log('📚 Creating 5 Tutor Accounts...')
        for (const tutorData of TUTORS) {
            const { tutor, availability, ...userData } = tutorData

            // Check if user already exists
            const existing = await prisma.user.findUnique({
                where: { email: userData.email }
            })

            if (existing) {
                console.log(`  ⏭️  ${userData.firstName} ${userData.lastName} already exists`)
                continue
            }

            const user = await prisma.user.create({
                data: {
                    ...userData,
                    password: hashedPassword,
                    isActive: true,
                    isVerified: true,
                    tutor: {
                        create: {
                            specializations: tutor.specializations,
                            hourlyRate: tutor.hourlyRate,
                            bio: tutor.bio,
                        }
                    }
                },
                include: { tutor: true }
            })

            console.log(`  ✅ ${user.firstName} ${user.lastName} (${user.email})`)
            console.log(`     Tutor ID: ${user.tutor?.id}`)
            console.log(`     Rate: $${tutor.hourlyRate}/hr, ${tutor.specializations.join(', ')}`)
        }

        // Create students
        console.log('\n👨‍🎓 Creating 10 Student Accounts...')
        for (const studentData of STUDENTS) {
            const { student, ...userData } = studentData

            const existing = await prisma.user.findUnique({
                where: { email: userData.email }
            })

            if (existing) {
                console.log(`  ⏭️  ${userData.firstName} ${userData.lastName} already exists`)
                continue
            }

            const user = await prisma.user.create({
                data: {
                    ...userData,
                    password: hashedStudentPassword,
                    isActive: true,
                    isVerified: true,
                    student: {
                        create: {
                            gradeLevel: student.gradeLevel,
                        }
                    }
                },
                include: { student: true }
            })

            console.log(`  ✅ ${user.firstName} ${user.lastName} (${user.email})`)
            console.log(`     Student ID: ${user.student?.id}`)
            console.log(`     ${student.gradeLevel}, ${student.subjects.join(', ')}`)
        }

        console.log('\n✅ All test users created successfully!')
        console.log('\n📋 Summary:')
        console.log('   5 Tutors with diverse specializations')
        console.log('   10 Students with varied profiles')
        console.log('   All accounts active and verified')
        console.log('\n🔐 Credentials:')
        console.log('   Tutors: TutorTest123!')
        console.log('   Students: StudentTest123!')

    } catch (error) {
        console.error('❌ Error seeding test users:', error)
        throw error
    } finally {
        await prisma.$disconnect()
    }
}

// Run if called directly
if (require.main === module) {
    seedTestUsers()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error)
            process.exit(1)
        })
}

module.exports = { seedTestUsers, TUTORS, STUDENTS }
