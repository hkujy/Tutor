#!/usr/bin/env node

// Test the appointment completion workflow
// Using built-in fetch for Node.js 18+

const baseUrl = 'http://localhost:3000';

async function testAppointmentWorkflow() {
  try {
    console.log('🧪 Testing Appointment → Lecture Hours Workflow');
    console.log('=' .repeat(50));

    // First, let's check existing data
    console.log('\n1. Checking existing lecture hours...');
    const lectureHoursResponse = await fetch(`${baseUrl}/api/lecture-hours`);
    const lectureHoursData = await lectureHoursResponse.json();
    console.log('✅ Existing lecture hours:', lectureHoursData.lectureHours?.length || 0);

    // Check existing appointments
    console.log('\n2. Checking existing appointments...');
    const appointmentsResponse = await fetch(`${baseUrl}/api/appointments`);
    const appointmentsData = await appointmentsResponse.json();
    console.log('✅ Existing appointments:', appointmentsData.appointments?.length || 0);

    // Find an appointment to complete
    const pendingAppointments = appointmentsData.appointments?.filter(
      apt => apt.status === 'SCHEDULED' || apt.status === 'CONFIRMED'
    ) || [];

    if (pendingAppointments.length === 0) {
      console.log('\n⚠️  No pending appointments found. Creating a test appointment...');
      
      // Create a test appointment first
      const createResponse = await fetch(`${baseUrl}/api/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tutorId: 1, // Assuming tutor ID 1 exists
          studentId: 1, // Assuming student ID 1 exists
          subject: 'Math',
          startTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
          endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
          status: 'SCHEDULED',
          notes: 'Test appointment for workflow testing'
        })
      });

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        console.log('❌ Failed to create test appointment:', errorText);
        return;
      }

      const createdAppointment = await createResponse.json();
      console.log('✅ Created test appointment:', createdAppointment.appointment?.id);
      
      // Use the newly created appointment
      pendingAppointments.push(createdAppointment.appointment);
    }

    const testAppointment = pendingAppointments[0];
    console.log(`\n3. Testing with appointment ID: ${testAppointment.id}`);
    console.log(`   Subject: ${testAppointment.subject}`);
    console.log(`   Duration: ${testAppointment.startTime} → ${testAppointment.endTime}`);

    // Mark the appointment as completed
    console.log('\n4. Marking appointment as COMPLETED...');
    const completionResponse = await fetch(`${baseUrl}/api/appointments`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: testAppointment.id,
        status: 'COMPLETED',
        notes: testAppointment.notes + ' - Completed via workflow test'
      })
    });

    if (!completionResponse.ok) {
      const errorText = await completionResponse.text();
      console.log('❌ Failed to complete appointment:', errorText);
      return;
    }

    const completedAppointment = await completionResponse.json();
    console.log('✅ Appointment marked as completed');

    // Wait a moment for the async processes to complete
    console.log('\n5. Waiting for automated processes...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check if lecture hours were created
    console.log('\n6. Checking for new lecture hours...');
    const newLectureHoursResponse = await fetch(`${baseUrl}/api/lecture-hours`);
    const newLectureHoursData = await newLectureHoursResponse.json();
    const newCount = newLectureHoursData.lectureHours?.length || 0;
    
    console.log(`✅ Lecture hours count: ${newCount} (was ${lectureHoursData.lectureHours?.length || 0})`);

    // Look for lecture hours matching our test
    const matchingLectureHours = newLectureHoursData.lectureHours?.filter(lh => 
      lh.subject === testAppointment.subject &&
      lh.tutorId === testAppointment.tutorId &&
      lh.studentId === testAppointment.studentId
    ) || [];

    if (matchingLectureHours.length > 0) {
      console.log('🎉 SUCCESS! Lecture hours were automatically created:');
      matchingLectureHours.forEach(lh => {
        console.log(`   - ID: ${lh.id}, Hours: ${lh.totalHours}, Unpaid: ${lh.unpaidHours}`);
      });
    } else {
      console.log('⚠️  No matching lecture hours found. Workflow may need debugging.');
    }

    console.log('\n' + '='.repeat(50));
    console.log('🏁 Workflow test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testAppointmentWorkflow();
}

module.exports = { testAppointmentWorkflow };