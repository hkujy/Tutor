import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { db } from '@/lib/db/client'

// POST /api/tutor/rates/student - Create student-specific rate
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        if (session.user.role !== 'TUTOR' && session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const body = await request.json()
        const { studentId, hourlyRate, subject } = body

        if (!studentId || typeof hourlyRate !== 'number' || hourlyRate < 0) {
            return NextResponse.json(
                { error: 'Invalid request data' },
                { status: 400 }
            )
        }

        // Get tutor profile
        const tutor = await db.tutor.findUnique({
            where: { userId: session.user.id },
        })

        if (!tutor) {
            return NextResponse.json({ error: 'Tutor profile not found' }, { status: 404 })
        }

        // Verify student exists
        const student = await db.student.findUnique({
            where: { id: studentId },
        })

        if (!student) {
            return NextResponse.json({ error: 'Student not found' }, { status: 404 })
        }

        // Create student-specific rate
        const studentRate = await db.studentRate.create({
            data: {
                tutorId: tutor.id,
                studentId,
                hourlyRate,
                subject: subject || null,
            },
            include: {
                student: {
                    include: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
            },
        })

        return NextResponse.json({
            success: true,
            rate: {
                id: studentRate.id,
                studentId: studentRate.studentId,
                studentName: `${studentRate.student.user.firstName} ${studentRate.student.user.lastName}`,
                hourlyRate: studentRate.hourlyRate.toNumber(),
                subject: studentRate.subject,
            },
        })
    } catch (error: any) {
        console.error('Error creating student rate:', error)

        // Handle unique constraint violation
        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: 'Rate already exists for this student and subject' },
                { status: 409 }
            )
        }

        return NextResponse.json(
            { error: 'Failed to create student rate' },
            { status: 500 }
        )
    }
}

// PUT /api/tutor/rates/student - Update student-specific rate
export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        if (session.user.role !== 'TUTOR' && session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const body = await request.json()
        const { rateId, hourlyRate } = body

        if (!rateId || typeof hourlyRate !== 'number' || hourlyRate < 0) {
            return NextResponse.json(
                { error: 'Invalid request data' },
                { status: 400 }
            )
        }

        // Get tutor profile
        const tutor = await db.tutor.findUnique({
            where: { userId: session.user.id },
        })

        if (!tutor) {
            return NextResponse.json({ error: 'Tutor profile not found' }, { status: 404 })
        }

        // Verify rate belongs to this tutor
        const existingRate = await db.studentRate.findUnique({
            where: { id: rateId },
        })

        if (!existingRate || existingRate.tutorId !== tutor.id) {
            return NextResponse.json({ error: 'Rate not found' }, { status: 404 })
        }

        // Update rate
        const updatedRate = await db.studentRate.update({
            where: { id: rateId },
            data: { hourlyRate },
            include: {
                student: {
                    include: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
            },
        })

        return NextResponse.json({
            success: true,
            rate: {
                id: updatedRate.id,
                studentId: updatedRate.studentId,
                studentName: `${updatedRate.student.user.firstName} ${updatedRate.student.user.lastName}`,
                hourlyRate: updatedRate.hourlyRate.toNumber(),
                subject: updatedRate.subject,
            },
        })
    } catch (error) {
        console.error('Error updating student rate:', error)
        return NextResponse.json(
            { error: 'Failed to update student rate' },
            { status: 500 }
        )
    }
}

// DELETE /api/tutor/rates/student - Delete student-specific rate
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        if (session.user.role !== 'TUTOR' && session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { searchParams } = new URL(request.url)
        const rateId = searchParams.get('rateId')

        if (!rateId) {
            return NextResponse.json(
                { error: 'Rate ID is required' },
                { status: 400 }
            )
        }

        // Get tutor profile
        const tutor = await db.tutor.findUnique({
            where: { userId: session.user.id },
        })

        if (!tutor) {
            return NextResponse.json({ error: 'Tutor profile not found' }, { status: 404 })
        }

        // Verify rate belongs to this tutor
        const existingRate = await db.studentRate.findUnique({
            where: { id: rateId },
        })

        if (!existingRate || existingRate.tutorId !== tutor.id) {
            return NextResponse.json({ error: 'Rate not found' }, { status: 404 })
        }

        // Delete rate
        await db.studentRate.delete({
            where: { id: rateId },
        })

        return NextResponse.json({
            success: true,
            message: 'Student rate deleted successfully',
        })
    } catch (error) {
        console.error('Error deleting student rate:', error)
        return NextResponse.json(
            { error: 'Failed to delete student rate' },
            { status: 500 }
        )
    }
}
