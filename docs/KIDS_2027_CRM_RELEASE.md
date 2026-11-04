# ZaMaGui Kids 2027 + Pipedrive CRM — runbook
Release target: **15 January 2027**. Two age tracks (12–16, 17–22), 12-month and 24-month programmes. The curriculum, milestones and schedule shown are an educational design proposal. Pricing, teachers, class hours, capacity and confirmed places are **not** represented as final until approved.

## Public routes
- UK: \`/kids-2027.html\`
- RU: \`/ru/kids-2027.html\`
- EN: \`/en/kids-2027.html\`
- Business links: \`https://zamagui.com/{locale}/kids-2027.html\`
- Existing Kids landing pages also link to the programme.

## Server CRM integration
The main domain and Business each need **their own server-side** \`ZMG_PIPEDRIVE_API_TOKEN\` configured on HOSTiQ. Set using a protected hosting environment variable or a configuration file **outside the public Document Root** loaded by the PHP runtime. Never commit tokens, embed them into HTML/JS, pass them in URLs or publish them in GitHub Actions logs.

Endpoints on main: \`/api/csrf.php\`, \`/api/lead.php\`, \`/api/kids-preregister.php\`, shared helper \`/api/_crm.php\`. On Business: \`/api/csrf.php\`, \`/api/lead.php\`, helper \`/api/_crm.php\`.

Request path: browser form → validated PHP session/CSRF → Pipedrive Person (v2) → Pipedrive Lead (v1) → linked Lead Note → success reference. Retries reuse state for up to 7 days to prevent duplicates. If CRM is not configured or fails, return 503 and show an honest error; no false confirmation. Note completion is part of success.

Requires PHP 8+ with extensions \`curl\` and \`json\`, HTTPS, writable private system temporary directory and outbound connections to \`https://api.pipedrive.com\`. **Verify** extension, environment injection and external HTTP access on HOSTiQ. Read-only testing should not submit real contacts.

References:
- https://developers.pipedrive.com/docs/api/v1/Persons
- https://developers.pipedrive.com/docs/api/v1/Leads
- https://developers.pipedrive.com/docs/api/v1/Notes
- https://pipedrive.readme.io/docs/core-api-concepts-authentication

## CRM workflow
Recommended lead title tags: \`ZaMaGui Kids 2027 | 12–16 | 12m | Jan 15\` etc.
Recommended pipeline handling (human operations):
1. **New pre-registration** — contact saved, CRM reference returned.
2. **Contact planned** — assign owner and target reply time.
3. **Discovery scheduled** — parent/student meeting.
4. **Track recommended** — academic level and duration agreed.
5. **Offer sent** — written terms, price, timetable and safe-guarding policy.
6. **Confirmed** — signed agreement and any required parental consent.
7. **Onboarded** — age-appropriate access; no public child profiles.
8. **Later / unavailable** — permitted follow-up or closed.

No automatic deal conversion or claim of payment. Pipedrive Leads Inbox is used until the sales process is verified.

## Data protection and minors
Only collect the adult applicant name, email, optional phone, participant age (number, not date of birth), age track, duration and programme interests.
- Ages 12–17: legal representative submits the application.
- Ages 18–22: learner may apply directly.
- Do not collect under-18 names, birth dates, school names, photos, health data or documents in a public form.
- Contact consent applies only to response about the requested programme. Marketing opt-in would be separate.
- Do not publish testimonials, outcomes, mentors, partner commitments, scholarships or prices unless approved and evidenced.
- Before launching in applicable jurisdictions, review data-processing agreement with CRM provider, retention/deletion procedure, parental consent and cross-border transfer notice.

## Release process, production-first MVP
1. Source code is in Git; changes through PR and automated QA.
2. Build independent ZIP patches **for main and Business**, overlay without deleting unrelated files.
3. Verify backup and each cPanel Document Root.
4. Publish main ZIP to \`zamagui.com\`, Business ZIP to \`business.zamagui.com\`.
5. Validate HTTPS, links, 3 languages, dark/light themes, form invalid paths and confirmed receipt of an authorized test lead in Pipedrive. Remove test lead when finished.
6. Record commit SHA, deployment status and rollback archive. If any critical regression occurs, restore last known-good copy.

## Actual readiness
Source: implemented; request validation: implemented; Pipedrive authenticated API: coded.
Acceptance is **pending** on server token, real end-to-end lead verification, tested deletion process, legal review and browser workflow passing. No real registration has been completed by this change.
