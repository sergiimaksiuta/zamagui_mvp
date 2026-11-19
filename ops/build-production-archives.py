#!/usr/bin/env python3
import argparse,pathlib,subprocess,zipfile
root=pathlib.Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--target',choices=['main','business'],required=True);a=p.parse_args()
files=[]
for raw in subprocess.check_output(['git','ls-files','-z'],cwd=root).split(b'\0'):
 if not raw:continue
 rel=pathlib.PurePosixPath(raw.decode())
 if a.target=='business':
  if rel.parts[0]!='business-site':continue
  dest=rel.relative_to('business-site')
 else:
  if rel.parts[0] in ('.github','business-site','docs','e2e','ops','node_modules','dist'):continue
  if len(rel.parts)>1 and rel.parts[0] not in ('assets','api','ru','en','uk'):continue
  dest=rel
 if dest.suffix not in ('.html','.css','.js','.json','.webp','.png','.jpg','.jpeg','.svg','.ico','.txt','.xml','.php','.webmanifest','.woff','.woff2','.map') and dest.name!='.htaccess':continue
 src=root/rel
 if src.is_symlink() or not src.is_file():raise RuntimeError('Unsafe path: '+str(rel))
 files.append((src,dest.as_posix()))
if a.target=='business':
 for src in (root/'business-site/assets/zmg-shared').rglob('*'):
  if src.is_file():files.append((src,src.relative_to(root/'business-site').as_posix()))
required=('index.html','api/lead.php') if a.target=='main' else ('uk/index.html','ru/index.html','en/index.html','api/lead.php')
if not all(x in [y for _,y in files] for x in required):raise RuntimeError('Missing critical pages')
out=root/'dist/deploy';out.mkdir(parents=True,exist_ok=True)
path=out/('zamagui-'+a.target+'.zip')
with zipfile.ZipFile(path,'w',zipfile.ZIP_DEFLATED) as z:
 for src,name in sorted(files,key=lambda x:x[1]):z.write(src,name)
with zipfile.ZipFile(path) as z:assert z.testzip() is None
print('BUILD OK',path,len(files))
