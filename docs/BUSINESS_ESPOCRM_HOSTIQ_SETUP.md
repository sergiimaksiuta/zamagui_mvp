# ZaMaGui Business — EspoCRM on HOSTiQ HQ40
Status: integration prepared in a feature branch. NOT INSTALLED and NOT VERIFIED on HOSTiQ.

## Install CRM
1. cPanel > Domains: create `crm.zamagui.com` with a separate Document Root. Do not use `business.zamagui.com` or `zamagui.com`.
2. cPanel > Softaculous Apps Installer > ERP > EspoCRM. Verify that EspoCRM actually appears in this account. If missing, stop and confirm hosting requirements with HOSTiQ.
3. Verify PHP >=8.3, required PHP extensions, MySQL/MariaDB version and available storage/memory before installation. Configure HTTPS. Install with a strong admin password and MFA if available.
4. cPanel > Cron Jobs: use the cron command suggested by EspoCRM's installation/admin page, adjusted to the exact installed path and hosting limits; verify scheduled job execution in CRM.
5. Create a real, tested mailbox `business@zamagui.com` and configure outbound SMTP for notifications. Enable backups (files + DB) and test restore.

## API integration (after CRM installation)
1. EspoCRM > Administration > Roles: create `website-leads`, grant **Lead: create only** (and only any permissions required for the create request). No delete, export, users or settings.
2. Administration > API Users: create dedicated API user `zmg-business-site`, choose API Key and attach the limited role.
3. In cPanel File Manager, outside any public domain root, create `/home4/dataforg/zmg-private/crm.php`. Verify this is truly outside ALL domain Document Roots.
   File contents:
   ```php
   <?php
   return [
       'url' => 'https://crm.zamagui.com',
       'api_key' => 'PASTE_REAL_API_KEY_HERE',
   ];
   ```
   Never commit this file, share its content in chat, or store it in public_html.
4. Restrict `crm.php` permissions to the minimum supported by HOSTiQ (e.g., 600 when PHP runs as the same user).
5. Deploy the integration only after the CRM is reachable and configured. Its PHP endpoint automatically detects the protected config. When present, requests are saved to EspoCRM and a successful response is returned only when EspoCRM gives a created record ID. If EspoCRM is unavailable, the endpoint returns 503 (no misleading success). When config is absent, existing mail() fallback stays in use.
6. Run a real end-to-end test with consent: submit one contact form; verify CRM > Leads has matching name, email, category and description. Test bug-bounty form separately. Check email alerts if configured.
7. Ensure access policies and consent/retention/privacy notice are reviewed before collecting real personal data. For Kids use guardian contact data only; never request children's detailed information on general lead forms.

## Operational constraints
- The GitHub FTPS workflow only publishes `business-site/`, not the CRM installation or secrets.
- Never mirror the CRM installation through the Business FTP account.
- Live CRM, mailbox delivery, cPanel capabilities and API permissions have NOT been verified.
- PHP mail fallback is NOT a CRM and `mail()===true` does NOT prove delivery.
- Keep a clear backup and rollback plan before changing live intake.

## Acceptance criteria
- [ ] CRM HTTPS access and SSL valid
- [ ] CRM login restricted and admin MFA reviewed
- [ ] PHP and DB compatible with installed version
- [ ] Scheduler runs (Cron)
- [ ] Backup and restore tested
- [ ] Dedicated Lead-create API user works
- [ ] Server-side CRM config outside every document root
- [ ] Business form → Lead created in CRM, receives ID
- [ ] Email/notification delivered to responsible person
- [ ] Bug-report form reaches correct queue/type
- [ ] Invalid/abusive requests rejected, no passwords in logs
