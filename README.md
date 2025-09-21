# Tutoring Calendar Application

A comprehensive tutoring calendar and appointment management system built with Next.js 14, TypeScript, and PostgreSQL.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- Redis 6+
- pnpm 8+ (recommended) or npm

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd tutoring-calendar
   pnpm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your actual values
   ```

3. **Set up the database:**
   ```bash
   # Generate Prisma client
   pnpm prisma:generate
   
   # Run database migrations
   pnpm prisma:migrate
   
   # Seed the database with sample data
   pnpm prisma:seed
   ```

4. **Start the development server:**
   ```bash
   pnpm dev
   ```

5. **Open your browser:**
   - App: http://localhost:3000
   - Health check: http://localhost:3000/api/health
   - Prisma Studio: `pnpm prisma:studio`

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests with UI
pnpm test:ui

# Run tests with coverage
pnpm test:coverage

# Run integration tests
pnpm test:integration

# Run E2E tests
pnpm test:e2e
```

## 🔧 Development

```bash
# Lint code
pnpm lint

# Fix linting issues
pnpm lint:fix

# Format code
pnpm format

# Type check
pnpm typecheck

# Build for production
pnpm build
```

## 📚 Project Structure

```
src/
├── app/                    # Next.js 14 App Router
│   ├── api/               # API routes
│   ├── (auth)/           # Auth pages
│   ├── (dashboard)/      # Dashboard pages
│   └── globals.css       # Global styles
├── components/            # Reusable UI components
├── hooks/                # Custom React hooks
├── lib/                  # Utilities and configurations
│   ├── config/          # Environment and cache config
│   ├── db/              # Database client and utilities
│   └── utils/           # Helper functions
├── services/             # Business logic
└── types/               # TypeScript type definitions
```

## 🗃️ Database

The application uses PostgreSQL with Prisma ORM. Key entities:

- **Users**: Authentication and basic profile info
- **Students/Tutors**: Role-specific profiles and data
- **Appointments**: Scheduling and session management
- **Assignments**: Task management and submissions
- **Notifications**: Email/SMS notifications
- **Analytics**: Progress tracking and reporting

## 🔐 Authentication

Built with NextAuth.js supporting:
- Email/password authentication
- Role-based access control (Student, Tutor, Admin)
- Session management
- Protected routes and API endpoints

## 📊 Features

### For Students
- Browse and book tutor appointments
- View assignments and submit work
- Track learning progress
- Receive notifications and reminders

### For Tutors  
- Manage availability and schedule
- Create appointments for students
- Assign tasks and grade submissions
- View student progress analytics

### For Admins
- User and content management
- System analytics and reporting
- Advertisement management
- System health monitoring

## 🌐 API Endpoints

Key API routes include:

- `GET /api/health` - System health check
- `POST /api/auth/*` - Authentication endpoints
- `GET/POST /api/appointments` - Appointment management
- `GET/POST /api/assignments` - Assignment operations
- `GET/POST /api/notifications` - Notification system

## 🚀 Deployment

### Production Checklist

1. **Environment Variables**: Set all required production env vars
2. **Database**: Run migrations in production
3. **Redis**: Configure production Redis instance  
4. **File Storage**: Set up S3 or similar for file uploads
5. **Monitoring**: Configure error tracking (Sentry)
6. **Domain**: Configure NEXTAUTH_URL and CORS_ORIGIN

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

## 🧰 Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Cache/Queue**: Redis
- **Auth**: NextAuth.js
- **Email**: SendGrid
- **File Storage**: Local/S3
- **Testing**: Vitest, Playwright, Testing Library
- **Deployment**: Vercel (recommended)

## 📞 Support

For development setup issues:

1. Check the health endpoint: `GET /api/health`
2. Verify database connection and migrations
3. Ensure Redis is running
4. Check environment variable configuration

## 📄 License

This project is licensed under the MIT License.

---

## 📋 Default Login Credentials

After running `pnpm prisma:seed`:

- **Admin**: admin@tutoringcalendar.com / admin123
- **Tutor**: tutor@example.com / tutor123  
- **Student**: student@example.com / student123
