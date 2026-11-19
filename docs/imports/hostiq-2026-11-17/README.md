# HOSTiQ deployment snapshot recovery — 17 November 2026

**Status: import pending.** This branch is a safe staging area; no production deployment and no merge into main.

The owner provided four ZIP archives from the previous developer:
- `ZaMaGui_COMPLETE_FLIP_CARDS_HOSTIQ_2026-11-17(2).zip` — main site
- `Business_ZaMaGui_DIRECTORY_v8_READY_TO_UPLOAD_2026-11-17(2).zip` — Business baseline
- `Business_ZaMaGui_v10_FULL_2026-11-17(2).zip` — Business v10 patch/full archive, overlay after v8
- `Business_ZaMaGui_v7_MASTERS_FIXED_2026-11-17(1).zip` — reference only

**Action in Codex:** obtain `ZaMaGui_HOSTIQ_Git_Import_2026-11-19.zip` from the owner, unzip it locally, inspect `README_IMPORT.md` and `SNAPSHOT_MANIFEST.json`. Map `deploy-snapshot/` onto repository root, and `deploy-snapshot/business-site/` onto `business-site/`. Review differences before applying; preserve CI/ops files, review PHP and secrets, do not delete files absent from the archives. Commit vetted files to this branch and open a draft PR.

**Important:** ZIPs are evidence of what the previous developer packaged, not independent proof of the currently deployed HOSTiQ bytes. v10 describes itself as a patch for v9, which was not supplied. Verify production parity before merge. Existing PRs #12/#13/#14 are open and may conflict. Business v10 documents mailto, browser-local account/booking previews; do not claim server-side CRM or real bookings.

No site source files have been imported by this README commit.
