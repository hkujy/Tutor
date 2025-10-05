#!/usr/bin/env node

/**
 * Test script for notification system
 * This script tests the notification API endpoints and basic functionality
 */

const BASE_URL = 'http://localhost:3000'

async function testNotificationSystem() {
  console.log('🧪 Testing Notification System')
  console.log('================================')

  try {
    // Test health check first
    console.log('\n1. Testing health check...')
    const healthResponse = await fetch(`${BASE_URL}/api/health`)
    const healthData = await healthResponse.json()
    console.log('✅ Health check:', healthData.status)

    // Test notification API without authentication (should fail)
    console.log('\n2. Testing notification API without auth...')
    const noAuthResponse = await fetch(`${BASE_URL}/api/notifications`)
    console.log('🔒 No auth response status:', noAuthResponse.status)
    
    if (noAuthResponse.status === 401) {
      console.log('✅ Authentication properly required')
    } else {
      console.log('❌ Authentication should be required')
    }

    // Test notification preferences API without authentication (should fail)
    console.log('\n3. Testing notification preferences API without auth...')
    const prefNoAuthResponse = await fetch(`${BASE_URL}/api/notifications/preferences`)
    console.log('🔒 Preferences no auth response status:', prefNoAuthResponse.status)
    
    if (prefNoAuthResponse.status === 401) {
      console.log('✅ Preferences authentication properly required')
    } else {
      console.log('❌ Preferences authentication should be required')
    }

    // Test API route existence (should get 401, not 404)
    console.log('\n4. Testing API route existence...')
    const endpoints = [
      '/api/notifications',
      '/api/notifications/preferences',
      '/api/notifications/bulk-mark-read'
    ]

    for (const endpoint of endpoints) {
      const response = await fetch(`${BASE_URL}${endpoint}`)
      const status = response.status
      
      if (status === 401) {
        console.log(`✅ ${endpoint} - exists and requires auth`)
      } else if (status === 404) {
        console.log(`❌ ${endpoint} - route not found`)
      } else {
        console.log(`⚠️  ${endpoint} - unexpected status: ${status}`)
      }
    }

    console.log('\n✅ Basic notification API tests completed!')
    console.log('\nNote: Full functionality testing requires authentication.')
    console.log('Use the web interface to test authenticated functionality.')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Run the tests
testNotificationSystem()