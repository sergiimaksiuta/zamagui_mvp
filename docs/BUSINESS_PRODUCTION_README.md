# ZaMaGui Business production candidate

36 localized pages plus root redirect, 18 service entries, 18 venture directions, design system, contact and bug report forms, PHP mail transport.

This is a candidate, not a verified production deployment. FTPS secrets, public-root verification, HOSTiQ PHP `mail()` delivery and business@zamagui.com mailbox must be tested before announcing lead capture. Partner availability and service terms remain subject to confirmation. Staging, automated rollback and live browser QA are further release gates.

Controlled deployment: merge the reviewed branch, configure the `business-production` GitHub environment, then manually launch the `ZaMaGui Business - controlled FTPS release` workflow with confirmation `DEPLOY_BUSINESS`. The workflow performs a one-time proof that its FTP root maps to https://business.zamagui.com/ before uploading. It cannot provide atomic blue-green on shared hosting.
