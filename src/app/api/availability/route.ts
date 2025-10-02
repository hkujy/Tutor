import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../lib/db/client'
import { z } from 'zod'

const availabilitySchema = z.object({
  tutorId: z.string(),
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  isActive: z.boolean().optional().default(true)
})

const updateAvailabilitySchema = z.object({
  isActive: z.boolean()
})

// Get tutor availability
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const tutorId = url.searchParams.get('tutorId')

    if (!tutorId) {
      return NextResponse.json({ error: 'Tutor ID is required' }, { status: 400 })
    }

    const availability = await db.availability.findMany({
      where: { tutorId },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' }
      ]
    })

    return NextResponse.json({ availability })
  } catch (error) {
    console.error('Fetch availability error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Create new availability slot
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = availabilitySchema.parse(body)

    // Check for overlapping time slots
    const overlapping = await db.availability.findFirst({
      where: {
        tutorId: data.tutorId,
        dayOfWeek: data.dayOfWeek,
        isActive: true,
        OR: [
          {
            AND: [
              { startTime: { lte: data.startTime } },
              { endTime: { gt: data.startTime } }
            ]
          },
          {
            AND: [
              { startTime: { lt: data.endTime } },
              { endTime: { gte: data.endTime } }
            ]
          },
          {
            AND: [
              { startTime: { gte: data.startTime } },
              { endTime: { lte: data.endTime } }
            ]
          }
        ]
      }
    })

    if (overlapping) {
      return NextResponse.json(
        { error: 'This time slot overlaps with an existing availability slot' },
        { status: 400 }
      )
    }

    const availability = await db.availability.create({
      data: {
        tutorId: data.tutorId,
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        isActive: data.isActive
      }
    })

    return NextResponse.json({ availability }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    console.error('Create availability error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Update availability slot
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body
    
    if (!id) {
      return NextResponse.json({ error: 'Availability ID is required' }, { status: 400 })
    }

    const data = updateAvailabilitySchema.parse(updateData)

    const availability = await db.availability.update({
      where: { id },
      data
    })

    return NextResponse.json({ availability })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    console.error('Update availability error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Delete availability slot
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Availability ID is required' }, { status: 400 })
    }

    await db.availability.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete availability error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}