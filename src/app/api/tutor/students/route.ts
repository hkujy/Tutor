import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { db } from '@/lib/db/client'

// GET /api/tutor/students - Get list of tutor's students
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        if (session.user.role !== 'TUTOR' && session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Get tutor profile
        const tutor = await db.tutor.findUnique({
            where: { userId: session.user.id },
        })

        if (!tutor) {
            return NextResponse.json({ error: 'Tutor profile not found' }, { status: 404 })
        }

        // Get all students who have appointments with this tutor
        const appointments = await db.appointment.findMany({
            where: { tutorId: tutor.id },
            select: {
                student: {
                    select: {
                        id: true,
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
            },
            distinct: ['studentId'],
        })

        // Format student list
        const students = appointments.map((apt) => ({
            id: apt.student.id,
            name: `${apt.student.user.firstName} ${apt.student.user.lastName}`,
        }))

        return NextResponse.json({ students })
    } catch (error) {
        console.error('Error fetching tutor students:', error)
        return NextResponse.json(
            { error: 'Failed to fetch students' },
            { status: 500 }
        )
    }
}
