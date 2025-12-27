import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { db } from '@/lib/db/client'

// GET /api/tutor/rates - Get tutor's default rate and all student-specific rates
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
            select: {
                id: true,
                hourlyRate: true,
                currency: true,
            },
        })

        if (!tutor) {
            return NextResponse.json({ error: 'Tutor profile not found' }, { status: 404 })
        }

        // Get all student-specific rates
        const studentRates = await db.studentRate.findMany({
            where: { tutorId: tutor.id },
            include: {
                student: {
                    select: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        })

        // Format response
        const formattedRates = studentRates.map((rate: any) => ({
            id: rate.id,
            studentId: rate.studentId,
            studentName: rate.student?.user ? `${rate.student.user.firstName} ${rate.student.user.lastName}` : 'Unknown Student',
            hourlyRate: rate.hourlyRate.toNumber(),
            subject: rate.subject,
            createdAt: rate.createdAt,
            updatedAt: rate.updatedAt,
        }))

        return NextResponse.json({
            defaultRate: tutor.hourlyRate ? tutor.hourlyRate.toNumber() : null,
            currency: tutor.currency,
            studentRates: formattedRates,
        })
    } catch (error) {
        console.error('Error fetching tutor rates:', error)
        return NextResponse.json(
            { error: 'Failed to fetch rates' },
            { status: 500 }
        )
    }
}

// PUT /api/tutor/rates - Update tutor's default hourly rate
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
        const { hourlyRate, currency } = body

        if (hourlyRate !== undefined && (typeof hourlyRate !== 'number' || hourlyRate < 0)) {
            return NextResponse.json(
                { error: 'Invalid hourly rate' },
                { status: 400 }
            )
        }

        if (currency !== undefined && (typeof currency !== 'string' || currency.length !== 3)) {
            return NextResponse.json(
                { error: 'Invalid currency code' },
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

        // Update tutor profile
        const updateData: any = {}
        if (hourlyRate !== undefined) updateData.hourlyRate = hourlyRate
        if (currency !== undefined) updateData.currency = currency

        const updatedTutor = await db.tutor.update({
            where: { id: tutor.id },
            data: updateData,
            select: {
                hourlyRate: true,
                currency: true,
            },
        })

        return NextResponse.json({
            success: true,
            rate: updatedTutor.hourlyRate?.toNumber(),
            currency: updatedTutor.currency,
        })
    } catch (error) {
        console.error('Error updating tutor rate:', error)
        return NextResponse.json(
            { error: 'Failed to update rate' },
            { status: 500 }
        )
    }
}
