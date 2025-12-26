import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth/config'
import { db } from '../../../lib/db/client'
import { z } from 'zod'

const createAssignmentSchema = z.object({
    appointmentId: z.string(),
    title: z.string().min(1, 'Title is required'),
    description: z.string().min(1, 'Description is required'),
    difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).default('INTERMEDIATE'),
    dueDate: z.string(), // ISO date string
    maxAttempts: z.number().int().positive().default(1),
})

const updateAssignmentSchema = z.object({
    id: z.string(),
    title: z.string().optional(),
    description: z.string().optional(),
    difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
    status: z.enum(['ASSIGNED', 'IN_PROGRESS', 'SUBMITTED', 'GRADED', 'OVERDUE']).optional(),
    dueDate: z.string().optional(),
})

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('userId')
        const role = searchParams.get('role') as 'tutor' | 'student' | null
        const status = searchParams.get('status')

        if (!userId || !role) {
            return NextResponse.json({ error: 'userId and role are required' }, { status: 400 })
        }

        // Build the query based on role
        const whereClause: any = {}

        if (role === 'tutor') {
            // Tutors see assignments they created (through their appointments)
            if (!session.user.tutorId) {
                return NextResponse.json({ error: 'Tutor profile not found' }, { status: 403 })
            }
            whereClause.appointment = {
                tutorId: session.user.tutorId
            }
        } else if (role === 'student') {
            // Students see assignments from their appointments
            if (!session.user.studentId) {
                return NextResponse.json({ error: 'Student profile not found' }, { status: 403 })
            }
            whereClause.appointment = {
                studentId: session.user.studentId
            }
        } else {
            return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
        }

        // Optional status filter
        if (status && status !== 'all') {
            if (status === 'pending') {
                whereClause.status = { in: ['ASSIGNED', 'IN_PROGRESS'] }
            } else if (status === 'completed') {
                whereClause.status = { in: ['SUBMITTED', 'GRADED'] }
            } else if (status === 'overdue') {
                whereClause.status = 'OVERDUE'
            }
        }

        // Fetch assignments with related data
        const assignments = await db.assignment.findMany({
            where: whereClause,
            orderBy: { dueDate: 'asc' },
            include: {
                appointment: {
                    include: {
                        student: {
                            select: {
                                id: true,
                                user: {
                                    select: {
                                        firstName: true,
                                        lastName: true,
                                        email: true,
                                    }
                                }
                            }
                        },
                        tutor: {
                            select: {
                                id: true,
                                user: {
                                    select: {
                                        firstName: true,
                                        lastName: true,
                                    }
                                }
                            }
                        }
                    }
                },
                files: true,
                submissions: {
                    where: role === 'student' ? { studentId: session.user.studentId } : undefined,
                    orderBy: { submittedAt: 'desc' },
                    take: 1,
                }
            }
        })

        // Check for overdue assignments and update status
        const now = new Date()
        const overdueUpdates = assignments
            .filter(a => a.status !== 'GRADED' && a.status !== 'OVERDUE' && new Date(a.dueDate) < now)
            .map(a =>
                db.assignment.update({
                    where: { id: a.id },
                    data: { status: 'OVERDUE' }
                })
            )

        if (overdueUpdates.length > 0) {
            await db.$transaction(overdueUpdates)
        }

        // Transform data to frontend format
        const transformedAssignments = assignments.map(assignment => {
            const latestSubmission = assignment.submissions[0]

            return {
                id: assignment.id,
                title: assignment.title,
                description: assignment.description,
                dueDate: assignment.dueDate.toISOString(),
                status: assignment.status.toLowerCase(),
                subject: assignment.appointment.subject,
                difficulty: assignment.difficulty.toLowerCase(),
                attachments: assignment.files.map(f => f.originalName),
                grade: latestSubmission?.grade ? parseFloat(latestSubmission.grade.toString()) : undefined,
                feedback: latestSubmission?.feedback || undefined,
                submittedDate: latestSubmission?.submittedAt?.toISOString() || undefined,
                // Additional metadata
                studentName: role === 'tutor'
                    ? `${assignment.appointment.student.user.firstName} ${assignment.appointment.student.user.lastName}`
                    : undefined,
                tutorName: role === 'student'
                    ? `${assignment.appointment.tutor.user.firstName} ${assignment.appointment.tutor.user.lastName}`
                    : undefined,
            }
        })

        return NextResponse.json({
            assignments: transformedAssignments,
            total: transformedAssignments.length
        })
    } catch (error) {
        console.error('Fetch assignments error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Only tutors can create assignments
        if (session.user.role !== 'TUTOR') {
            return NextResponse.json({ error: 'Only tutors can create assignments' }, { status: 403 })
        }

        const body = await request.json()
        const data = createAssignmentSchema.parse(body)

        // Verify the appointment belongs to this tutor
        const appointment = await db.appointment.findUnique({
            where: { id: data.appointmentId },
            select: { tutorId: true, studentId: true }
        })

        if (!appointment) {
            return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
        }

        if (appointment.tutorId !== session.user.tutorId) {
            return NextResponse.json({ error: 'You can only create assignments for your own appointments' }, { status: 403 })
        }

        // Create the assignment
        const assignment = await db.assignment.create({
            data: {
                appointmentId: data.appointmentId,
                title: data.title,
                description: data.description,
                difficulty: data.difficulty,
                dueDate: new Date(data.dueDate),
                maxAttempts: data.maxAttempts,
                status: 'ASSIGNED',
            },
            include: {
                appointment: {
                    include: {
                        student: {
                            select: {
                                user: {
                                    select: {
                                        id: true,
                                        firstName: true,
                                        lastName: true,
                                    }
                                }
                            }
                        }
                    }
                }
            }
        })

        // Create notification for student
        try {
            await db.notification.create({
                data: {
                    userId: assignment.appointment.student.user.id,
                    type: 'ASSIGNMENT_DUE',
                    title: 'New Assignment',
                    message: `You have a new assignment: "${data.title}". Due date: ${new Date(data.dueDate).toLocaleDateString()}.`,
                    channels: ['in_app', 'email'],
                    data: {
                        assignmentId: assignment.id,
                        title: data.title,
                        dueDate: data.dueDate,
                    }
                }
            })
        } catch (notificationError) {
            console.error('Failed to create notification:', notificationError)
            // Don't fail assignment creation if notification fails
        }

        return NextResponse.json({ assignment }, { status: 201 })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
        }
        console.error('Assignment creation error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const data = updateAssignmentSchema.parse(body)

        // Fetch assignment with permissions check
        const assignment = await db.assignment.findUnique({
            where: { id: data.id },
            include: {
                appointment: {
                    select: {
                        tutorId: true,
                        studentId: true,
                    }
                }
            }
        })

        if (!assignment) {
            return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
        }

        // Check permissions
        const isTutor = session.user.role === 'TUTOR' && assignment.appointment.tutorId === session.user.tutorId
        const isStudent = session.user.role === 'STUDENT' && assignment.appointment.studentId === session.user.studentId

        if (!isTutor && !isStudent) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Build update data
        const updateData: any = {}

        if (isTutor) {
            // Tutors can update all fields
            if (data.title) updateData.title = data.title
            if (data.description) updateData.description = data.description
            if (data.difficulty) updateData.difficulty = data.difficulty
            if (data.status) updateData.status = data.status
            if (data.dueDate) updateData.dueDate = new Date(data.dueDate)
        } else if (isStudent) {
            // Students can only update status (e.g., mark as in progress)
            if (data.status === 'IN_PROGRESS') {
                updateData.status = 'IN_PROGRESS'
            } else {
                return NextResponse.json({ error: 'Students can only mark assignments as in progress' }, { status: 403 })
            }
        }

        const updatedAssignment = await db.assignment.update({
            where: { id: data.id },
            data: updateData,
        })

        return NextResponse.json({ assignment: updatedAssignment })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
        }
        console.error('Assignment update error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Only tutors can delete assignments
        if (session.user.role !== 'TUTOR') {
            return NextResponse.json({ error: 'Only tutors can delete assignments' }, { status: 403 })
        }

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 })
        }

        // Verify ownership
        const assignment = await db.assignment.findUnique({
            where: { id },
            include: {
                appointment: {
                    select: { tutorId: true }
                }
            }
        })

        if (!assignment) {
            return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
        }

        if (assignment.appointment.tutorId !== session.user.tutorId) {
            return NextResponse.json({ error: 'You can only delete your own assignments' }, { status: 403 })
        }

        // Delete assignment (cascades to files and submissions)
        await db.assignment.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Assignment deletion error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
