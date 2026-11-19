# ZaMaGui — shared design integration (04.11.2026)

## Source of truth
- Main ecosystem pages: repository root + \`assets/\`.
- Canonical CSS: \`assets/site.css\`, \`assets/vivid.css\`, \`assets/approved.css\`.
- Canonical header markup: root \`index.html\`.
- Approved original artwork: \`assets/approved/\`.
- Business source: \`business-site/{uk,ru,en}/\`.
- Business-only styles and behavior: \`business-site/assets/brand-overrides.css\` and \`brand-controls.js\`.

No phone screenshots are used as UI or hero images.

## What the build does
\`python3 ops/build-business-shared.py\`

This produces \`dist/business-site/\` without editing source pages. It retains all 36 localized Business pages, their services, forms, policies and route structure, and injects:
- Exact CSS source files from the main ecosystem.
- The main site's actual header HTML, connected to Business contact and main-site direction links.
- The original approved high-resolution WebP artwork, compressed as shipped in the source repository.
- Responsive hero layouts and six consistent cards on the three Business homepages.
- Theme, mobile menu and language controls.
- Service-specific contact URLs, preserving the selected service in the message.

\`python3 ops/build-business-shared.py --in-place\` modifies business files only in the ephemeral GitHub Actions checkout; the controlled FTPS workflow runs it before publishing.

## QA gates
PR workflow \`ZaMaGui Business - shared design QA\` compiles the build and checks 15 browser scenarios (UK/RU/EN × 320/390/768/1440/1920) covering main page, CTA context, contact page, header and overflow.

These tests must actually pass before anyone authorizes deployment. Manual review should additionally check dark theme, real form submission, full content, design likeness, HTTPS, privacy, SEO, and availability on mobile devices.

## Release and rollback
1. Wait for PR QA and inspect its artifacts.
2. Review generated \`dist/business-site/\` on staging, with test-only credentials.
3. Confirm email delivery of a genuine intake form and reference ID from the production-compatible PHP backend.
4. Verify backup and release permissions; keep the existing FTPS root-proof and rollback code.
5. Merge only after review. A business production workflow is manually triggered with confirmation \`DEPLOY_BUSINESS\`.
6. Run smoke tests against the published domain, and restore backup if anything breaks.

The PR also adds the main domain's missing `api/csrf.php` and `api/lead.php` and updates the client-side acknowledgement to say accepted for processing (not delivered to the inbox). These endpoints need a real hosting acceptance test. The main deployment workflow is not changed. Neither website has been deployed by this PR.

The GitHub QA workflow generates **two separate downloadable artifacts** after passing: the canonical main-site HOSTiQ ZIP and the business-site artifact. Do not upload either on top of another domain's Document Root. Email delivery, CRM integration, registration, payments and live hosting QA remain unverified.
