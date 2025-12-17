// const fetch = require('node-fetch'); // Native fetch is available in Node 18+

const API_URL = 'http://localhost:3000/api/auth/register';

async function testRegistration() {
  const timestamp = Date.now();
  const userData = {
    email: `teststudent${timestamp}@example.com`,
    password: 'password123',
    firstName: 'Test',
    lastName: 'Student',
    role: 'STUDENT',
    phone: '1234567890',
    // Student specific fields
    gradeLevel: '10',
    subjects: ['Math', 'Physics'],
    learningGoals: 'To improve calculus skills',
  };

  console.log('Attempting to register user:', userData.email);

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const status = response.status;
    const data = await response.json();

    console.log(`Response Status: ${status}`);
    console.log('Response Data:', JSON.stringify(data, null, 2));

    if (status === 201) {
      console.log('✅ Registration successful!');
      return userData.email;
    } else {
      console.error('❌ Registration failed.');
      return null;
    }
  } catch (error) {
    console.error('❌ Network or Server Error:', error.message);
    return null;
  }
}

testRegistration();
