#!/usr/bin/env python3
"""Build Business pages with canonical ZaMaGui styles and approved artwork.
Source pages remain unchanged. Use --in-place only in ephemeral CI checkout.
"""
import argparse, html, re, shutil
from pathlib import Path
from urllib.parse import quote
ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/"business-site"
LANGS=("uk","ru","en")
DIRECTIONS=("growth","kids","ai","guild","marketplace","capital")
STYLES=("site.css","vivid.css","approved.css")
TRANSLATIONS={
 "uk":("Екосистема","Теми та Системи","Рішення","Дорожня карта","Про нас","Обговорити проєкт","Напрями екосистеми"),
 "ru":("Экосистема","Темы и Системы","Решения","Дорожная карта","О нас","Обсудить проект","Направления экосистемы"),
 "en":("Ecosystem","Sparks & Engines","Solutions","Roadmap","About us","Discuss a project","Ecosystem directions")
}
def canonical_header():
    content=(ROOT/"index.html").read_text(encoding="utf-8")
    found=re.search(r'<header class="site-header">.*?</header>',content,re.S)
    if not found: raise ValueError("Canonical header not found")
    return found.group(0)
def header_for(template,lang):
    t=re.sub(r'href="/(?!/)([^"]*)"',lambda m:'href="https://zamagui.com/'+m.group(1)+'"',template)
    t=t.replace('href="https://zamagui.com/contact.html"',f'href="/{lang}/contact/"')
    t=re.sub(r'(<option\s+)(selected=""\s+)?(value="(?:uk|ru|en)")',
       lambda m:m.group(1)+('selected="" ' if m.group(3)==f'value="{lang}"' else '')+m.group(3),t)
    for old,new in zip(TRANSLATIONS["uk"],TRANSLATIONS[lang]):
        t=t.replace(">"+old+"<",">"+new+"<")
    return t
def six_directions(lang):
    tiles=[]
    for name in DIRECTIONS:
        title="AI / IT" if name=="ai" else name.title()
        tiles.append(f'<a class="zmg-direction" href="https://zamagui.com/{name}.html"><img loading="lazy" decoding="async" width="430" height="250" alt="" src="/assets/zmg-shared/entry-{name}.webp"><strong>{title}</strong><span aria-hidden="true">↗</span></a>')
    title=TRANSLATIONS[lang][6]
    return '<section class="zmg-directions"><div class="wrap"><span class="eyebrow">ZaMaGui / 06</span><h2>'+title+'</h2><div class="zmg-direction-grid">'+''.join(tiles)+'</div></div></section>'
def enrich(content,lang,rel,template):
    content,num=re.subn(r'<header class="top">.*?</header>',lambda _:header_for(template,lang),content,count=1,flags=re.S)
    if num!=1:raise ValueError(f"Header not found: {rel}")
    content=re.sub(r'<html\b','<html data-theme="light"',content,count=1)
    content=re.sub(r'<body\b','<body class="zmg-business"',content,count=1)
    tags=''.join(f'<link rel="stylesheet" href="/assets/zmg-shared/{s}?v=20261104">' for s in STYLES)
    tags+='<link rel="icon" type="image/svg+xml" href="/assets/zmg-shared/favicon.svg">'
    tags+='<link rel="stylesheet" href="/assets/brand-overrides.css?v=20261104">'
    tags+='<script defer src="/assets/brand-controls.js?v=20261104"></script>'
    content=content.replace("</head>",tags+"</head>",1)
    section=rel.parts[1] if len(rel.parts)>2 else "home"
    images={"services":"growth","spaces":"home","partners":"guild","projects":"growth","investments":"capital","kids":"kids","ecosystem":"home","contact":"home","bug-bounty":"ai"}
    art=images.get(section,"home")
    visual=f'<div class="zmg-biz-art"><img width="900" height="590" decoding="async" loading="eager" alt="" src="/assets/zmg-shared/{art}-light.webp"></div>'
    content,num=re.subn(r'(<section class="hero"><div class="wrap">)(.*?)(</div></section>)',
        lambda m:m.group(1)+'<div class="zmg-biz-hero-copy">'+m.group(2)+'</div>'+visual+m.group(3),
        content,count=1,flags=re.S)
    if num!=1:raise ValueError(f"Hero not found: {rel}")
    def card(m):
        raw=m.group(0)
        h=re.search(r'<h3>(.*?)</h3>',raw,re.S)
        if not h:return raw
        title=html.unescape(re.sub('<[^>]+>','',h.group(1))).strip()
        return raw.replace(f'href="/{lang}/contact/"',f'href="/{lang}/contact/?service={quote(title,safe="")}"')
    content=re.sub(r'<article class="card">.*?</article>',card,content,flags=re.S)
    if rel==Path(lang)/"index.html":
        content=content.replace('</section><section class="section">','</section>'+six_directions(lang)+'<section class="section">',1)
    return content
def build(target):
    if target.resolve()!=SRC.resolve():
        if target.exists():shutil.rmtree(target)
        shutil.copytree(SRC,target)
    else:target=SRC
    shared=target/"assets"/"zmg-shared"
    shared.mkdir(parents=True,exist_ok=True)
    for filename in STYLES+("brand.svg","favicon.svg"):
        shutil.copyfile(ROOT/"assets"/filename,shared/filename)
    for name in ("home",)+DIRECTIONS:
        shutil.copyfile(ROOT/"assets"/"approved"/(name+"-light.webp"),shared/(name+"-light.webp"))
    for name in DIRECTIONS:
        file=ROOT/"assets"/"approved"/("entry-"+name+"-clean.webp")
        if not file.exists() and name in ("capital","marketplace"):
            file=ROOT/"assets"/"approved"/("entry-"+name+"-fresh.webp")
        if not file.exists():raise FileNotFoundError(file)
        shutil.copyfile(file,shared/("entry-"+name+".webp"))
    template=canonical_header()
    count=0
    for lang in LANGS:
        for f in sorted((target/lang).rglob("index.html")):
            f.write_text(enrich(f.read_text(encoding="utf-8"),lang,f.relative_to(target),template),encoding="utf-8")
            count+=1
    if count!=36:raise ValueError(f"Expected 36 localized pages; found {count}")
    for asset in ("brand-overrides.css","brand-controls.js"):
        if not (target/"assets"/asset).is_file():raise FileNotFoundError(asset)
    print(f"PASS: {count} real business pages; shared canonical assets; {target}")
if __name__=="__main__":
    a=argparse.ArgumentParser()
    a.add_argument("--in-place",action="store_true",help="Only use in ephemeral GitHub runner")
    a.add_argument("--out",type=Path,default=ROOT/"dist"/"business-site")
    opt=a.parse_args()
    build(SRC if opt.in_place else opt.out)
