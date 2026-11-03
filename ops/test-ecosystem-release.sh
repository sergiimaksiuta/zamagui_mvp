#!/usr/bin/env bash
set -euo pipefail
export LANG=C LC_ALL=C
bash -n ops/publish-ecosystem.sh
bash -n ops/remote-ecosystem-release.sh
# Regression: shared HOSTiQ shell has no usable /dev/fd for Bash process substitution.
if grep -Fq '< <(' ops/remote-ecosystem-release.sh; then
  echo 'FAIL: remote release depends on inaccessible /dev/fd process substitution' >&2
  exit 1
fi

TEST_DIR="$(mktemp -d)"
trap 'rm -rf -- "$TEST_DIR"' EXIT
mkdir -p "$TEST_DIR/zamagui.com/ru" "$TEST_DIR/zamagui.com/en" \
  "$TEST_DIR/source/ru" "$TEST_DIR/source/en" \
  "$TEST_DIR/.zamagui-releases/111"
FILES=(ecosystem.html ru/ecosystem.html en/ecosystem.html)
for f in "${FILES[@]}"; do
  printf 'OLD:%s\n' "$f" > "$TEST_DIR/zamagui.com/$f"
  printf 'NEW:%s <script defer="" src="/assets/zm-r11.js"></script>\n' "$f" > "$TEST_DIR/source/$f"
done
(
  cd "$TEST_DIR/source"
  tar -czf "$TEST_DIR/.zamagui-releases/111/payload.tar.gz" -- "${FILES[@]}"
)
SHA="$(sha256sum "$TEST_DIR/.zamagui-releases/111/payload.tar.gz" | awk '{print $1}')"
sed "s#/home4/dataforg#$TEST_DIR#g" ops/remote-ecosystem-release.sh \
  > "$TEST_DIR/test-remote.sh"
bash "$TEST_DIR/test-remote.sh" deploy 111 "$SHA"
for f in "${FILES[@]}"; do
  grep -Fq 'NEW:' "$TEST_DIR/zamagui.com/$f"
done
bash "$TEST_DIR/test-remote.sh" rollback 111
for f in "${FILES[@]}"; do
  grep -Fq 'OLD:' "$TEST_DIR/zamagui.com/$f"
done

# A rollback cannot overwrite unrelated edits performed after the release.
mkdir -p "$TEST_DIR/.zamagui-releases/222"
cp "$TEST_DIR/.zamagui-releases/111/payload.tar.gz" \
  "$TEST_DIR/.zamagui-releases/222/payload.tar.gz"
bash "$TEST_DIR/test-remote.sh" deploy 222 "$SHA"
printf 'NEWER INDEPENDENT CHANGE\n' > "$TEST_DIR/zamagui.com/ru/ecosystem.html"
if bash "$TEST_DIR/test-remote.sh" rollback 222; then
  echo 'ERROR: rollback overwrote an independent edit'
  exit 1
fi
grep -Fq 'NEWER INDEPENDENT CHANGE' "$TEST_DIR/zamagui.com/ru/ecosystem.html"
echo 'PASS: 3-file apply, rollback and overwrite-protection simulated safely'
