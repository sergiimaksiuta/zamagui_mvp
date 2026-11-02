# ZaMaGui platform architecture — PostgreSQL first

Status: architecture and migration proposal only. **No live database, billing, credentials or new domain was created.**

## Recommendation

1. Keep `zamagui.com` static on HOSTiQ for the first live Ecosystem release.
2. For the dynamic business catalog, lead capture, project progress and primary financial reporting, use **one Supabase PostgreSQL database** plus a backend API. PostgreSQL offers transactions, reporting, constraints, relational structure and `jsonb` for varying product/partner metadata.
3. Use Supabase Auth only when user accounts are needed; protect data with Row Level Security (RLS), least-privilege grants and server-side secrets. Do not expose `service_role` or database connection strings in HTML or client JS.
4. Cache static site assets with HTTP caching/CDN. Add Upstash Redis (rate limits, deduplication, task locks, high-read transient data) only if measurement proves caching necessary; free tier is sufficient for a pilot. Avoid adding a standalone NoSQL database at launch. PostgreSQL `jsonb` covers most initial document-like data.
5. AWS account, RDS, DynamoDB, ElastiCache and ECS would increase security, cost and operations surface. Keep provider-portable SQL and migrate to AWS only if specific workloads justify it.

## Initial data design

- `zmg_services`: six business directions and AI as cross-cutting capability, localized offers for uk/ru/en, optional **unverified** pricing left null, publication status.
- `zmg_projects`: actual verified stage/progress per initiative, publication flag for website roadmap and dashboard.
- `zmg_leads`: contact requests with service/project source and privacy notice version. Private to backend. Never log message, phone or email in GitHub Actions.
- `zmg_finance_entries`: actual/forecast/commitment as separate types. Financial dashboard must distinguish these; amounts are never inferred from public form submissions.
- `zmg_audit_events`: protected metadata about operational changes (no passwords, raw messages or sensitive personal data).

`supabase/migrations/20261102190000_initial_core.sql` prepares these tables with default-deny client permissions. This migration **has not been executed or tested on PostgreSQL**. Before production, execute against an isolated test project and add role-based policy tests for anon/authenticated/service access and data retention.

## Suggested allocation

| Component | Pilot | Production option |
|---|---|---|
| Main static site | Existing HOSTiQ | Existing HOSTiQ / versioned static hosting later |
| PostgreSQL | Supabase Free for test data only | Supabase Pro from $25/month, no inactivity pausing |
| API | A hosted server-side app/Edge Functions | Managed app/Edge Functions with secrets and logging |
| Auth | Not required for public business catalog | Supabase Auth + approved roles when protected apps ship |
| Cache | Browser caching and CDN headers | Upstash Redis only for measured need |
| NoSQL | None | Only for a proven access pattern Postgres cannot serve economically |
| Backups | Encrypted site backups already working | Database backups + tested recovery; separate from site archive |

Verified prices and quotas must be rechecked before spending; do not start any paid subscription without approval.

## Production launch sequence for data

1. Agree live services and pricing: publish only confirmed offers, not plans or placeholder revenue.
2. Create Supabase **test** project with a dedicated organization, secure MFA and billing guardrails.
3. Store DB endpoint/secrets only in secure backend environment and GitHub environment secrets if appropriate; never in public files.
4. Test migration in an isolated database, including RLS allow/deny tests using anon and authenticated roles.
5. Build one lead submission API with input validation, abuse protection, rate limit, consent/privacy information, logs without PII and idempotency.
6. Write happy-path and negative-path integration tests; route test forms to an isolated non-production database.
7. Configure real backups/PITR according to plan, prove restoration, least-privilege credentials, key rotation and retention.
8. Deploy `business.zamagui.com` after DNS, HTTPS, API and monitoring are verified. Distinguish draft services from currently offered services.
9. Then implement project progress and finance analytics from recorded transactions, not fabricated numbers.
10. Add partner marketplace and logged-in experiences only after the permission and audit model is proven.

## Personal-data boundaries

Do not put triad psychological notes, children's information or sensitive personal records into the public service/catalog schema. When those products are approved, design separate protected data domains, retention and role policies plus consent/notice, access logs, deletion/export and incident procedures.

## Current state

This PR is **not** part of the current three-page HOSTiQ release. No paid AWS, Supabase or Redis resources have been created. All database and application work remains planned until a provider and operating model are approved.
