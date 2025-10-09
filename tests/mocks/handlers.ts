import { http, HttpResponse } from 'msw'

export const handlers = [
  // Notification API handlers
  http.get('/api/notifications', () => {
    return HttpResponse.json([
      {
        id: 'notif-1',
        type: 'APPOINTMENT_REMINDER',
        message: 'Test notification',
        isRead: false,
        createdAt: new Date().toISOString(),
      },
    ])
  }),

  http.post('/api/notifications', async ({ request }) => {
    const body = await request.json() as Record<string, any>
    return HttpResponse.json({
      id: 'notif-new',
      ...body,
      createdAt: new Date().toISOString(),
    })
  }),

  // Analytics API handlers
  http.get('/api/analytics/students', () => {
    return HttpResponse.json({
      totalStudents: 10,
      activeStudents: 8,
      averageProgress: 75,
    })
  }),

  http.get('/api/analytics/appointments', () => {
    return HttpResponse.json({
      totalAppointments: 50,
      completedAppointments: 35,
      upcomingAppointments: 15,
    })
  }),

  // Auth handlers
  http.get('/api/auth/session', () => {
    return HttpResponse.json({
      user: {
        id: 'test-user-1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'STUDENT',
      },
    })
  }),

  // Rate limiting test handler
  http.post('/api/notifications/test-rate-limit', ({ request }) => {
    const url = new URL(request.url)
    const count = parseInt(url.searchParams.get('count') || '0')
    
    if (count > 50) {
      return new HttpResponse(null, {
        status: 429,
        statusText: 'Too Many Requests',
      })
    }
    
    return HttpResponse.json({ success: true })
  }),
]