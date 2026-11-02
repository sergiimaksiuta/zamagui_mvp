#!/usr/bin/env bash
set -Eeuo pipefail
umask 077
export LANG=C LC_ALL=C

MODE="${1:-}"
RUN_ID="${2:-}"
EXPECTED_SHA="${3:-}"
[[ "$RUN_ID" =~ ^[0-9]+$ ]] || { echo 'Invalid run id'; exit 1; }
ROOT='/home4/dataforg/zamagui.com'
BASE="/home4/dataforg/.zamagui-releases/$RUN_ID"
FILES=(ecosystem.html ru/ecosystem.html en/ecosystem.html)
[[ -d "$ROOT" && ! -L "$ROOT" && -d "$BASE" && ! -L "$BASE" ]] || exit 1

restore() {
  local f temporary
  for f in "${FILES[@]}"; do
    [[ -s "$BASE/original/$f" && ! -L "$ROOT/$f" && -s "$BASE/stage/$f" ]] || {
      echo "Cannot restore missing backup: $f" >&2
      return 1
    }
    # Refuse to overwrite an independent edit made after this release.
    if ! cmp -s -- "$ROOT/$f" "$BASE/stage/$f" &&
       ! cmp -s -- "$ROOT/$f" "$BASE/original/$f"; then
      echo "Restore refused: $f changed after this release" >&2
      return 1
    fi
  done
  for f in "${FILES[@]}"; do
    temporary="$(mktemp "$(dirname "$ROOT/$f")/.zmg-rollback-XXXXXXXX")"
    cp -p -- "$BASE/original/$f" "$temporary"
    mv -f -- "$temporary" "$ROOT/$f"
  done
  echo "ROLLBACK COMPLETE: $RUN_ID"
}

if [[ "$MODE" == rollback ]]; then
  [[ -d "$BASE/original" ]] || { echo 'No recovery snapshot available'; exit 1; }
  restore
  exit
fi

[[ "$MODE" == deploy && "$EXPECTED_SHA" =~ ^[a-f0-9]{64}$ ]] || exit 1
[[ -s "$BASE/payload.tar.gz" && ! -L "$BASE/payload.tar.gz" ]] || exit 1
ACTUAL_SHA="$(sha256sum "$BASE/payload.tar.gz" | awk '{print $1}')"
[[ "$ACTUAL_SHA" == "$EXPECTED_SHA" ]] || { echo 'Payload checksum mismatch'; exit 1; }

# Allow exactly three known paths in the tar archive, excluding traversal.
mapfile -t tar_entries < <(tar -tzf "$BASE/payload.tar.gz")
[[ "${#tar_entries[@]}" == 3 ]] || { echo 'Unexpected payload count'; exit 1; }
for i in 0 1 2; do
  [[ "${tar_entries[$i]}" == "${FILES[$i]}" ]] || { echo 'Unexpected payload entry'; exit 1; }
done

mkdir -p "$BASE/stage" "$BASE/original"
tar -xzf "$BASE/payload.tar.gz" -C "$BASE/stage"

for f in "${FILES[@]}"; do
  [[ -s "$ROOT/$f" && ! -L "$ROOT/$f" && -s "$BASE/stage/$f" && ! -L "$BASE/stage/$f" ]] || exit 1
  grep -Fq 'src="/assets/zm-r11.js"' "$BASE/stage/$f" || exit 1
  mkdir -p "$(dirname "$BASE/original/$f")"
  cp -p -- "$ROOT/$f" "$BASE/original/$f"
done

for f in "${FILES[@]}"; do
  cmp -s -- "$ROOT/$f" "$BASE/original/$f" || { echo "Concurrent update detected: $f"; exit 1; }
done

started=0
recover_if_failed() {
  status=$?
  if (( status != 0 && started == 1 )); then
    echo 'Local apply failure: rolling back' >&2
    restore || echo 'CRITICAL: rollback failed; inspect private snapshot' >&2
  fi
}
trap recover_if_failed EXIT

started=1
for f in "${FILES[@]}"; do
  temporary="$(mktemp "$(dirname "$ROOT/$f")/.zmg-new-XXXXXXXX")"
  cp -- "$BASE/stage/$f" "$temporary"
  chmod --reference="$ROOT/$f" "$temporary"
  mv -f -- "$temporary" "$ROOT/$f"
done

for f in "${FILES[@]}"; do
  cmp -s -- "$BASE/stage/$f" "$ROOT/$f" || { echo "Post-deploy mismatch: $f"; exit 1; }
done
started=0
trap - EXIT
echo "REMOTE DEPLOY VERIFIED: $RUN_ID"
