import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../lib/db/client'

export async function GET() {
  try {
    const tutors = await db.tutor.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        availability: {
          where: {
            isActive: true
          },
          select: {
            id: true,
            dayOfWeek: true,
            startTime: true,
            endTime: true,
            isActive: true,
          }
        }
      },
      where: {
        user: {
          isActive: true
        }
      }
    })

    // Transform the data to match the expected format
    const formattedTutors = tutors.map(tutor => ({
      id: tutor.id, // Use the tutor ID, not the user ID
      user: {
        firstName: tutor.user.firstName,
        lastName: tutor.user.lastName,
        email: tutor.user.email,
      },
      subjects: tutor.specializations,
      hourlyRate: tutor.hourlyRate,
      availability: tutor.availability, // Include availability
      availableSlots: tutor.availability.length, // Add count for easy filtering
    }))

    // Filter to only return tutors with at least one availability slot
    const availableTutors = formattedTutors.filter(t => t.availableSlots > 0)

    return NextResponse.json({ tutors: availableTutors })
  } catch (error) {
    console.error('Failed to fetch tutors:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}