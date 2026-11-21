/* ZaMaGui Business · localized progressive enhancements */
(()=>{'use strict';
 const lang=(document.documentElement.lang||location.pathname.split('/')[1]||'uk').slice(0,2);
 const copy={
  uk:{skip:'Перейти до вмісту',menu:'Меню',close:'Закрити меню',theme:'Змінити тему',sending:'Надсилання…',ok:'Запит отримано сервером. Номер: ',fail:'Не вдалося надіслати запит. Напишіть на business@zamagui.com.',cat:['Бізнес / AI','Простори','Партнери','Kids','Проєкти','Сайт / повідомити про помилку'],bugs:['Функціональність','Візуал / мобільна версія','Доступність','Мова / контент','Безпека (без секретів)','Інше']},
  ru:{skip:'Перейти к содержимому',menu:'Меню',close:'Закрыть меню',theme:'Сменить тему',sending:'Отправка…',ok:'Запрос принят сервером. Номер: ',fail:'Не удалось отправить запрос. Напиши на business@zamagui.com.',cat:['Бизнес / AI','Пространства','Партнёры','Kids','Проекты','Сайт / сообщить об ошибке'],bugs:['Функциональность','Визуал / мобильная версия','Доступность','Язык / контент','Безопасность (без секретов)','Другое']},
  en:{skip:'Skip to content',menu:'Menu',close:'Close menu',theme:'Change theme',sending:'Sending…',ok:'Request received by server. Reference: ',fail:'Could not submit. Email business@zamagui.com.',cat:['Business / AI','Spaces','Partners','Kids','Projects','Website / report a bug'],bugs:['Functionality','Visual / Mobile','Accessibility','Language / Content','Security (no secrets)','Other']}
 };
 const t=copy[lang]||copy.uk;
 const skip=document.querySelector('.skip');if(skip)skip.textContent=t.skip;
 document.querySelectorAll('.menu a.active,.langs a.active').forEach(a=>a.setAttribute('aria-current','page'));
 const header=document.querySelector('header.top'),nav=header?.querySelector('.menu'),langs=header?.querySelector('.langs');
 if(header&&nav&&langs){
   nav.id='business-nav';nav.setAttribute('aria-label',t.menu);
   const button=document.createElement('button');
   button.type='button';button.className='header-control menu-toggle';
   button.setAttribute('aria-controls',nav.id);button.setAttribute('aria-expanded','false');
   button.textContent=t.menu+' ☰';
   button.addEventListener('click',()=>{
     const open=nav.classList.toggle('is-open');
     button.setAttribute('aria-expanded',String(open));
     button.setAttribute('aria-label',open?t.close:t.menu);
   });
   header.querySelector('.wrap').appendChild(button);
   header.classList.add('enhanced');
   document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav.classList.contains('is-open')){nav.classList.remove('is-open');button.setAttribute('aria-expanded','false');button.focus();}});
   const themeButton=document.createElement('button');
   themeButton.className='header-control theme-toggle';themeButton.type='button';
   themeButton.textContent='◐';themeButton.setAttribute('aria-label',t.theme);themeButton.title=t.theme;
   langs.after(themeButton);
   const root=document.documentElement;
   let saved;try{saved=localStorage.getItem('zamagui-theme');}catch(_){}
   root.dataset.theme=saved==='dark'?'dark':'light';
   themeButton.setAttribute('aria-pressed',String(root.dataset.theme==='dark'));
   themeButton.addEventListener('click',()=>{const next=root.dataset.theme==='dark'?'light':'dark';root.dataset.theme=next;themeButton.setAttribute('aria-pressed',String(next==='dark'));try{localStorage.setItem('zamagui-theme',next);}catch(_){}});
 }
 document.querySelectorAll('form[data-intake]').forEach(form=>{
   const sel=form.querySelector('select[name="category"]');
   if(sel){const arr=form.querySelector('[name="kind"]')?.value==='bug'?t.bugs:t.cat;
     [...sel.options].forEach((opt,i)=>{if(i<arr.length){const canonical=opt.value;opt.textContent=arr[i];opt.value=canonical;}});
   }
   form.addEventListener('submit',async e=>{
     e.preventDefault();if(!form.reportValidity())return;
     const btn=form.querySelector('button[type=submit]');const status=form.querySelector('[role=status]');
     if(!btn||!status||btn.disabled)return;
     const label=btn.textContent;btn.disabled=true;btn.textContent=t.sending;status.textContent='';
     try{
       const res=await fetch('/api/lead.php',{method:'POST',body:new FormData(form),credentials:'same-origin',headers:{Accept:'application/json'}});
       const data=await res.json();if(!res.ok||!data.ok)throw new Error('server');
       status.textContent=t.ok+(data.reference||'—');form.reset();
     }catch(_){status.textContent=t.fail;}
     finally{btn.disabled=false;btn.textContent=label;}
   });
 });
})();