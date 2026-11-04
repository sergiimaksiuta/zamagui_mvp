#!/usr/bin/env python3
"""Assemble a clean main-domain HOSTiQ candidate from exactly tracked site sources.
No repository mutation and no production publishing.
"""
from pathlib import Path
import os
import zipfile
ROOT=Path(__file__).resolve().parents[1]
DEST=ROOT/'dist'/'ZaMaGui_Main_HOSTIQ_candidate.zip'
DIRS=('assets','locales','en','ru','api')
ROOT_FILES={'.htaccess','robots.txt','sitemap.xml','404.html'}
files=[]
for name in ROOT_FILES:
    p=ROOT/name
    if p.is_file():files.append(p)
files.extend(ROOT.glob('*.html'))
for directory in DIRS:
    base=ROOT/directory
    if not base.is_dir():raise SystemExit('Missing main site directory: '+directory)
    files.extend(p for p in base.rglob('*') if p.is_file())
required=('index.html','growth.html','kids.html','ai.html','guild.html',
          'marketplace.html','capital.html','ecosystem.html','ru/index.html',
          'en/index.html','assets/approved.css','api/lead.php','api/csrf.php')
for filename in required:
    if not (ROOT/filename).is_file():raise SystemExit('Missing '+filename)
for p in files:
    relative=p.relative_to(ROOT)
    if p.is_symlink() or p.stat().st_size>9_000_000:
        raise SystemExit('Untrusted artifact file: '+str(relative))
    if p.name.startswith('.env') or p.suffix.lower() in ('.key','.pem','.p12','.pfx'):
        raise SystemExit('Potential secret: '+str(relative))
DEST.parent.mkdir(parents=True,exist_ok=True)
with zipfile.ZipFile(DEST,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=8) as z:
    for p in sorted(set(files)):
        z.write(p,p.relative_to(ROOT))
with zipfile.ZipFile(DEST) as z:
    bad=z.testzip()
    if bad:raise SystemExit('ZIP corruption: '+bad)
print('Main-domain ZIP ready:',DEST,'files:',len(set(files)),'size:',DEST.stat().st_size)
