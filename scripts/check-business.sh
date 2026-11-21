#!/usr/bin/env bash
set -euo pipefail
[[ -s business-site/index.html ]] || { echo 'Missing Business root'; exit 1; }
[[ -s business-site/api/lead.php ]] || { echo 'Missing approved Business lead endpoint'; exit 1; }
[[ -s business-site/assets/site.css ]] || { echo 'Missing Business CSS'; exit 1; }
[[ -s business-site/assets/site.js ]] || { echo 'Missing Business JS'; exit 1; }
if find business-site -type l | grep -q .; then echo 'Symlinks prohibited'; exit 1; fi
if find business-site -type f \( -name '.env*' -o -name '*.pem' -o -name '*.key' \) | grep -q .; then echo 'Secret-like files in Business payload'; exit 1; fi
if find business-site -type f -name '*.php' ! -path 'business-site/api/lead.php' | grep -q .; then echo 'Unapproved PHP in Business payload'; exit 1; fi
if grep -RniE '(BEGIN (RSA |OPENSSH )?PRIVATE KEY|AKIA[0-9A-Z]{16})' business-site; then echo 'Potential secret'; exit 1; fi
[[ $(find business-site -type f | wc -l) -le 100 ]] || { echo 'Unexpected Business payload size'; exit 1; }
node --check business-site/assets/site.js
python3 - <<'PY'
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse
import re

class Inspect(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.lang = None
        self.hrefs = []
        self.images = []
        self.article_count = 0
        self.h3 = []
        self.in_h3 = False
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'html': self.lang = a.get('lang')
        if tag == 'a': self.hrefs.append(a.get('href', ''))
        if tag == 'img': self.images.append(a.get('src', ''))
        if tag == 'article' and 'card' in (a.get('class') or '').split():
            self.article_count += 1
        if tag == 'h3': self.in_h3 = True
    def handle_endtag(self, tag):
        if tag == 'h3': self.in_h3 = False
    def handle_data(self, data):
        if self.in_h3: self.h3.append(data.strip())

pages = ['', 'bug-bounty', 'contact', 'ecosystem', 'investments', 'kids',
         'partners', 'privacy', 'projects', 'services', 'spaces', 'terms']
errors = []
checked = 0
for lang in ('uk', 'ru', 'en'):
    for slug in pages:
        file = Path('business-site') / lang / slug / 'index.html'
        if not file.exists():
            errors.append(f'Missing localized page: {file}')
            continue
        text = file.read_text(encoding='utf-8')
        parsed = Inspect()
        parsed.feed(text)
        checked += 1
        urlpath = f'{lang}/' + (f'{slug}/' if slug else '')
        expected = f'https://business.zamagui.com/{urlpath}'
        if parsed.lang != lang: errors.append(f'{file}: lang={parsed.lang} expected={lang}')
        if f'rel="canonical" href="{expected}"' not in text:
            errors.append(f'{file}: canonical mismatch')
        for alt in ('uk', 'ru', 'en'):
            if f'hreflang="{alt}"' not in text:
                errors.append(f'{file}: missing hreflang {alt}')
        if lang != 'en' and 'Skip to content' in text:
            errors.append(f'{file}: English skip link in {lang}')
        if 'site.css?v=20261122b' not in text or 'site.js?v=20261122b' not in text:
            errors.append(f'{file}: stale asset version')
        if not parsed.hrefs: errors.append(f'{file}: no navigation')
        if slug == '':
            if parsed.article_count != 6: errors.append(f'{file}: directory must show six featured categories')
            if len(parsed.images) < 6: errors.append(f'{file}: expected approved editorial imagery')
        if slug == 'projects' and lang != 'en':
            if 'Growth & owner advisory' in parsed.h3 or 'Business Academy' in parsed.h3:
                errors.append(f'{file}: untranslated project heading')
        if slug == 'services' and parsed.article_count != 18:
            errors.append(f'{file}: lost existing service entries')
        if slug == 'partners' and parsed.article_count != 9:
            errors.append(f'{file}: lost existing partner entries')
        for img in parsed.images:
            parsed_url = urlparse(img)
            if parsed_url.hostname == 'zamagui.com' and parsed_url.path.startswith('/assets/approved/'):
                original = Path(parsed_url.path.lstrip('/'))
                if not original.exists(): errors.append(f'{file}: missing approved image in Git {original}')
if errors:
    raise SystemExit('\n'.join(errors))
print(f'Business editorial checks passed: {checked} localized pages, 3 locales, asset references and content structure')
PY
