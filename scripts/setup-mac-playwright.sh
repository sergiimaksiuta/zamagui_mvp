#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

ROOT="${ZAMAGUI_ROOT:-$HOME/Documents/zmg_mvp/zamagui_mvp_canonical}"
PORT=4173
SERVER_PID=""
LOG="$(mktemp)"
cleanup() {
  if [[ -n "$SERVER_PID" ]]; then
    kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
  rm -f -- "$LOG"
}
trap cleanup EXIT

echo '=== ZaMaGui: setup and run local Playwright ==='
[[ -d "$ROOT/.git" ]] || { echo "Missing canonical repository: $ROOT" >&2; exit 1; }
cd "$ROOT"
[[ "$(git remote get-url origin)" == *sergiimaksiuta/zamagui_mvp* ]] || {
  echo 'Unexpected repository origin. Aborting.' >&2
  exit 1
}

if ! command -v node >/dev/null || ! command -v npm >/dev/null; then
  command -v brew >/dev/null || {
    echo 'Install Homebrew first: https://brew.sh' >&2
    exit 1
  }
  brew install node
fi
command -v python3 >/dev/null || { echo 'Python 3 is required on this Mac' >&2; exit 1; }

echo '1. Install pinned Playwright test runner (1.64.1)'
npm install --no-save --no-package-lock --ignore-scripts --no-audit --no-fund @playwright/test@1.64.1
echo '2. Install Chromium browser for this runner'
npx playwright install chromium

if curl -fsS --connect-timeout 1 "http://127.0.0.1:$PORT/index.html" >/dev/null 2>&1; then
  echo "Port $PORT already has a server; stop it to avoid testing an unrelated project" >&2
  exit 1
fi
echo '3. Start local site server'
python3 -m http.server "$PORT" --bind 127.0.0.1 > "$LOG" 2>&1 &
SERVER_PID=$!
READY=0
for i in {1..25}; do
  if curl -fsS --connect-timeout 1 "http://127.0.0.1:$PORT/index.html" >/dev/null 2>&1; then
    READY=1
    break
  fi
  sleep 1
done
if [[ "$READY" != 1 ]]; then
  cat "$LOG" >&2
  echo 'Local site server failed' >&2
  exit 1
fi

echo '4. Test Ukrainian, Russian and English pages'
unset PLAYWRIGHT_TEST_BASE_URL
npm run test:e2e

echo
echo '✅ Local Playwright smoke checks passed'
echo 'Production: UNCHANGED'
echo 'For live read-only tests after deployment, use:'
echo '  npm run test:e2e:live'
