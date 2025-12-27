# Tutoring Calendar: Application Summary

The Tutoring Calendar is a comprehensive, multi-tenant platform designed to streamline the connection between tutors and students. It provides specialized dashboards and tools for three distinct user roles: **Tutors**, **Students**, and **Administrators**.

## 1. For Tutors: Complete Business Management
The Tutor Dashboard serves as a central hub for managing an independent tutoring practice.

*   **Availability Management**: Define recurring weekly schedules and add specific "exceptions" to block off time for holidays or personal breaks.
*   **Hourly Rate & Financials**: 
    *   **Global Rates**: Set a standard hourly rate for new students.
    *   **Student-Specific Pricing**: Customize rates for individual students.
    *   **Analytics**: Monitor earnings growth, session counts, and student retention metrics.
*   **Assignment Management**: Create academic tasks, assign resources, set deadlines, and monitor student completion status.
*   **Student Roster**: Unified view of all connected students, including their specific subjects and agreed-upon rates.

## 2. For Students: Personalized Learning Journey
The Student Dashboard focuses on discovery and ease of booking.

*   **Tutor Discovery**: Searchable catalog with filtering by subject (Mathematics, Music, Spanish, etc.) and detailed tutor profiles.
*   **Intelligent Booking Flow**: 
    *   Direct initiation from tutor profiles.
    *   Multi-step booking form (Subject -> Date -> Time Slot -> Notes).
*   **Session Management**: Schedule view for upcoming and past appointments with built-in cancellation workflows.
*   **Assignments & Progress**: Integrated view of tasks assigned by tutors to keep learning organized between sessions.

## 3. Core System Features
*   **Multi-Language Support**: Full internationalization for **English** and **Chinese**.
*   **Real-time Notifications**: Integrated system for booking alerts, cancellations, and assignment updates.
*   **Secure Authentication**: NextAuth-powered login and session management with rate-limiting protection.
*   **Modern UI**: Premium "glassmorphism" design with full support for Light and Dark modes across all devices.

## 4. Reliability & Testing
*   **Multi-Agent Simulation**: Advanced testing suite using AI "agents" to simulate concurrent users, ensuring booking flows and performance remain stable under heavy load.
*   **Automated Infrastructure**: Type-safe database management via Prisma and a comprehensive seeding system for instant realistic environments.
