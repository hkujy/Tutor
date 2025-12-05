# Development Notes

## Personal Development Log

### Why I Built This
Started this project after struggling with scheduling tutoring sessions manually. Spent way too many hours coordinating calendars via email - figured there had to be a better way.

### Technical Decisions Made Along the Way

#### Authentication
- Went with NextAuth.js because rolling your own auth is a nightmare
- Added rate limiting after reading too many horror stories about brute force attacks
- The 15-minute lockout might be overkill, but better safe than sorry

#### Database Design
- Originally tried to use MongoDB, but switched to PostgreSQL with Prisma
- The appointment overlap logic was tricky - spent a whole weekend debugging timezone issues
- Added soft deletes everywhere because users hate losing data

#### UI/UX Choices
- Skeleton screens everywhere - users hate waiting for blank pages
- Went with Tailwind because writing CSS from scratch is not fun
- The logo implementation was more complex than expected (thanks, Next.js Image optimization)

### Known Issues & Future Improvements
- Redis caching is optional in dev - need to make this cleaner
- The notification system could use webhooks instead of polling
- Mobile responsive design needs work on tablet sizes
- Consider adding dark mode (everyone asks for it)

### Performance Optimizations
- Lazy loading for dashboard components
- Database queries are optimized with proper indexes
- Image optimization through Next.js (when it works!)

---
*Last updated: January 2025 - JY*