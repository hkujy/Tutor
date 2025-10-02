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
      hourlyRate: tutor.hourlyRate
    }))

    return NextResponse.json({ tutors: formattedTutors })
  } catch (error) {
    console.error('Failed to fetch tutors:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}