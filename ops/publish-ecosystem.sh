#!/usr/bin/env bash
set -Eeuo pipefail
export LANG=C LC_ALL=C
umask 077

FILES=(ecosystem.html ru/ecosystem.html en/ecosystem.html)
RUN_ID="${GITHUB_RUN_ID:?}"
[[ "$RUN_ID" =~ ^[0-9]+$ ]] || exit 1
[[ -n "${SSH_HOST:-}" && -n "${SSH_PORT:-}" && -n "${SSH_USER:-}" ]] || exit 1
REMOTE="$SSH_USER@$SSH_HOST"
SSH_OPTS=( -F /dev/null -i "$HOME/.ssh/zamagui_deploy" -p "$SSH_PORT"
  -o IdentitiesOnly=yes -o BatchMode=yes -o StrictHostKeyChecking=yes
  -o "UserKnownHostsFile=$HOME/.ssh/known_hosts" -o ConnectTimeout=15 )

for file in "${FILES[@]}"; do
  [[ -s "$file" && ! -L "$file" ]] || { echo "Invalid release file: $file"; exit 1; }
  grep -Fq 'src="/assets/zm-r11.js"' "$file" || { echo "Missing map script: $file"; exit 1; }
done

PAYLOAD="$RUNNER_TEMP/zamagui-three-pages.tar.gz"
tar -czf "$PAYLOAD" -- "${FILES[@]}"
DIGEST="$(sha256sum "$PAYLOAD" | awk '{print $1}')"

# Stage in a private directory outside the public webroot.
ssh "${SSH_OPTS[@]}" -n "$REMOTE" "bash -c 'set -euo pipefail; umask 077; test ! -L /home4/dataforg/.zamagui-releases; mkdir -p /home4/dataforg/.zamagui-releases/$RUN_ID; chmod 700 /home4/dataforg/.zamagui-releases/$RUN_ID; test ! -e /home4/dataforg/.zamagui-releases/$RUN_ID/payload.tar.gz'"
ssh "${SSH_OPTS[@]}" "$REMOTE" \
  "cat > /home4/dataforg/.zamagui-releases/$RUN_ID/payload.tar.gz" < "$PAYLOAD"

ROLLBACK_NEEDED=1
rollback_on_error() {
  status=$?
  if (( status != 0 )) && (( ROLLBACK_NEEDED == 1 )); then
    echo 'Deploy failed: attempting recovery from server-side snapshot'
    ssh "${SSH_OPTS[@]}" "$REMOTE" bash -s -- rollback "$RUN_ID" < ops/remote-ecosystem-release.sh || \
      echo 'CRITICAL: automatic rollback failed; server-side recovery copy remains available' >&2
  fi
}
trap rollback_on_error EXIT

ssh "${SSH_OPTS[@]}" "$REMOTE" bash -s -- deploy "$RUN_ID" "$DIGEST" \
  < ops/remote-ecosystem-release.sh

# Check real public HTTPS endpoints after the remote checksum verification.
for file in "${FILES[@]}"; do
  url="https://zamagui.com/$file?zmg_release=$RUN_ID"
  ok=0
  for attempt in 1 2 3 4 5; do
    body="$RUNNER_TEMP/zmg-http-$attempt-$(basename "$(dirname "$file")")-$(basename "$file")"
    if curl --fail --silent --show-error --location --max-time 15 -o "$body" "$url" &&
       grep -Fq 'src="/assets/zm-r11.js"' "$body"; then
      ok=1
      break
    fi
    sleep 3
  done
  (( ok == 1 )) || { echo "Public smoke check failed: $url"; exit 1; }
  echo "Verified: https://zamagui.com/$file"
done


echo "Running real Chromium tests against live HTTPS, with rollback still enabled"
PLAYWRIGHT_TEST_BASE_URL=https://zamagui.com \
  npx playwright test --config=e2e/playwright.config.cjs
echo 'Live browser smoke checks: PASS'

ROLLBACK_NEEDED=0
trap - EXIT
echo "RELEASE OK: three ecosystem pages published; rollback snapshot retained for run $RUN_ID"
