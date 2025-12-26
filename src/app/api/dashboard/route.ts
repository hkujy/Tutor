import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../lib/db/client'

// Get tutor dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const tutorId = url.searchParams.get('tutorId')
    const role = url.searchParams.get('role')

    if (!tutorId || !role) {
      return NextResponse.json({ error: 'Tutor ID and role are required' }, { status: 400 })
    }

    if (role === 'tutor') {
      // Get tutor statistics
      const [
        totalAppointments,
        upcomingAppointments,
        completedAppointments,
        totalStudents,
        recentAppointments,
        availabilitySlots
      ] = await Promise.all([
        // Total appointments
        db.appointment.count({
          where: { tutorId }
        }),
        // Upcoming appointments
        db.appointment.count({
          where: {
            tutorId,
            startTime: { gte: new Date() },
            status: { in: ['SCHEDULED', 'CONFIRMED'] }
          }
        }),
        // Completed appointments
        db.appointment.count({
          where: {
            tutorId,
            status: 'COMPLETED'
          }
        }),
        // Unique students
        db.appointment.findMany({
          where: { tutorId },
          select: { studentId: true },
          distinct: ['studentId']
        }),
        // Recent appointments with student info
        db.appointment.findMany({
          where: { tutorId },
          orderBy: { startTime: 'desc' },
          take: 5,
          include: {
            student: {
              include: {
                user: {
                  select: { firstName: true, lastName: true }
                }
              }
            }
          }
        }),
        // Availability slots count
        db.availability.count({
          where: { tutorId, isActive: true }
        })
      ])

      // Fetch tutor record to get rating
      const tutorRecord = await db.tutor.findUnique({
        where: { userId: tutorId },
        select: { rating: true }
      })

      // Use actual rating or default to 0
      const avgRating = tutorRecord?.rating ? Number(tutorRecord.rating) : 0

      return NextResponse.json({
        stats: {
          totalAppointments,
          upcomingAppointments,
          completedAppointments,
          totalStudents: totalStudents.length,
          avgRating,
          availabilitySlots
        },
        recentAppointments
      })
    } else if (role === 'student') {
      // Get student statistics  
      const studentRecord = await db.student.findFirst({
        where: { userId: tutorId }, // Note: using tutorId param but it's actually userId for students
      })

      if (!studentRecord) {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 })
      }

      const [
        totalAppointments,
        upcomingAppointments,
        completedAppointments,
        recentAppointments
      ] = await Promise.all([
        // Total appointments
        db.appointment.count({
          where: { studentId: studentRecord.id }
        }),
        // Upcoming appointments
        db.appointment.count({
          where: {
            studentId: studentRecord.id,
            startTime: { gte: new Date() },
            status: { in: ['SCHEDULED', 'CONFIRMED'] }
          }
        }),
        // Completed appointments
        db.appointment.count({
          where: {
            studentId: studentRecord.id,
            status: 'COMPLETED'
          }
        }),
        // Recent appointments with tutor info
        db.appointment.findMany({
          where: { studentId: studentRecord.id },
          orderBy: { startTime: 'desc' },
          take: 5,
          include: {
            tutor: {
              include: {
                user: {
                  select: { firstName: true, lastName: true }
                }
              }
            }
          }
        })
      ])

      // Default rating to 0 for students as requested (no rating field in schema)
      const avgRating = 0

      return NextResponse.json({
        stats: {
          totalAppointments,
          upcomingAppointments,
          completedAppointments,
          avgRating
        },
        recentAppointments
      })
    }

    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}