(() => {
 'use strict';
 const root=document.documentElement, body=document.body;
 const current=body.dataset.locale||'uk', page=body.dataset.page||'home';
 const localHref=(lng,p=page)=>'/' +(lng==='uk'?'':lng+'/')+(p==='home'?'':p+'.html');
 // Default light on first visit, persisted user choice only after interaction.
 let saved;try{saved=localStorage.getItem('zmg-theme')}catch(_){}
 root.dataset.theme=saved==='dark'?'dark':'light';
 const theme=document.getElementById('theme-toggle');
 theme?.addEventListener('click',()=>{let next=root.dataset.theme==='dark'?'light':'dark';root.dataset.theme=next;try{localStorage.setItem('zmg-theme',next)}catch(_){}});
 const menu=document.querySelector('.menu-btn'),mobile=document.getElementById('mobile-nav');
 menu?.addEventListener('click',()=>{let opened=menu.getAttribute('aria-expanded')==='true';menu.setAttribute('aria-expanded',String(!opened));mobile.hidden=opened});
 async function applyExtraLocale(lang,updateUrl=true){
  try{
   const res=await fetch('/locales/'+encodeURIComponent(lang)+'.json',{cache:'no-store'});
   if(!res.ok)throw Error('Locale file not available');
   const dict=await res.json();const keys=[...new Set([...document.querySelectorAll('[data-i18n]')].map(x=>x.dataset.i18n))];
   const missing=keys.filter(k=>typeof dict[k]!=='string'||!dict[k].trim());
   if(missing.length)throw Error('Missing '+missing.length+' translation keys: '+missing.slice(0,5).join(', '));
   document.querySelectorAll('[data-i18n]').forEach(node=>node.textContent=dict[node.dataset.i18n]);
   root.lang=lang;body.dataset.locale=lang;
   document.querySelectorAll('a[href^="/"]').forEach(a=>{let u=new URL(a.href);if(u.origin!==location.origin)return;u.searchParams.set('lang',lang);a.href=u.pathname+u.search+u.hash});
   document.title=(dict[page+'.title']||dict['hero_title']||'ZaMaGui')+' | ZaMaGui';
   if(updateUrl){let u=new URL(location.href);u.searchParams.set('lang',lang);history.replaceState(null,'',u)}
   const picker=document.getElementById('locale-picker');if(picker)picker.value=lang;
   return true;
  }catch(e){console.warn('Translation not applied:',e.message);if(updateUrl){alert('This language pack is not installed or incomplete: /locales/'+lang+'.json');const picker=document.getElementById('locale-picker');if(picker)picker.value=current}return false}
 }
 function changeLocale(lang){
  if(['uk','en','ru'].includes(lang)){
   const q=new URLSearchParams(location.search);q.delete('lang');location.href=localHref(lang)+(q.size?'?'+q:'');return;
  }
  applyExtraLocale(lang);
 }
 document.getElementById('locale-picker')?.addEventListener('change',e=>changeLocale(e.target.value));
 const requested=new URLSearchParams(location.search).get('lang');
 if(requested&&!['uk','en','ru'].includes(requested)&&/^(hu|sk|cs|es)$/.test(requested))applyExtraLocale(requested,false);

 const form=document.querySelector('form[data-lead]');
 if(form){
  const p=new URLSearchParams(location.search),interest=p.get('interest');
  const allowed={'growth':'Growth','kids':'Kids Elite','kids-elite':'Kids Elite','kids-talent':'Kids Talent','ai':'AI','guild':'Guild','partners':'Partners','marketplace':'Marketplace','capital':'Capital','franchise':'Franchise'};
  if(interest&&allowed[interest])form.elements.interest.value=allowed[interest];
  for(let key of ['utm_source','utm_medium','utm_campaign'])if(form.elements[key])form.elements[key].value=(p.get(key)||'').slice(0,120);
  fetch('/api/csrf.php',{credentials:'same-origin'}).then(r=>{if(!r.ok)throw Error('csrf');return r.json()}).then(v=>{form.elements.csrf_token.value=v.csrf_token||''}).catch(()=>{});
  form.addEventListener('submit',async e=>{
   e.preventDefault();const status=form.querySelector('[data-status]'), btn=form.querySelector('button[type=submit]');
   if(!form.checkValidity()){form.reportValidity();return;}
   if(!form.elements.email.value.trim()&&!form.elements.phone.value.trim()){status.textContent='Please provide an email or phone number.';return;}
   btn.disabled=true;status.textContent='…';
   try{if(!form.elements.csrf_token.value)throw Error('CSRF not configured');const r=await fetch(form.action,{method:'POST',credentials:'same-origin',body:new FormData(form)});const payload=await r.json();if(!r.ok||payload.ok!==true)throw Error(payload.message||'Delivery failed');status.textContent=({uk:'Звернення доставлено. Дякуємо!',en:'Enquiry delivered. Thank you!',ru:'Обращение доставлено. Спасибо!'})[body.dataset.locale]||'Submitted';form.reset();}
   catch(err){status.textContent=({uk:'Звернення не доставлено. Перевірте підключення форми.',en:'Enquiry not delivered. Please check form integration.',ru:'Обращение не доставлено. Проверьте интеграцию формы.'})[body.dataset.locale]||'Not delivered';console.warn('ZaMaGui delivery:',err.message)}finally{btn.disabled=false}
  });
 }
 const svg=document.getElementById('ecosystem-graph');
 if(svg){
  fetch('/assets/graph.json').then(r=>r.json()).then(data=>{
   const ns='http://www.w3.org/2000/svg',nodes=Object.fromEntries(data.nodes.map(x=>[x.id,x])); const name=n=>(n.labels&&n.labels[body.dataset.locale])||n.label;
   const linkEls=[],nodeEls=[];
   const make=(tag,attrs={},parent=svg)=>{let n=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,String(v)));parent.append(n);return n};
   data.edges.forEach(([a,b])=>{const x=nodes[a],y=nodes[b];const line=make('line',{x1:x.x,y1:x.y,x2:y.x,y2:y.y,class:'graph-link'});linkEls.push({a,b,line})});
   data.nodes.forEach((node)=>{const group=make('g',{class:'graph-node',role:'button',tabindex:0,'aria-label':name(node),'data-id':node.id});make('rect',{x:node.x-89,y:node.y-31,width:178,height:62},group);make('circle',{cx:node.x-66,cy:node.y,r:6},group);let text=make('text',{x:node.x-51,y:node.y+6},group);text.textContent=name(node);nodeEls.push({id:node.id,group});group.addEventListener('click',()=>choose(node.id));group.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose(node.id)}})});
   function choose(id){let node=nodes[id],neighbours=data.edges.filter(e=>e.includes(id)).map(e=>e.find(v=>v!==id));document.getElementById('graph-selection').textContent=name(node);document.getElementById('graph-description').textContent=neighbours.length+' connections · '+(body.dataset.locale==='uk'?'Пов’язані напрями':body.dataset.locale==='ru'?'Связанные направления':'Connected areas');document.getElementById('graph-target').href=localHref(body.dataset.locale,node.page||id);let container=document.getElementById('graph-neighbors');container.textContent='';neighbours.forEach(n=>{let a=document.createElement('a');a.href=localHref(body.dataset.locale,nodes[n].page||n);a.textContent=name(nodes[n])+' ↗';container.append(a)});linkEls.forEach(o=>o.line.classList.toggle('is-active',o.a===id||o.b===id));nodeEls.forEach(o=>o.group.classList.toggle('is-selected',o.id===id));}
   document.getElementById('graph-reset')?.addEventListener('click',()=>{linkEls.forEach(o=>o.line.classList.remove('is-active'));nodeEls.forEach(o=>o.group.classList.remove('is-selected'));document.getElementById('graph-selection').textContent='ZaMaGui';document.getElementById('graph-neighbors').textContent='';document.getElementById('graph-target').href=localHref(body.dataset.locale,'home')});
  }).catch(e=>console.warn('Graph is unavailable:',e));
 }
})();
