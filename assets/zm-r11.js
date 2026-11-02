(()=>{
 'use strict';
 const root=document.querySelector('.z11-ecosystem');
 if(!root)return;
 const lang=root.dataset.locale||'uk';
 const tabs=[...document.querySelectorAll('.z11-map-tab')];
 const focusName=document.getElementById('z11-focus-name'), focusDesc=document.getElementById('z11-focus-desc'),focusLink=document.getElementById('z11-focus-link'),focusNum=document.querySelector('.z11-map-where-icon'),list=document.getElementById('z11-route-list'),initiativeList=document.getElementById('z11-initiative-list');
 if(!tabs.length||!focusName||!focusDesc||!focusLink||!list||!initiativeList)return;
 const arrow=' ↗';
 const txt=(value)=>document.createTextNode(value);
 const el=(tag,cls,content)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(content!==undefined)node.append(txt(content));return node};
 fetch('/assets/zm-r11-map.json',{cache:'force-cache'}).then(r=>{if(!r.ok)throw Error('Map data unavailable');return r.json()}).then(db=>{
  const data=db[lang]||db.uk;
  const valid=new Set(Object.keys(data.cards));
  const choose=(id)=>{
   if(!valid.has(id))return;
   const source=data.cards[id];
   tabs.forEach((b,i)=>{let selected=b.dataset.id===id;b.classList.toggle('is-current',selected);b.setAttribute('aria-pressed',String(selected));if(selected)focusNum.textContent=String(i+1).padStart(2,'0')});
   focusName.textContent=source.name;focusDesc.textContent=source.focus;focusLink.href=source.url;
   const frag=document.createDocumentFragment();
   for(const route of data.routes[id]||[]){
    const dest=data.cards[route.target];if(!dest)continue;
    const a=el('a','z11-route');a.href=dest.url;
    const meta=el('span','z11-route-small',source.name+' → '+dest.name);
    const strong=el('strong',null,route.title);strong.append(el('span',null,'↗'));
    a.append(meta,strong,el('span',null,route.description));frag.append(a);
   }
   list.replaceChildren(frag);
   const initiatives=document.createDocumentFragment();
   for(const item of data.initiatives[id]||[]){const a=el('a',null,item.name+arrow);a.href=item.url;initiatives.append(a)}
   initiativeList.replaceChildren(initiatives);
  };
  for(const tab of tabs)tab.addEventListener('click',()=>choose(tab.dataset.id));
  // Static markup is a usable Growth fallback if the script or JSON fails.
  choose('growth');
 }).catch(error=>console.warn('ZaMaGui ecosystem map:',error.message));
})();
