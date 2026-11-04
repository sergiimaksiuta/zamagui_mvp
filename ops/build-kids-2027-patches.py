#!/usr/bin/env python3
"""Two independent, additive production patch archives. Unrelated pages untouched."""
import hashlib,zipfile
from pathlib import Path
root=Path(__file__).resolve().parents[1]
targets={
 'main':[
  'kids.html','ru/kids.html','en/kids.html',
  'kids-2027.html','ru/kids-2027.html','en/kids-2027.html',
  'assets/kids-2027.css','assets/kids-2027.js',
  'sitemap.xml',
  'api/.htaccess','api/_crm.php','api/csrf.php','api/lead.php','api/kids-preregister.php'
 ],
 'business':[
  'business-site/uk/kids/index.html','business-site/ru/kids/index.html','business-site/en/kids/index.html',
  'business-site/api/.htaccess','business-site/api/_crm.php','business-site/api/csrf.php','business-site/api/lead.php',
  'business-site/assets/site.js'
 ]
}
out=root/'dist'/'kids-2027';out.mkdir(parents=True,exist_ok=True)
for name,paths in targets.items():
 archive=out/('zamagui-kids-2027-'+name+'-patch.zip')
 with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=8) as z:
  for path in paths:
   source=root/path
   assert source.exists() and source.is_file() and not source.is_symlink(),path
   relative=path.removeprefix('business-site/') if name=='business' else path
   assert '..' not in Path(relative).parts
   z.write(source,relative)
 with zipfile.ZipFile(archive) as z:assert z.testzip() is None
 print('PASS',name,len(paths),'files',archive,hashlib.sha256(archive.read_bytes()).hexdigest())
