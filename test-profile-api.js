#!/usr/bin/env node

/**
 * Profile Management Test Script
 * Tests the profile management functionality for both student and tutor roles
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

// Test credentials
const STUDENT = {
    email: 'student@example.com',
    password: 'student123',
    role: 'STUDENT'
};

const TUTOR = {
    email: 'tutor@example.com',
    password: 'tutor123',
    role: 'TUTOR'
};

// Helper function to make HTTP requests
function makeRequest(method, path, data = null, cookie = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const options = {
            method,
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (cookie) {
            options.headers['Cookie'] = cookie;
        }

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = body ? JSON.parse(body) : {};
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        data: parsed
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        data: body
                    });
                }
            });
        });

        req.on('error', reject);

        if (data) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

// Test login
async function testLogin(credentials) {
    console.log(`\n🔐 Testing login for ${credentials.role}...`);

    const response = await makeRequest('POST', '/api/auth/callback/credentials', {
        email: credentials.email,
        password: credentials.password,
        redirect: false
    });

    console.log(`   Status: ${response.status}`);

    // Extract session cookie
    const setCookie = response.headers['set-cookie'];
    if (setCookie) {
        const sessionCookie = Array.isArray(setCookie)
            ? setCookie.find(c => c.startsWith('next-auth.session-token'))
            : setCookie;

        if (sessionCookie) {
            console.log(`   ✅ Login successful - session cookie obtained`);
            return sessionCookie.split(';')[0];
        }
    }

    console.log(`   ❌ Login failed - no session cookie`);
    return null;
}

// Test profile GET
async function testGetProfile(cookie, role) {
    console.log(`\n📖 Testing GET /api/user/profile for ${role}...`);

    const response = await makeRequest('GET', '/api/user/profile', null, cookie);

    console.log(`   Status: ${response.status}`);

    if (response.status === 200 && response.data.user) {
        console.log(`   ✅ Profile retrieved successfully`);
        console.log(`   User: ${response.data.user.firstName} ${response.data.user.lastName}`);
        console.log(`   Email: ${response.data.user.email}`);
        console.log(`   Phone: ${response.data.user.phone || 'Not set'}`);
        return response.data.user;
    } else {
        console.log(`   ❌ Failed to retrieve profile`);
        console.log(`   Response:`, response.data);
        return null;
    }
}

// Test profile UPDATE
async function testUpdateProfile(cookie, role, updates) {
    console.log(`\n✏️  Testing PUT /api/user/profile for ${role}...`);
    console.log(`   Updates:`, updates);

    const response = await makeRequest('PUT', '/api/user/profile', updates, cookie);

    console.log(`   Status: ${response.status}`);

    if (response.status === 200) {
        console.log(`   ✅ Profile updated successfully`);
        console.log(`   Response:`, response.data);
        return true;
    } else {
        console.log(`   ❌ Failed to update profile`);
        console.log(`   Response:`, response.data);
        return false;
    }
}

// Main test runner
async function runTests() {
    console.log('🧪 Profile Management Test Suite');
    console.log('='.repeat(50));

    try {
        // Test Student
        console.log('\n📚 STUDENT TESTS');
        console.log('-'.repeat(50));

        const studentCookie = await testLogin(STUDENT);
        if (studentCookie) {
            const studentProfile = await testGetProfile(studentCookie, 'STUDENT');
            if (studentProfile) {
                await testUpdateProfile(studentCookie, 'STUDENT', {
                    firstName: studentProfile.firstName,
                    lastName: studentProfile.lastName,
                    phone: '+1 (555) 123-4567'
                });

                // Verify update
                await testGetProfile(studentCookie, 'STUDENT');
            }
        }

        // Test Tutor
        console.log('\n\n👨‍🏫 TUTOR TESTS');
        console.log('-'.repeat(50));

        const tutorCookie = await testLogin(TUTOR);
        if (tutorCookie) {
            const tutorProfile = await testGetProfile(tutorCookie, 'TUTOR');
            if (tutorProfile) {
                await testUpdateProfile(tutorCookie, 'TUTOR', {
                    firstName: tutorProfile.firstName,
                    lastName: tutorProfile.lastName,
                    phone: '+1 (555) 987-6543'
                });

                // Verify update
                await testGetProfile(tutorCookie, 'TUTOR');
            }
        }

        console.log('\n' + '='.repeat(50));
        console.log('✅ Test suite completed!');
        console.log('='.repeat(50));

    } catch (error) {
        console.error('\n❌ Test suite failed with error:', error);
        process.exit(1);
    }
}

// Run tests
runTests();
