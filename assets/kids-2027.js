(()=>{'use strict';
const root=document.querySelector('.zmg27');if(!root)return;
const lang=root.dataset.lang||'uk';
const dict={
 uk:{school:'12–16 років · Шкільна траєкторія',student:'17–22 роки · Студентська траєкторія',one:'1 рік · 4 квартали',two:'2 роки · 8 кварталів',guardian:'Для учасників до 18 років заявку подає один з батьків або законний представник.',adult:'Повнолітній учасник може подати заявку самостійно.',loading:'Готуємо захищену форму…',ready:'Заповніть поля та надішліть заявку.',unavailable:'Реєстрація тимчасово недоступна: сервер прийому ще не налаштований.',sending:'Зберігаємо заявку в CRM…',error:'Заявка не підтверджена. Перевірте поля або спробуйте пізніше.',success:'Заявку збережено. Номер звернення: ',minor:'Для учасників до 18 років потрібен контакт батьків або законного представника.'},
 ru:{school:'12–16 лет · Школьная траектория',student:'17–22 года · Студенческая траектория',one:'1 год · 4 квартала',two:'2 года · 8 кварталов',guardian:'Для участников до 18 лет заявку подаёт родитель или законный представитель.',adult:'Совершеннолетний участник может подать заявку самостоятельно.',loading:'Готовим защищённую форму…',ready:'Заполните поля и отправьте заявку.',unavailable:'Регистрация временно недоступна: сервер приёма ещё не настроен.',sending:'Сохраняем заявку в CRM…',error:'Заявка не подтверждена. Проверьте поля или повторите позднее.',success:'Заявка сохранена. Номер обращения: ',minor:'Для участников до 18 лет нужен контакт родителя или законного представителя.'},
 en:{school:'Ages 12–16 · School track',student:'Ages 17–22 · Student track',one:'1 year · 4 quarters',two:'2 years · 8 quarters',guardian:'For participants under 18, a parent or legal guardian must submit the request.',adult:'Participants aged 18+ may register their interest directly.',loading:'Preparing the secure form…',ready:'Complete the fields and submit your request.',unavailable:'Registration is temporarily unavailable while the server is being configured.',sending:'Saving your request to CRM…',error:'We could not confirm your request. Check the fields or try again later.',success:'Request saved. Reference: ',minor:'A parent or guardian must submit the request for participants under 18.'}
};
const t=dict[lang]||dict.uk;
const form=root.querySelector('#z27-form'),submit=form?.querySelector('button[type=submit]'),status=root.querySelector('#z27-status');
if(!form||!submit||!status)return;
const cInput=form.querySelector('[name=cohort]'),dInput=form.querySelector('[name=duration]'),aInput=form.querySelector('[name=age]'),role=form.querySelector('[name=role]');
let cohort='school-12-16',duration='12',tokenReady=false;
const setStatus=(str,type='')=>{status.textContent=str;status.dataset.type=type};
const updateAge=()=>{
 const ages=cohort==='school-12-16'?[12,13,14,15,16]:[17,18,19,20,21,22];const previous=Number(aInput.value);
 aInput.replaceChildren(...ages.map(n=>{const o=document.createElement('option');o.value=String(n);o.textContent=String(n);return o}));
 aInput.value=ages.includes(previous)?String(previous):cohort==='school-12-16'?'14':'19';
 updateRole();
};
const updateRole=()=>{
 const minor=Number(aInput.value)<18;
 [...role.options].forEach(o=>{o.disabled=minor&&o.value==='self'});
 if(minor)role.value='guardian';else if(!role.value)role.value='self';
 root.querySelector('#z27-guardian-note').textContent=minor?t.guardian:t.adult;
};
function select(nextC,nextD){
 cohort=nextC;duration=nextD;cInput.value=cohort;dInput.value=duration;
 root.querySelectorAll('[data-cohort-button]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.cohortButton===cohort)));
 root.querySelectorAll('[data-duration-button]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.durationButton===duration)));
 root.querySelectorAll('[data-only-year2]').forEach(node=>node.hidden=duration==='12');
 root.querySelectorAll('[data-school]').forEach(node=>node.hidden=cohort!=='school-12-16');
 root.querySelectorAll('[data-student]').forEach(node=>node.hidden=cohort!=='student-17-22');
 root.querySelector('#z27-choice-label').textContent=(cohort==='school-12-16'?t.school:t.student)+' · '+(duration==='12'?t.one:t.two);
 updateAge();
}
root.querySelectorAll('[data-cohort-button]').forEach(b=>b.addEventListener('click',()=>select(b.dataset.cohortButton,duration)));
root.querySelectorAll('[data-duration-button]').forEach(b=>b.addEventListener('click',()=>select(cohort,b.dataset.durationButton)));
root.querySelectorAll('[data-choose]').forEach(b=>b.addEventListener('click',()=>{select(b.dataset.choose||cohort,b.dataset.years||duration);root.querySelector('#z27-register').scrollIntoView({behavior:'smooth',block:'start'});}));
aInput.addEventListener('change',updateRole);
const params=new URLSearchParams(location.search);
select(params.get('cohort')==='student-17-22'?'student-17-22':'school-12-16',params.get('duration')==='24'?'24':'12');
submit.disabled=true;setStatus(t.loading);
fetch('/api/csrf.php',{credentials:'same-origin',cache:'no-store'}).then(async r=>{
 if(!r.ok)throw Error('csrf');const data=await r.json();
 if(!data.csrf_token||!/^[a-f0-9]{64}$/i.test(data.csrf_token))throw Error('csrf');
 form.elements.csrf_token.value=data.csrf_token;tokenReady=true;submit.disabled=false;setStatus(t.ready);
}).catch(()=>setStatus(t.unavailable,'error'));
form.addEventListener('submit',async event=>{
 event.preventDefault();
 if(!tokenReady||!form.reportValidity())return;
 if(Number(aInput.value)<18&&role.value!=='guardian'){setStatus(t.minor,'error');return}
 if(form.elements.website.value)return;
 submit.disabled=true;setStatus(t.sending);
 try{
  const result=await fetch('/api/kids-preregister.php',{method:'POST',body:new FormData(form),credentials:'same-origin',headers:{Accept:'application/json'}});
  const response=await result.json().catch(()=>({}));
  if(!result.ok||response.ok!==true||!response.reference)throw Error(response.error||'delivery');
  setStatus(t.success+response.reference,'success');
  form.querySelectorAll('input:not([type=hidden]),select').forEach(el=>{el.disabled=true});
  submit.textContent='✓';
 }catch(_){setStatus(t.error,'error');submit.disabled=false;}
});
})();
