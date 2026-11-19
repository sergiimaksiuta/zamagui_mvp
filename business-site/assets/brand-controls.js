(()=>{'use strict';
const root=document.documentElement,current=root.lang||'uk';
let saved;try{saved=localStorage.getItem('zmg-theme')}catch(_){}
root.dataset.theme=saved==='dark'?'dark':'light';
document.getElementById('theme-toggle')?.addEventListener('click',()=>{const next=root.dataset.theme==='dark'?'light':'dark';root.dataset.theme=next;try{localStorage.setItem('zmg-theme',next)}catch(_){}});
const menu=document.querySelector('.menu-btn'),mobile=document.getElementById('mobile-nav');
menu?.addEventListener('click',()=>{const opened=menu.getAttribute('aria-expanded')==='true';menu.setAttribute('aria-expanded',String(!opened));if(mobile)mobile.hidden=opened});
const picker=document.getElementById('locale-picker');
if(picker){picker.value=current;picker.addEventListener('change',()=>{const lang=picker.value;if(!['uk','ru','en'].includes(lang))return;const parts=location.pathname.split('/').filter(Boolean);if(parts[0]&&['uk','ru','en'].includes(parts[0]))parts[0]=lang;else parts.unshift(lang);location.assign('/'+parts.join('/')+(location.pathname.endsWith('/')?'/':'')+location.search+location.hash)})}
const terms={uk:'Щодо послуги: ',ru:'По услуге: ',en:'Service requested: '};
const service=(new URLSearchParams(location.search).get('service')||'').trim().slice(0,140);
if(service){const area=document.querySelector('form[data-intake] textarea[name=message]');if(area&&!area.value)area.value=(terms[current]||terms.uk)+service+'\n';}
})();
