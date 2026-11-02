# ZaMaGui: Mac, AI agents, GitHub and HOSTiQ operating procedure

Status: **first controlled release is limited to the three Ecosystem pages**.
The full-site production autopublish, versioned preview environment, CDN and blue/green/canary are NOT enabled by this PR.

## One source of truth and where files live

| Purpose | Location |
|---|---|
| Authoritative code history | Private GitHub repository: `sergiimaksiuta/zamagui_mvp`, branch `main` |
| Canonical Mac checkout | `~/Documents/zmg_mvp/zamagui_mvp_canonical` |
| Your AI agents' work | Their own `feat/*` or `fix/*` Git branch, in a separate checkout/worktree when concurrent |
| GitHub Actions tests | Ephemeral GitHub runners — do not require Mac to be online |
| Production public website | HOSTiQ `/home4/dataforg/zamagui.com/` |
| Private release snapshots | HOSTiQ `/home4/dataforg/.zamagui-releases/<release-id>/` |
| Mac encrypted archives | `~/Documents/ZaMaGui-private-backups/` |
| Private decryption key | `~/.config/zamagui/backup-recovery-key.txt`, plus off-device protected copy |
| Live URL | `https://zamagui.com` |
| Preview/staging website | **Not yet configured**; browser CI currently tests a temporary localhost copy |

Never work in the obsolete independent folder `~/Documents/zmg_mvp/zmg_v1.0`.
Never edit production using cPanel File Manager/FTP while GitHub is the source of truth.
Do not commit customer data, SSH keys, `.env`, private backups, or credentials.

## Work on the Mac

1. Open `~/Documents/zmg_mvp/zamagui_mvp_canonical`.
2. Sync the canonical repo, **only if local changes are saved**:
   ```bash
   git switch main
   git pull --ff-only origin main
   ```
3. For one new task, create `feat/<task>` or `fix/<task>`:
   ```bash
   git switch -c fix/example-task
   ```
4. Change source files, run `bash scripts/setup-mac-playwright.sh` once for first-time setup; afterwards `npm run test:e2e` with a local server running.
5. Commit and push that task:
   ```bash
   git add -- <specific changed paths>
   git commit -m "fix: explain the change"
   git push -u origin HEAD
   gh pr create --base main --fill
   ```
6. GitHub Actions performs source checks, Chromium tests and (when relevant) release simulation. Inspect failures, images and diffs. Merge only after passing checks and review.
7. Sync your Mac again. Never overwrite active branch work with a forced pull.

For parallel AI agents, prefer one **git worktree** per task with isolated paths; branches + PRs prevent agents from overwriting each other. Human review applies to any production-affecting changes.

## Install Playwright on Mac and run tests

From the canonical repo:

```bash
bash scripts/setup-mac-playwright.sh
```

The script installs Node via Homebrew if needed, installs `@playwright/test@1.64.1` and Chromium, starts a temporary local web server and runs the existing 16 read-only tests (uk/ru/en, dark theme, Ecosystem links, viewport overflow).

To manually retest a local change after setup, run a local server in terminal A:

```bash
npm run serve
```

And in terminal B:

```bash
npm run test:e2e
```

After a **real** deployment, you may verify the live site (read-only navigation and theme switching only):

```bash
npm run test:e2e:live
```

Mac installation is optional for GitHub QA; CI already has an isolated Playwright container. Never run tests that submit real leads, create orders or modify production data on the live environment.

## First real release: three Ecosystem pages

1. Source and browser QA pass on the merged `main` commit.
2. Check the latest deployment dry-run. It should show just three changed HTML pages and zero deletes.
3. Make a fresh encrypted backup, **download it to Mac**, verify SHA-256, decryption and recovery in a private temporary directory.
4. Trigger **ZaMaGui - Controlled ecosystem release** manually in GitHub Actions, choosing `main`.
   - `backup_run_id`: successful encrypted backup workflow run ID, less than 24 hours old.
   - `approval`: `DEPLOY_THREE_ECOSYSTEM_PAGES`.
5. GitHub stages exactly three files, saves original pages privately on HOSTiQ, publishes and executes HTTPS + Chromium checks **against https://zamagui.com**, while the automatic rollback trap remains active.
6. The deployment is accepted only if verification passes. Keep the release workflow run ID and snapshot for manual rollback. If live checks fail, review job logs and roll back using the dedicated workflow.

The existing deployment approval is **manual**, not an unattended publish after every merge.
Merging a PR alone does not trigger HOSTiQ deploy.

## Future fully automated target (not yet implemented)

`agent branch → PR → required CI → preview deployment → review/approve → encrypted backup and restore check → controlled production deploy → synthetic monitoring → auto rollback on confirmed failure`.

For full-site frequent releases, use immutable release directories and atomic pointer/routing switch; only then explore blue/green or canary routing. HOSTiQ currently publishes static files in place and is not a genuine blue/green/canary platform.

## Permissions

- Agents: branch creation, commits and PR proposals; no production SSH secrets.
- GitHub QA: `contents:read`; no production credentials.
- Backup runner: read-only operations over SSH, private-key encryption by recipient (currently the SSH identity also has write privileges — later split into least-privilege identities).
- Release runner: constrained manual workflow; SSH secrets only when explicitly run; narrowly allowlisted three HTML pages.
- Only a human owner approves deployment and paid infrastructure. GitHub rulesets/required checks should protect `main` if the GitHub account plan supports private-repo rules.
- Keep rollback snapshots under the account private directory; GitHub backup artifacts expire after 14 days, so add durable external encrypted storage.
