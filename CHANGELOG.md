# Changelog

All notable changes to the Tutoring Calendar application will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### 🚀 Planned
- Dashboard simplification (11 tutor tabs → 7, 8 student tabs → 5)
- Notification bell in header
- Improved empty states
- Enhanced loading indicators

## [1.1.0] - 2025-12-23

### ✨ Added
- **Shared Utility Modules**: Created 4 new utility modules to eliminate code duplication
  - `src/lib/utils/constants.ts` - Centralized constants and magic numbers
  - `src/lib/utils/validation.ts` - Shared input validation functions
  - `src/lib/utils/sanitization.ts` - Data sanitization utilities
  - `src/lib/utils/database-errors.ts` - Unified Prisma error handling
- **Chinese Translations**: Added complete translations for:
  - `NotificationManager` - Notification management interface
  - `NotificationPreferencesManager` - Notification settings
  - `TutorAnalytics` - Analytics dashboard
- **Production Build**: Optimized production build with static page generation (28 pages)

### 🐛 Fixed
- **Edge Runtime Compatibility**: Removed Redis dependencies from middleware and auth config
  - Replaced with in-memory rate limiting for Edge runtime compatibility
  - Fixed `charCodeAt` errors during deployment
  - Resolved NextAuth JSON parsing errors
- **Student Dashboard UI**: Fixed missing tab labels
  - Removed `hidden xs:inline` class causing tabs to show only icons
  - Tab names now visible on all screen sizes
- **Middleware Path Issues**: Fixed import paths
  - Updated to use `src/` prefix for all imports
  - Corrected rate limiting function calls
- **Static Asset Serving**: Updated middleware matcher to exclude image files
  - Added exclusions for `.png`, `.jpg`, `.svg`, `.webp`, etc.
  - Fixed logo display issues (partial - still needs locale prefix handling)

### 🔄 Changed
- **Code Refactoring**: Eliminated ~180 lines of duplicate code
  - Refactored `user.repository.ts` to use shared utilities
  - Refactored `student.repository.ts` to use shared utilities
  - Refactored `tutor.repository.ts` to use shared utilities
- **Logo Format**: Changed from SVG to PNG for better Next.js Image compatibility
  - Updated tutor dashboard: `/logo.svg` → `/logo.png`
  - Updated student dashboard: `/logo.svg` → `/logo.png`
- **Rate Limiting**: Switched from Redis to in-memory Map-based rate limiting
  - Middleware: In-memory rate limiting (3000 requests/minute)
  - Auth: In-memory login attempt tracking
  - **Note**: For multi-instance production, consider Upstash Redis or Cloudflare KV

### 📝 Documentation
- Created comprehensive walkthrough of refactoring process
- Documented Edge runtime compatibility fixes
- Added deployment verification steps
- Created simplification plan for dashboard consolidation

### 🔧 Technical Improvements
- **Bundle Optimization**: Lazy loading of heavy components
- **Type Safety**: Improved TypeScript types across repositories
- **Error Handling**: Consistent error messages with entity type parameterization
- **Validation**: Centralized validation logic with reusable functions
- **Sanitization**: Unified data cleaning across all repositories

### ⚠️ Known Issues
- **Logo 404 Error**: Logo not loading due to locale prefix in URL (e.g., `/en/logo.png`)
  - Middleware matcher needs update to handle locale-prefixed static assets
  - Workaround: Direct access to `/logo.png` works, but routed access fails
- **Chinese Tab Layout**: Tutor dashboard tabs display Chinese characters vertically
  - Student dashboard handles Chinese correctly
  - Needs `whitespace-nowrap` CSS fix in tutor dashboard

### 🚀 Deployment
- **Environment**: Production
- **Build Tool**: Next.js 16.0.10 (Turbopack)
- **Process Manager**: PM2
- **Tunnel**: Cloudflare (https://americans-processors-andrews-alternatives.trycloudflare.com)
- **Database**: Local Docker Postgres (port 5433)
- **Status**: ✅ Online and stable

### 📊 Metrics
- **Code Reduction**: ~180 lines of duplicate code eliminated
- **Shared Modules**: 4 new utility modules created
- **Translation Coverage**: 100% (English + Chinese)
- **Build Time**: ~5 seconds compilation + ~560ms static generation
- **Memory Usage**: 58MB (production)
- **Response Time**: <100ms (local), <200ms (via tunnel)

---

## [1.0.0] - 2025-12-21

### 🎉 Initial Release
- Full-featured tutoring calendar application
- Student and tutor dashboards
- Appointment management
- Assignment tracking
- Payment processing
- Notification system
- Analytics and reporting
- Multi-language support (English, Chinese)
- NextAuth.js authentication
- Prisma ORM with PostgreSQL
- Redis caching and rate limiting

---

## Version History

| Version | Date | Description |
|---------|------|-------------|
| 1.1.0 | 2025-12-23 | Code refactoring, bug fixes, Chinese translations |
| 1.0.0 | 2025-12-21 | Initial release |

---

## Migration Notes

### Upgrading from 1.0.0 to 1.1.0

**Breaking Changes**: None

**New Dependencies**: None (removed Redis dependency from Edge runtime)

**Database Migrations**: None required

**Configuration Changes**:
- Rate limiting now uses in-memory storage (no Redis required for middleware)
- For production with multiple instances, implement distributed rate limiting

**Steps to Upgrade**:
1. Pull latest changes: `git pull origin master`
2. Install dependencies: `npm install`
3. Build production: `npm run build`
4. Restart server: `pm2 restart tutoring-calendar`

---

*For detailed technical documentation, see the [walkthrough](file:///.gemini/antigravity/brain/ff3f42e7-b7d4-4f13-acd9-b1b434ab0aa5/walkthrough.md)*
