#!/usr/bin/env python3
"""Verified FTPS overlay for Kids/CRM. Independent domain backup and rollback."""
import argparse, ftplib, io, os, pathlib, secrets, ssl, sys, urllib.request, zipfile
def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--target',choices=['main','business'],required=True)
    parser.add_argument('--archive',required=True)
    parser.add_argument('--backup',required=True)
    parser.add_argument('--dry-run',action='store_true')
    arg=parser.parse_args()
    domain='zamagui.com' if arg.target=='main' else 'business.zamagui.com'
    with zipfile.ZipFile(arg.archive) as z:
        if z.testzip() is not None: raise RuntimeError('Archive checksum failure')
        data={}
        for x in z.infolist():
            if x.is_dir():continue
            p=pathlib.PurePosixPath(x.filename)
            if p.is_absolute() or '..' in p.parts or p.name.startswith('.zmg-'):raise RuntimeError('Invalid path')
            if x.filename in data:raise RuntimeError('Duplicate')
            data[x.filename]=z.read(x)
    expected=['kids-2027.html','api/kids-preregister.php'] if arg.target=='main' else ['uk/kids/index.html','api/lead.php']
    if not all(p in data for p in expected):raise RuntimeError('Unexpected archive scope')
    if any('/.env' in p or p.startswith('.env') or p.endswith(('.key','.pem')) for p in data):raise RuntimeError('Secrets included')
    print('ZIP verified for',domain,'files',len(data))
    if arg.dry_run:return
    for key in ['FTPS_HOST','FTPS_USER','FTPS_PASSWORD']:
        if not os.getenv(key):raise RuntimeError('FTPS credential missing: '+key)
    ftp=ftplib.FTP_TLS(context=ssl.create_default_context(),timeout=30)
    originals={};changed=[];probe=None
    def upload(p,body):ftp.storbinary('STOR '+p,io.BytesIO(body))
    def fetch(p):
        stream=io.BytesIO();ftp.retrbinary('RETR '+p,stream.write);return stream.getvalue()
    def folders(p):
        name=''
        for segment in pathlib.PurePosixPath(p).parts:
            name+=('/' if name else '')+segment
            try:ftp.mkd(name)
            except ftplib.error_perm as error:
                if not str(error).startswith('550'):raise
    try:
        ftp.connect(os.environ['FTPS_HOST'],21)
        ftp.auth();ftp.login(os.environ['FTPS_USER'],os.environ['FTPS_PASSWORD']);ftp.prot_p()
        probe='zmg-root-'+secrets.token_hex(10)+'.txt'
        proof=secrets.token_hex(25).encode()
        upload(probe,proof)
        url='https://'+domain+'/'+probe+'?check='+secrets.token_hex(4)
        with urllib.request.urlopen(url,timeout=20,context=ssl.create_default_context()) as response:
            if response.status!=200 or response.read(300)!=proof:raise RuntimeError('Wrong FTPS webroot')
        ftp.delete(probe);probe=None
        print('FTPS webroot proven for:',domain)
        for name in data:
            try:originals[name]=fetch(name)
            except ftplib.error_perm as e:
                if str(e).startswith('550'):originals[name]=None
                else:raise
        dest=pathlib.Path(arg.backup);dest.parent.mkdir(parents=True,exist_ok=True)
        with zipfile.ZipFile(dest,'w',zipfile.ZIP_DEFLATED) as archive:
            for name,body in originals.items():
                if body is not None:archive.writestr(name,body)
            archive.writestr('_files-absent-before.txt','\n'.join(n for n,v in originals.items() if v is None))
        print('Created recovery archive',dest)
        for name,body in sorted(data.items(),key=lambda x:x[0].endswith('index.html')):
            parent=name.rpartition('/')[0]
            if parent:folders(parent)
            staged=(parent+'/' if parent else '')+'.zmg-stage-'+secrets.token_hex(8)
            upload(staged,body)
            if fetch(staged)!=body:raise RuntimeError('Staging mismatch')
            if originals[name] is not None:ftp.delete(name)
            try:ftp.rename(staged,name)
            except Exception:
                if originals[name] is not None:upload(name,originals[name])
                raise
            changed.append(name)
        urls=([domain+'/kids-2027.html',domain+'/ru/kids-2027.html',domain+'/en/kids-2027.html']
              if arg.target=='main' else [domain+'/uk/kids/',domain+'/ru/kids/',domain+'/en/kids/'])
        for path in urls:
            with urllib.request.urlopen('https://'+path+'?zmg='+secrets.token_hex(4),timeout=20) as response:
                if response.status!=200 or b'ZaMaGui' not in response.read(500000):raise RuntimeError('HTTPS smoke failed')
        print('SUCCESS: deployed and verified',domain,len(changed))
    except Exception:
        print('Failure detected; rolling back written files',file=sys.stderr)
        for name in reversed(changed):
            try:
                if originals[name] is None:ftp.delete(name)
                else:upload(name,originals[name])
            except Exception as e:print('MANUAL ROLLBACK REQUIRED:',name,type(e).__name__,file=sys.stderr)
        raise
    finally:
        if probe:
            try:ftp.delete(probe)
            except Exception:pass
        try:ftp.quit()
        except Exception:pass
if __name__=='__main__':main()
