#!/usr/bin/env bash
set -euo pipefail
[[ -s business-site/index.html ]] || { echo 'Missing homepage'; exit 1; }
grep -q 'ZaMaGui Business' business-site/index.html
if find business-site -type l | grep -q .; then echo 'Symlinks prohibited'; exit 1; fi
if find business-site -type f \( -name '*.php' -o -name '.env*' -o -name '*.pem' -o -name '*.key' \) | grep -q .; then echo 'Non-static or secret file in payload'; exit 1; fi
if grep -RniE '(BEGIN (RSA |OPENSSH )?PRIVATE KEY|AKIA[0-9A-Z]{16})' business-site; then echo 'Potential secret'; exit 1; fi
[[ $(find business-site -type f | wc -l) -le 100 ]] || { echo 'Unexpected payload size'; exit 1; }
echo 'Business static release checks passed'
