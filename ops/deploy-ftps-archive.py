#!/usr/bin/env python3
"""Deploy independently over verified FTPS, with backup and best-effort rollback."""
import argparse,ftplib,io,os,pathlib,secrets,ssl,sys,urllib.request,zipfile
p=argparse.ArgumentParser()
p.add_argument('--archive',required=True);p.add_argument('--domain',choices=['zamagui.com','business.zamagui.com'],required=True)
p.add_argument('--backup',required=True);p.add_argument('--dry-run',action='store_true')
a=p.parse_args();files={}
with zipfile.ZipFile(a.archive) as z:
 if z.testzip():raise RuntimeError('Invalid ZIP')
 for name in z.namelist():
  path=pathlib.PurePosixPath(name)
  if name.endswith('/'):continue
  if path.is_absolute() or '..' in path.parts or (name.startswith('.') and name!='.htaccess'):raise RuntimeError('Unsafe path '+name)
  if name in files:raise RuntimeError('Duplicate path '+name)
  files[name]=z.read(name)
required=['index.html','api/lead.php'] if a.domain=='zamagui.com' else ['uk/index.html','ru/index.html','en/index.html','api/lead.php']
if not all(x in files for x in required):raise RuntimeError('Missing critical files')
print('Validated archive:',len(files),'files')
if a.dry_run:sys.exit(0)
ftp=ftplib.FTP_TLS(context=ssl.create_default_context(),timeout=30)
changed=[];old={};probe=None
def put(name,data):ftp.storbinary('STOR '+name,io.BytesIO(data))
def get(name):
 b=io.BytesIO();ftp.retrbinary('RETR '+name,b.write);return b.getvalue()
def mkdirs(name):
 path=''
 for part in pathlib.PurePosixPath(name).parts:
  path+=(('/' if path else '')+part)
  try:ftp.mkd(path)
  except ftplib.error_perm as e:
   if not str(e).startswith('550'):raise
try:
 ftp.connect(os.environ['FTPS_HOST'],21);ftp.auth()
 ftp.login(os.environ['FTPS_USER'],os.environ['FTPS_PASSWORD']);ftp.prot_p()
 probe='zmg-proof-'+secrets.token_hex(10)+'.txt';token=secrets.token_hex(20).encode();put(probe,token)
 with urllib.request.urlopen('https://'+a.domain+'/'+probe+'?t='+secrets.token_hex(3),timeout=20) as r:
  if r.status!=200 or r.read(200)!=token:raise RuntimeError('FTPS Document Root mismatch')
 ftp.delete(probe);probe=None
 for name in sorted(files):
  try:old[name]=get(name)
  except ftplib.error_perm as e:
   if str(e).startswith('550'):old[name]=None
   else:raise
 pathlib.Path(a.backup).parent.mkdir(parents=True,exist_ok=True)
 with zipfile.ZipFile(a.backup,'w',zipfile.ZIP_DEFLATED) as z:
  for name,data in old.items():
   if data is not None:z.writestr(name,data)
  z.writestr('__missing_before_release__.txt','\n'.join(k for k,v in old.items() if v is None))
 print('Backup saved:',a.backup)
 for name,data in sorted(files.items(),key=lambda item:item[0] in ('index.html','uk/index.html','ru/index.html','en/index.html')):
  parent=name.rpartition('/')[0]
  if parent:mkdirs(parent)
  stage=(parent+'/' if parent else '')+'.zmg-stage-'+secrets.token_hex(8)
  put(stage,data)
  if get(stage)!=data:raise RuntimeError('Stage mismatch: '+name)
  if old[name] is not None:ftp.delete(name)
  try:ftp.rename(stage,name)
  except Exception:
   if old[name] is not None:put(name,old[name])
   raise
  changed.append(name)
 for page in (['','ru/','en/'] if a.domain=='zamagui.com' else ['uk/','ru/','en/']):
  with urllib.request.urlopen('https://'+a.domain+'/'+page+'?release='+secrets.token_hex(3),timeout=20) as r:
   if r.status!=200 or b'ZaMaGui' not in r.read(500000):raise RuntimeError('HTTP smoke failed '+page)
 print('RELEASE PASS',a.domain,len(changed))
except Exception:
 print('RELEASE FAILED: rollback',file=sys.stderr)
 for name in reversed(changed):
  try:
   if old[name] is None:ftp.delete(name)
   else:put(name,old[name])
  except Exception as e:print('MANUAL RECOVERY NEEDED',name,e,file=sys.stderr)
 raise
finally:
 if probe:
  try:ftp.delete(probe)
  except Exception:pass
 try:ftp.quit()
 except Exception:pass
