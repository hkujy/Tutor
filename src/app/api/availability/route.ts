import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../lib/db/client'
import { z } from 'zod'
import { AvailabilityService } from '../../../lib/services/availability'

const availabilitySchema = z.object({
  tutorId: z.string(),
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  isActive: z.boolean().optional().default(true),
  slotType: z.literal('repeating').optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  numberOfWeeks: z.number().min(1).max(52).optional()
})

// Schema for individual date-specific slots
const availabilityExceptionSchema = z.object({
  tutorId: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD format
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  slotType: z.literal('individual')
})

// We'll validate manually instead of using discriminated union to avoid conflicts

const updateAvailabilitySchema = z.object({
  isActive: z.boolean()
})

// Get tutor availability
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const userId = url.searchParams.get('tutorId') // This is actually userId from frontend

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    console.log('GET request - Finding tutor record for userId:', userId)
    // Convert userId to tutorId
    const tutor = await db.tutor.findUnique({
      where: { userId: userId }
    })

    if (!tutor) {
      console.log('ERROR: No tutor record found for userId:', userId)
      return NextResponse.json(
        { error: 'Tutor record not found. Please ensure you are registered as a tutor.' },
        { status: 404 }
      )
    }

    console.log('Found tutor:', tutor)
    const tutorId = tutor.id

    // Fetch both recurring availability and individual exceptions
    const [availability, exceptions] = await Promise.all([
      db.availability.findMany({
        where: { tutorId },
        orderBy: [
          { dayOfWeek: 'asc' },
          { startTime: 'asc' }
        ]
      }),
      db.availabilityException.findMany({
        where: { 
          tutorId,
          available: true // Only get available slots, not unavailable ones
        },
        orderBy: [
          { date: 'asc' },
          { startTime: 'asc' }
        ]
      })
    ])

    console.log('Retrieved availability:', availability)
    console.log('Retrieved exceptions:', exceptions)
    
    // Combine both types of availability
    const combinedAvailability = {
      recurring: availability,
      individual: exceptions
    }
    
    return NextResponse.json({ availability: combinedAvailability })
  } catch (error) {
    console.error('Fetch availability error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Create new availability slot
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Received availability creation request:', body)
    
    // Determine if this is an individual or repeating slot
    const isIndividual = body.slotType === 'individual' || body.date
    
    if (isIndividual) {
      // Handle individual date-specific slot
      const data = availabilityExceptionSchema.parse(body)
      console.log('Parsed individual slot data:', data)

      // Convert userId to tutorId
      console.log('Finding tutor record for userId:', data.tutorId)
      const tutor = await db.tutor.findUnique({
        where: { userId: data.tutorId }
      })

      if (!tutor) {
        console.log('ERROR: No tutor record found for userId:', data.tutorId)
        return NextResponse.json(
          { error: 'Tutor record not found. Please ensure you are registered as a tutor.' },
          { status: 404 }
        )
      }

      console.log('Found tutor:', tutor)
      const tutorId = tutor.id

      // Check for existing exception on this date and time
      const existing = await db.availabilityException.findUnique({
        where: {
          tutorId_date_startTime: {
            tutorId: tutorId,
            date: new Date(data.date),
            startTime: data.startTime
          }
        }
      })

      if (existing) {
        console.log('CONFLICT: Exception already exists for this date/time')
        return NextResponse.json(
          { error: 'An availability slot already exists for this date and time' },
          { status: 409 }
        )
      }

      console.log('Creating individual availability exception...')
      const exception = await db.availabilityException.create({
        data: {
          tutorId: tutorId,
          date: new Date(data.date),
          startTime: data.startTime,
          endTime: data.endTime,
          available: true,
          reason: 'Individual availability slot'
        }
      })

      console.log('Created individual slot:', exception)
      return NextResponse.json({ availability: exception, type: 'individual' }, { status: 201 })
      
    } else {
      // Handle recurring availability slot
      const data = availabilitySchema.parse(body)
      console.log('Parsed recurring slot data:', data)

      // Convert userId to tutorId
      console.log('Finding tutor record for userId:', data.tutorId)
      const tutor = await db.tutor.findUnique({
        where: { userId: data.tutorId }
      })

      if (!tutor) {
        console.log('ERROR: No tutor record found for userId:', data.tutorId)
        return NextResponse.json(
          { error: 'Tutor record not found. Please ensure you are registered as a tutor.' },
          { status: 404 }
        )
      }

      console.log('Found tutor:', tutor)
      const tutorId = tutor.id

      // Generate individual slots for the recurring pattern
      const startDate = new Date(data.startDate || new Date().toISOString().split('T')[0])
      let endDate: Date
      
      if (data.endDate) {
        endDate = new Date(data.endDate)
      } else if (data.numberOfWeeks) {
        endDate = new Date(startDate)
        endDate.setDate(endDate.getDate() + (data.numberOfWeeks * 7))
      } else {
        // Default to 4 weeks if no duration specified
        endDate = new Date(startDate)
        endDate.setDate(endDate.getDate() + (4 * 7))
      }

      // Use the service to generate slots
      const slotsToCreate = AvailabilityService.generateRecurringSlots({
        tutorId,
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        startDate,
        endDate
      })

      if (slotsToCreate.length === 0) {
        return NextResponse.json(
          { error: 'No new slots to create - all dates already have slots at this time' },
          { status: 400 }
        )
      }

      // Filter out existing slots
      // Note: In a high-concurrency environment, this check should ideally be atomic with the creation
      // but for now we'll check one by one or rely on unique constraints if they existed
      const uniqueSlots = []
      for (const slot of slotsToCreate) {
        const existing = await db.availabilityException.findUnique({
          where: {
            tutorId_date_startTime: {
              tutorId: slot.tutorId,
              date: slot.date,
              startTime: slot.startTime
            }
          }
        })
        
        if (!existing) {
          uniqueSlots.push(slot)
        }
      }

      if (uniqueSlots.length === 0) {
         return NextResponse.json(
          { error: 'No new slots to create - all dates already have slots at this time' },
          { status: 400 }
        )
      }

      console.log(`Creating ${uniqueSlots.length} recurring slots...`)
      const createdSlots = await db.availabilityException.createMany({
        data: uniqueSlots
      })

      console.log('Created recurring slots:', createdSlots)
      return NextResponse.json({ 
        slotsCreated: createdSlots.count,
        message: `Created ${createdSlots.count} recurring availability slots`,
        type: 'recurring' 
      }, { status: 201 })
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.errors)
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
    const { id, slotType, ...updateData } = body
    
    if (!id) {
      return NextResponse.json({ error: 'Availability ID is required' }, { status: 400 })
    }

    if (slotType === 'individual') {
      // Handle individual slot update
      const availableSchema = z.object({
        available: z.boolean()
      })
      const data = availableSchema.parse(updateData)

      const availability = await db.availabilityException.update({
        where: { id },
        data
      })

      return NextResponse.json({ availability })
    } else {
      // Handle recurring slot update
      const data = updateAvailabilitySchema.parse(updateData)

      const availability = await db.availability.update({
        where: { id },
        data
      })

      return NextResponse.json({ availability })
    }
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

    // Try to delete from both tables since we don't know which type it is
    try {
      await db.availability.delete({
        where: { id }
      })
      console.log('Deleted recurring availability slot:', id)
    } catch (error) {
      // If not found in availability table, try availabilityException table
      try {
        await db.availabilityException.delete({
          where: { id }
        })
        console.log('Deleted individual availability slot:', id)
      } catch (innerError) {
        console.error('Slot not found in either table:', id)
        return NextResponse.json({ error: 'Availability slot not found' }, { status: 404 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete availability error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}