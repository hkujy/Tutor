# Suggested Improvements & Rationale

This document lists high-impact improvements applied to the planning docs and additional suggestions for a smoother build and scale.

## Implemented Improvements

1. API conventions and idempotency (P0)

- Added global API conventions (auth, pagination, versioning, error format).
- Introduced `Idempotency-Key` header for booking and resource-creating POSTs to prevent duplicates.
- Documented booking conflict errors (409 SLOT_TAKEN).
  - Owner: Backend
  - Dependencies: Redis (for idempotency key store), DB transactions

2. Calendar sync integration endpoints (P1)

- Added endpoints to connect/disconnect Google Calendar and receive webhooks for push updates.
- Sets the stage for Outlook/Microsoft integration later.
  - Owner: Backend
  - Dependencies: Google OAuth credentials, webhook endpoint hosting

3. Notification preferences (P0)

- Added `notification_preferences` table and Prisma model.
- Added endpoints to get/update notification preferences.
- Documented abuse protections and per-user SMS caps.
  - Owner: Backend, Product
  - Dependencies: DB migration

4. Project plan enhancements (P1)

- Frontend PWA/offline support for assignments.
- Backend idempotency using Redis.
- Security: audit logging, secret management.
- Roadmap: calendar sync in Phase 4; reminder scheduler in Phase 3.
  - Owner: Full stack
  - Dependencies: Service worker, Redis, Sentry

## Additional Recommendations

1. Testing strategy (P0)

- Unit tests: business rules (booking conflicts, time zone conversion, reminders computation).
- Integration tests: API routes + DB via test containers.
- E2E tests: Playwright covering booking flow, tutor availability, assignment submission.

2. Timezone & DST correctness (P0)

- Store all times in UTC, compute display using IANA tz.
- Add regression tests for DST boundary cases.

3. Performance & cost controls (P1)

- Queue outbound emails/SMS; use rate limits and retry with backoff.
- Cache public availability results for short TTL to reduce DB load.

4. Observability (P1) (COMPLETED ✅)

- Correlation IDs on requests, structured logs, and SLO dashboards for key flows (booking success rate, reminder send rate).

5. Security hardening (P0)

- Add Content Security Policy (CSP) and strict cookie settings.
- Rotate API keys and use short-lived tokens for third-party integrations.

6. Data governance (P1)

- Add data retention policies for notifications and audit logs.
- Implement user data export/delete (GDPR) utilities.

7. Accessibility & i18n (P1)

- Include an accessibility checklist in PR templates.
- Extract strings for translation readiness from day 1.

8. Product polish (P2)

- Allow tutors to define booking lead times and cancellation windows.
- Support buffer times between sessions.
- Optional double-confirmation workflow for new students.

## Risks & Mitigations

- Idempotency store contention or memory growth (Mitigation: TTL keys, bounded retention, Redis eviction policy).
- SMS cost overruns (Mitigation: hard daily caps per user, aggregate quotas, alerting).
- Calendar webhook reliability (Mitigation: periodic backfill/sync, dead-letter queues, retries with jitter).
- DST/timezone edge cases causing booking errors (Mitigation: UTC storage, library-standard conversions, DST unit tests).
- PWA offline data staleness (Mitigation: background sync, clear versioning, cache invalidation on login).

## Acceptance Criteria Upgrades

- Booking creates exactly one appointment when called with the same Idempotency-Key, even under concurrent load.
- Reminders are sent exactly once per channel per appointment, respecting user preferences.
- Availability conflicts are prevented server-side with transactional checks.
- Calendar sync recovers from webhook outages via periodic backfill.

## Next Steps (Actionable)

1. Create DB migration for `notification_preferences` and run locally. (COMPLETED ✅)
2. Implement Redis-based idempotency middleware for booking endpoint. (COMPLETED ✅)
3. Add Playwright E2E: student books slot → receives confirmation. (COMPLETED ✅)
4. Add unit tests for DST edge dates (e.g., 2025-03-30/2025-10-26) in target locales. (COMPLETED ✅)
5. Implement preferences UI stub (toggle email/SMS, reminder timing) in settings. (COMPLETED ✅)
6. Set SMS per-user daily cap and global budget thresholds with alerts. (COMPLETED ✅)
