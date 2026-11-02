# ZaMaGui — controlled three-file Ecosystem release

**Manual-only release. Merging this PR does not publish anything.**

## Release scope

Exactly three pages: `ecosystem.html`, `ru/ecosystem.html`, `en/ecosystem.html`. The existing `assets/zm-r11.js` is reused. The workflow does **not** replace `.htaccess`, server-only directories, backend APIs, databases or any other pages.

## Prerequisites

1. SSH host identity was independently verified using authenticated cPanel and matched with the Mac.
2. Your age recovery key has a protected off-device copy.
3. Run the encrypted backup workflow, download the archive to Mac and verify checksum/decryption/restore. Record the resulting `backup_run_id`, which must be less than 24h old at deployment.
4. Review the public-only dry-run and ensure the **only** pending updates are the three ecosystem pages.
5. Source QA and Browser QA for current `main` must pass.
6. Review/merge the PR adding the release automation. The manual release requires a separate explicit action.

## Release procedure

Open GitHub Actions → **ZaMaGui - Controlled ecosystem release** → **Run workflow** on `main`.

- `backup_run_id`: the GitHub run number ID of the tested successful encrypted backup.
- `approval`: type `DEPLOY_THREE_ECOSYSTEM_PAGES`.

Only the three approved files are placed in a private staging directory outside the webroot. Before writes, the original three files are saved in `/home4/dataforg/.zamagui-releases/<release-workflow-run-id>/original/`. Each new file is installed by rename within the same filesystem, and the resulting remote bytes and public HTTPS pages are checked. Failure causes an attempted restore.

## Manual rollback

GitHub Actions → **ZaMaGui - Manual ecosystem rollback**, enter the **release** workflow run ID (not backup run ID), and `ROLLBACK_THREE_ECOSYSTEM_PAGES`.

The script refuses to overwrite files modified independently since the release. Recovery snapshots remain in the private account directory for manual inspection.

## Important limits

- If the runner or SSH process is killed, automatic rollback is not guaranteed. Use the manual rollback action or your tested offline backup.
- Three renames are **not** atomic as a group; a brief mixed-language-version interval is possible.
- HTTPS smoke testing checks page responses and the map script marker, not full browser behavior against the live domain.
- This is not true traffic canary or blue-green deployment. Those require a versioned hosting setup and switchable routing.
- Backups do not include separately stored databases/mail. Arrange long-term external encrypted archive retention beyond the 14-day GitHub artifact limit.
