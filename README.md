# Tutoring Calendar Application

A comprehensive tutoring calendar and appointment management system built with Next.js 16, TypeScript, and PostgreSQL.

## 🌟 Recent Updates (v1.1.0)

- ✅ **Code Refactoring**: Eliminated ~180 lines of duplicate code with shared utility modules
- ✅ **Edge Runtime Compatible**: Removed Redis dependencies from middleware for better performance
- ✅ **Complete Chinese Translations**: Full internationalization support
- ✅ **Production Ready**: Optimized build with 28 static pages generated
- ✅ **Bug Fixes**: Fixed student dashboard UI and middleware compatibility issues

See [CHANGELOG.md](./CHANGELOG.md) for detailed release notes.

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- pnpm 8+ (recommended) or npm

**Note**: Redis is optional (only needed for distributed rate limiting in multi-instance deployments)

### Installation

1. **Clone and install dependencies:**

   ```bash
   git clone <repository-url>
   cd tutoring-calendar
   npm install
   ```

2. **Set up environment variables:**

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your actual values
   ```

3. **Set up the database:**

   ```bash
   # Generate Prisma client
   npm run prisma:generate

   # Run database migrations
   npm run prisma:migrate

   # Seed the database with sample data
   npm run prisma:seed
   ```

4. **Start the development server:**

   ```bash
   npm run dev
   ```

5. **Open your browser:**
   - App: http://localhost:3000
   - Health check: http://localhost:3000/api/health
   - Prisma Studio: `npm run prisma:studio`

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e
```

---

## 🔧 Development

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Type check
npm run typecheck

# Build for production
npm run build

# Start production server
npm start
```

---

## 📚 Project Structure

```
src/
├── app/                    # Next.js 16 App Router
│   ├── [locale]/          # Internationalized routes
│   │   ├── student/      # Student dashboard
│   │   ├── tutor/        # Tutor dashboard
│   │   └── login/        # Authentication
│   ├── api/               # API routes
│   └── globals.css        # Global styles
├── components/             # Reusable UI components
│   ├── calendar/         # Appointment and calendar components
│   ├── dashboard/        # Dashboard widgets
│   ├── availability/     # Availability management
│   └── ui/               # Base UI components
├── contexts/              # React contexts (Auth, Theme)
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities and configurations
│   ├── auth/             # NextAuth configuration
│   ├── db/               # Prisma client
│   ├── repositories/     # Data access layer
│   └── utils/            # Shared utilities (NEW in v1.1.0)
│       ├── constants.ts       # Centralized constants
│       ├── validation.ts      # Input validation
│       ├── sanitization.ts    # Data sanitization
│       └── database-errors.ts # Error handling
├── i18n/                  # Internationalization
│   └── routing.ts        # Locale routing config
└── types/                 # TypeScript type definitions
```

---

## 🗃️ Database

The application uses PostgreSQL with Prisma ORM. Key entities:

- **Users**: Authentication and basic profile info
- **Students/Tutors**: Role-specific profiles and data
- **Appointments**: Scheduling and session management
- **Assignments**: Task management and submissions
- **Notifications**: Email/SMS notifications
- **Lecture Hours**: Time tracking and billing
- **Payments**: Payment history and invoicing

---

## 🔐 Authentication

Built with NextAuth.js supporting:

- Email/password authentication
- Role-based access control (Student, Tutor, Admin)
- Session management with JWT
- Protected routes and API endpoints
- In-memory rate limiting (Edge runtime compatible)

---

### Tutoring Calendar

**Version**: 1.2.0  
**Last Updated**: 2025-12-25

A comprehensive tutoring management platform with real-time updates, built with Next.js 16, TypeScript, Prisma, and Socket.IO.

## ✨ Features

### Core Functionality
- 📅 **Appointment Scheduling**: Book, reschedule, and manage tutoring sessions
- 👥 **User Management**: Separate dashboards for tutors and students
- 📊 **Analytics Dashboard**: Track hours, earnings, and session statistics
- 💰 **Payment Tracking**: Monitor lecture hours and payment intervals
- 📝 **Assignment Management**: Create and track homework assignments
- 🔔 **Notification System**: In-app and email notifications

### Real-Time Features (NEW in v1.2.0)
- ⚡ **Live Appointment Updates**: Instant synchronization across all connected users
- 🔄 **WebSocket Integration**: Socket.IO for reliable real-time communication
- ✨ **Visual Indicators**: Pulse animations for real-time changes
- 🔌 **Auto-Reconnection**: Resilient connections with automatic retry
- 🎯 **Targeted Broadcasting**: Events sent only to affected users

### Technical Features
- 🌐 **Internationalization**: Full English and Chinese language support
- 🎨 **Theme System**: Light and dark mode with smooth transitions
- 🔐 **Authentication**: Secure NextAuth.js integration
- 📱 **Responsive Design**: Mobile-first, works on all devices
- ⚡ **Performance**: Optimized with Redis caching and database indexes
- 🧪 **Testing**: Comprehensive unit and integration tests
- 🗓️ **Availability**: Set available time slots
- 📅 **Appointments**: View and manage bookings
- ➕ **Create**: Create new appointments
- 📈 **Analytics**: Performance insights and trends
- 📝 **Assignments**: Create and grade assignments
- 💳 **Payments**: Payment tracking and history
- 🔔 **Notifications**: Alerts and reminders
- ⚙️ **Settings**: Account preferences

### For Admins

- User and content management
- System analytics and reporting
- System health monitoring

---

## 🌐 Internationalization

- **Supported Languages**: English (en), Chinese (zh)
- **Translation Coverage**: 100%
- **Implementation**: next-intl with locale routing
- **Locale Switching**: Dynamic language switcher in header

---

## 🌐 API Endpoints

Key API routes include:

- `GET /api/health` - System health check
- `POST /api/auth/*` - Authentication endpoints (NextAuth)
- `GET/POST /api/appointments` - Appointment management
- `GET/POST /api/assignments` - Assignment operations
- `GET/POST /api/notifications` - Notification system
- `GET /api/analytics` - Analytics data
- `GET/POST /api/lecture-hours` - Time tracking
- `GET/POST /api/tutors` - Tutor management

---

## 🚀 Deployment

### Current Production Setup

- **Environment**: Production
- **Build**: Next.js 16.0.10 (Turbopack)
- **Process Manager**: PM2
- **Tunnel**: Cloudflare
- **URL**: https://americans-processors-andrews-alternatives.trycloudflare.com
- **Database**: Local Docker Postgres (port 5433)
- **Status**: ✅ Online

### Production Checklist

1. **Environment Variables**: Set all required production env vars
2. **Database**: Run migrations in production
3. **File Storage**: Set up S3 or similar for file uploads (optional)
4. **Monitoring**: Configure error tracking (Sentry recommended)
5. **Domain**: Configure NEXTAUTH_URL and allowed origins

### Build and Deploy

```bash
# Build for production
npm run build

# Start with PM2
pm2 start npm --name "tutoring-calendar" -- start

# Save PM2 configuration
pm2 save
```

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

---

## 🧰 Tech Stack

- **Frontend**: Next.js 16, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL 14+
- **Auth**: NextAuth.js v4
- **Internationalization**: next-intl
- **Email**: SendGrid (optional)
- **File Storage**: Local/S3 (optional)
- **Testing**: Vitest, Playwright, Testing Library
- **Process Manager**: PM2
- **Deployment**: Vercel / PM2 + Cloudflare Tunnel

---

## 📞 Support

For development setup issues:

1. Check the health endpoint: `GET /api/health`
2. Verify database connection and migrations
3. Check environment variable configuration
4. Review logs: `pm2 logs tutoring-calendar`

---

## 📄 License

This project is licensed under the MIT License.

---

## 📋 Default Login Credentials

After running `npm run prisma:seed`:

- **Admin**: admin@tutoringcalendar.com / admin123
- **Tutor**: tutor@example.com / tutor123  
  *(Demo: Sarah Johnson, John Doe)*
- **Student**: student@example.com / student123  
  *(Demo: Alex Smith, Emily Chen)*

---

## 🔮 Roadmap

### v1.2.0 (Planned)
- Dashboard simplification (reduce tab count)
- Notification bell in header
- Improved empty states
- Enhanced loading indicators
- Fix logo 404 error
- Fix Chinese tab layout

### v2.0.0 (Future)
- Real-time chat between students and tutors
- Video call integration
- Mobile app (React Native)
- Advanced analytics dashboard
- Payment gateway integration

---

**Version**: 1.1.0  
**Last Updated**: 2025-12-23
