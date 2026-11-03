#!/usr/bin/env python3
"""Controlled ZaMaGui Business deploy. Refuses wrong FTP Document Root."""
import ftplib,io,os,pathlib,secrets,socket,ssl,sys,urllib.error,urllib.request
HOST=os.environ["BUSINESS_FTPS_HOST"]
USER=os.environ["BUSINESS_FTPS_USER"]
PASSWORD=os.environ["BUSINESS_FTPS_PASSWORD"]
WEB=pathlib.Path("business-site")
URL="https://business.zamagui.com/"
def get_url(path):
    req=urllib.request.Request(URL+path,headers={"Cache-Control":"no-cache","User-Agent":"ZaMaGui-Release/1.0"})
    with urllib.request.urlopen(req,timeout=25,context=ssl.create_default_context()) as r:
        return r.status,r.read(200000)
def put(ftp,path,data):ftp.storbinary("STOR "+path,io.BytesIO(data))
def read(ftp,path):
    buff=io.BytesIO();ftp.retrbinary("RETR "+path,buff.write);return buff.getvalue()
def dirs(ftp,path):
    current=""
    for part in pathlib.PurePosixPath(path).parts:
        current+="/"+part
        try:ftp.mkd(current)
        except ftplib.error_perm as exc:
            if not str(exc).startswith("550"):raise
def main():
    files=sorted((p for p in WEB.rglob("*") if p.is_file()),key=lambda p:(p.relative_to(WEB).as_posix() in ("index.html","uk/index.html","ru/index.html","en/index.html"),str(p)))
    assert len(files)>30 and all((WEB/p).is_file() for p in ("uk/index.html","ru/index.html","en/index.html","api/lead.php"))
    if any(p.is_symlink() or ".env" in p.name for p in files):raise RuntimeError("Secret or symlink in public payload")
    ftp=ftplib.FTP_TLS(context=ssl.create_default_context(),timeout=30)
    probe=None;previous=[]
    try:
        ftp.connect(HOST,21);ftp.auth();ftp.login(USER,PASSWORD);ftp.prot_p()
        print("TLS verified and FTPS authenticated")
        probe="zmg-root-"+secrets.token_hex(12)+".txt";token=secrets.token_hex(28).encode()
        put(ftp,probe,token)
        try:status,body=get_url(probe+"?check="+secrets.token_hex(4))
        except urllib.error.HTTPError as exc:
            raise RuntimeError("FTP account root is not website Document Root (HTTP "+str(exc.code)+")")
        if status!=200 or body.strip()!=token:raise RuntimeError("FTP Document Root proof failed")
        ftp.delete(probe);probe=None
        print("Verified FTP root is business.zamagui.com public Document Root")
        for file in files:
            rel=file.relative_to(WEB).as_posix();data=file.read_bytes()
            if len(data)>2000000:raise RuntimeError("File unexpectedly large: "+rel)
            parent=rel.rpartition("/")[0]
            if parent:dirs(ftp,parent)
            old=None
            try:old=read(ftp,rel)
            except ftplib.error_perm as exc:
                if not str(exc).startswith("550"):raise
            stage=(parent+"/" if parent else "")+".zmg-stage-"+secrets.token_hex(6)
            put(ftp,stage,data)
            if read(ftp,stage)!=data:raise RuntimeError("Upload mismatch: "+rel)
            if old is not None:ftp.delete(rel)
            try:ftp.rename(stage,rel)
            except Exception:
                if old is not None:put(ftp,rel,old)
                raise
            previous.append((rel,old))
            print("Published:",rel)
        for loc in ("uk/","ru/","en/"):
            status,body=get_url(loc+"?release="+secrets.token_hex(4))
            if status!=200 or b"ZaMaGui" not in body:raise RuntimeError("Smoke test failed "+loc)
        print("PASS: public RU/UK/EN pages HTTP 200.")
        print("NOTE: PHP email delivery requires separate real intake test.")
        return 0
    except Exception:
        if previous:
            print("Deploy failed. Attempting rollback...")
            for rel,old in reversed(previous):
                try:
                    if old is None:ftp.delete(rel)
                    else:put(ftp,rel,old)
                except Exception as exc:print("MANUAL ROLLBACK REQUIRED for",rel,str(exc))
        raise
    finally:
        if probe:
            try:ftp.delete(probe)
            except Exception:pass
        try:ftp.quit()
        except Exception:pass
if __name__=="__main__":sys.exit(main())
