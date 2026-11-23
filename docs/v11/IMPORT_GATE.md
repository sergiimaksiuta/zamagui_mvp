# ZaMaGui V11 — source import gate (2026-11-23)

Status: **DRAFT — DO NOT MERGE OR DEPLOY** until the verified V11 FULL release has been imported into this branch from the owner-provided archive and tested.

## Source of truth
- Based on user-supplied `ZaMaGui_STAGING_V10_STRATEGY_CONTENT_FULL_2026-11-22`, SHA256 `8caef1a5bdf9606e37839db45f6d78a0643787494f4998c878805af4241c65e9`.
- Current imported GitHub `main` is older than the approved V10 staging archive. Do not treat `main` as the live HOSTiQ baseline.
- V11 source and scripts are packaged in `ZaMaGui_STAGING_NAVIGATION_V11_FULL_2026-11-23.zip` (available to the owner in the ChatGPT conversation).

## Local evidence
- 95 logical routes × 2 locales = 190 PHP-SSR pages; 190/190 local route checks PASS.
- Image asset decode 132/132 PASS; PHP 9/9 syntax PASS; JS syntax PASS.
- Navigation: five top-level groups, one SSR source for desktop/mobile/context, same deep route UK↔EN.
- V11 patch includes 33 changed/new files; strict V10 SHA guard; patch-over-baseline exact FULL file parity and rollback exact V10 PASS.
- Production-target archive strips staging noindex/canonical only where appropriate, retains noindex for application forms.

## Owner import workflow (must happen before PR review)
1. Download verified V11 FULL ZIP from the ChatGPT result and extract on a machine with access to GitHub.
2. Run `scripts/sync_github.sh` from the extracted V11 folder with:
   `ZMG_SOURCE_DIR=/absolute/V11/full/folder ZMG_GIT_BRANCH=release/zamagui-navigation-v11-2026-11-23 ZMG_APPROVE_GIT_PUSH=YES bash scripts/sync_github.sh`.
3. Verify commit changed-file list contains the complete V11 site (PHP/HTML/CSS/JS/assets), test scripts and docs.
4. Run PHP lint, QA, code review, Playwright browser matrix and GitHub Actions.
5. Approve staging after remote backup/root proof, then production after staging smoke and mail confirmation. `business.zamagui.com` redirects require separate URL map and explicit operator configuration.

## Release gate
NO-GO for production until: independent browser screenshots/a11y, actual HOSTiQ rewrite + SMTP/mailbox test, real remote docroot proof, source commit & CI, staging acceptance, verified production backup and smoke.
