# ZaMaGui encrypted offsite backup

Manual GitHub Actions workflow that reads the HOSTiQ webroot, encrypts the archive immediately using an age public recipient, and uploads ciphertext only as a private repository artifact. This does not modify production.

One-time setup on your trusted Mac:

1. Install age using `brew install age`.
2. Run `umask 077; mkdir -p "$HOME/.config/zamagui"; age-keygen -o "$HOME/.config/zamagui/backup-recovery-key.txt"`.
3. Run `age-keygen -y "$HOME/.config/zamagui/backup-recovery-key.txt"` and copy the **age1... public recipient**.
4. Back up the **private** key off-device in a protected password manager or encrypted storage. NEVER place the private key in GitHub or chat.
5. In GitHub repository Settings → Secrets and variables → Actions → Variables, set `BACKUP_AGE_RECIPIENT` to the public recipient.
6. Independently verify the HOSTiQ SSH host fingerprint using a trustworthy hosting-provider source. Only then set `HOST_FINGERPRINT_VERIFIED=true` repository variable.

Run GitHub Actions → ZaMaGui - Encrypted offsite backup → Run workflow on main.

Download the resulting artifact and extract its ZIP on Mac. Verify ciphertext with `shasum -a 256 -c site.tar.gz.age.sha256`. Inspect archive paths by running:

    age -d -i "$HOME/.config/zamagui/backup-recovery-key.txt" site.tar.gz.age | tar -tzf -

Perform an actual restoration test into a NEW empty private folder before calling it recoverable; the CI runner intentionally has no decryption key.

Limits: 14-day GitHub artifact retention, non-transactional tar archive, excludes databases/email/outside-webroot files. GitHub hosted backups supplement but do not replace independent durable storage. The backup SSH key currently has deployment privileges; segregate it to read-only in a later hardening step. Never merge this with automatic production deployment until these gates pass.