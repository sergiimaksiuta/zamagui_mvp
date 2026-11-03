# ZaMaGui Business — GitHub + HOSTiQ FTPS deployment

## Confirm first
1. In cPanel > Domains, business.zamagui.com has its own Document Root.
2. In cPanel > FTP Accounts > Configure FTP Client, record the **FTP server hostname**, exact account username, and port. Confirm FTPS (explicit TLS) support with provider or by testing a client with certificate verification ON.
3. Confirm FTP account root is the **business.zamagui.com Document Root**. This workflow uploads to `/` inside the FTP account.
4. Confirm `business@zamagui.com` exists and receives mail BEFORE activating email CTAs. Otherwise replace it with a verified business inbox in business-site/index.html.

## GitHub settings
Repository: sergiimaksiuta/zamagui_mvp
1. Add the files from this ZIP preserving their relative paths, on a feature branch, then open a Pull Request.
2. Settings > Environments > New environment: `business-production`. Configure required reviewers where supported. Do not publish before manual approval.
3. In `business-production` environment secrets create:
   - BUSINESS_FTPS_HOST — exact FTP server hostname with trusted certificate (not ftp:// prefix)
   - BUSINESS_FTPS_USER — exact username as in cPanel FTP Accounts
   - BUSINESS_FTPS_PASSWORD — new password kept private
4. IMPORTANT: This workflow targets default FTPS port 21. If your provider requires a different port, adapt the lftp invocation after validating the correct setting; do not switch to plaintext FTP.
5. Merge approved PR into main only after review.
6. Actions > ZaMaGui Business - FTPS release > Run workflow on main > confirmation: DEPLOY_BUSINESS.
7. Check job status and https://business.zamagui.com/ manually. A green check indicates the workflow passed; it is not proof that lead intake works.

## Security & scope
- Never paste secrets into chat, issue comments, repository files or Actions logs.
- Initial deploy is manual only, never triggered by pushes.
- Workflow does NOT delete remote files. It only changes files represented in `business-site/`.
- FTPS mirrors multiple files, not an atomic blue-green deployment. Existing remote files may remain. Confirm a backup and staging before extending this to production-grade rollback.
- Existing zamagui.com workflows are untouched.
- Avoid storing personal data in business-site/ or public document roots.
- Separate PHP-backed lead form, SMTP test, CRM integration and rollback automation require subsequent setup and verification.

## Acceptance checks
- FTPS TLS certificate validation passes (no insecure fallback)
- GitHub environment permissions checked
- Actual FTP account root checked
- Homepage loads via HTTPS after deployment
- RU/UK/EN page renders at mobile and desktop widths
- Business inbox tested with a real message
