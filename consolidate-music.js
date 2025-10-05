process.env.DATABASE_URL = "postgresql://tutoring:password@localhost:5433/tutoring_calendar_dev"
process.env.DIRECT_URL = "postgresql://tutoring:password@localhost:5433/tutoring_calendar_dev"

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function consolidateToMusic() {
  console.log('Consolidating all subjects to Music...')
  
  // Get all lecture hours records
  const allLectureHours = await prisma.lectureHours.findMany({
    include: { sessions: true, payments: true }
  })
  
  console.log('Found', allLectureHours.length, 'lecture hours records')
  
  // Group by student-tutor pairs
  const grouped = {}
  allLectureHours.forEach(lh => {
    const key = `${lh.studentId}-${lh.tutorId}`
    if (!grouped[key]) {
      grouped[key] = []
    }
    grouped[key].push(lh)
  })
  
  // For each student-tutor pair, consolidate to Music
  for (const [key, records] of Object.entries(grouped)) {
    if (records.length === 1) {
      // Just update subject
      await prisma.lectureHours.update({
        where: { id: records[0].id },
        data: { subject: 'Music' }
      })
      console.log(`Updated single record ${records[0].id} to Music`)
    } else {
      // Consolidate multiple records
      const totalHours = records.reduce((sum, r) => sum + parseFloat(r.totalHours.toString()), 0)
      const unpaidHours = records.reduce((sum, r) => sum + parseFloat(r.unpaidHours.toString()), 0)
      
      // Keep the first record, update it to Music and consolidate hours
      const primaryRecord = records[0]
      await prisma.lectureHours.update({
        where: { id: primaryRecord.id },
        data: { 
          subject: 'Music',
          totalHours: totalHours,
          unpaidHours: unpaidHours
        }
      })
      
      // Move sessions and payments to the primary record
      for (let i = 1; i < records.length; i++) {
        const record = records[i]
        
        // Move sessions
        await prisma.lectureSession.updateMany({
          where: { lectureHoursId: record.id },
          data: { lectureHoursId: primaryRecord.id }
        })
        
        // Move payments
        await prisma.payment.updateMany({
          where: { lectureHoursId: record.id },
          data: { lectureHoursId: primaryRecord.id }
        })
        
        // Delete the duplicate record
        await prisma.lectureHours.delete({
          where: { id: record.id }
        })
        console.log(`Consolidated and deleted record ${record.id}`)
      }
      
      console.log(`Consolidated ${records.length} records for ${key} into Music subject`)
    }
  }
  
  // Update all appointments to Music
  const appointments = await prisma.appointment.updateMany({
    data: { subject: 'Music' }
  })
  console.log('Updated', appointments.count, 'appointments to Music')
  
  await prisma.$disconnect()
  console.log('✅ Successfully consolidated all data to Music subject')
}

consolidateToMusic().catch(console.error)