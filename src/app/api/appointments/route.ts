import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../lib/db/client'
import { z } from 'zod'

const appointmentSchema = z.object({
  tutorId: z.string(),
  studentId: z.string(),
  date: z.string(), // ISO date
  time: z.string(), // HH:MM
  subject: z.string(),
  duration: z.number().optional().default(60), // Duration in minutes
})

const updateAppointmentSchema = z.object({
  id: z.string(),
  date: z.string().optional(),
  time: z.string().optional(),
  subject: z.string().optional(),
  status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED']).optional(),
  duration: z.number().optional(),
  notes: z.string().optional(),
})

export async function GET() {
  try {
    const appointments = await db.appointment.findMany({
      orderBy: { startTime: 'asc' },
      include: {
        tutor: {
          select: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              }
            }
          }
        },
        student: {
          select: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              }
            }
          }
        }
      }
    })
    return NextResponse.json({ appointments })
  } catch (error) {
    console.error('Fetch appointments error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = appointmentSchema.parse(body)

    // Combine date and time into a Date object
    const startTime = new Date(`${data.date}T${data.time}:00Z`)
    const endTime = new Date(startTime.getTime() + data.duration * 60 * 1000) // Duration in minutes

    const appointment = await db.appointment.create({
      data: {
        tutorId: data.tutorId,
        studentId: data.studentId,
        startTime,
        endTime,
        subject: data.subject,
        status: 'SCHEDULED',
      },
    })

    return NextResponse.json({ appointment }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    console.error('Appointment creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update/reschedule appointment
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const data = updateAppointmentSchema.parse(body)

    // Build update data object
    const updateData: any = {}
    
    if (data.date && data.time) {
      const startTime = new Date(`${data.date}T${data.time}:00Z`)
      updateData.startTime = startTime
      
      if (data.duration) {
        updateData.endTime = new Date(startTime.getTime() + data.duration * 60 * 1000)
      }
    }
    
    if (data.subject) updateData.subject = data.subject
    if (data.status) updateData.status = data.status
    if (data.notes !== undefined) updateData.notes = data.notes

    const appointment = await db.appointment.update({
      where: { id: data.id },
      data: updateData,
      include: {
        tutor: {
          select: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              }
            }
          }
        },
        student: {
          select: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              }
            }
          }
        }
      }
    })

    return NextResponse.json({ appointment })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    console.error('Appointment update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Cancel appointment
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Appointment ID is required' }, { status: 400 })
    }

    // Soft delete by updating status to CANCELLED
    const appointment = await db.appointment.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: {
        tutor: {
          select: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              }
            }
          }
        },
        student: {
          select: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              }
            }
          }
        }
      }
    })

    return NextResponse.json({ appointment })
  } catch (error) {
    console.error('Appointment cancellation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
