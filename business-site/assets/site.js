(()=>{'use strict';
const lang=document.documentElement.lang||'uk';
const messages={
 uk:{loading:'Підключення захищеної форми…',ready:'Заповніть форму для звернення.',failed:'Система заявок тимчасово недоступна. Повторіть спробу пізніше.',sending:'Передаємо заявку в CRM…',ok:'Заявку збережено в CRM. Номер: ',invalid:'Перевірте поля форми.'},
 ru:{loading:'Подключаем защищённую форму…',ready:'Заполните форму обращения.',failed:'Система заявок временно недоступна. Повторите попытку позднее.',sending:'Передаём заявку в CRM…',ok:'Заявка сохранена в CRM. Номер: ',invalid:'Проверьте поля формы.'},
 en:{loading:'Preparing a secure form…',ready:'Complete the enquiry form.',failed:'The enquiry service is temporarily unavailable. Try again later.',sending:'Sending your request to CRM…',ok:'Recorded in CRM. Reference: ',invalid:'Please check the form fields.'}
};
const msg=messages[lang]||messages.uk;
document.querySelectorAll('form[data-intake]').forEach(form=>{
 const button=form.querySelector('button[type=submit]'),status=form.querySelector('[role=status]');
 if(!button||!status)return;
 const csrf=document.createElement('input');csrf.type='hidden';csrf.name='csrf_token';form.append(csrf);
 button.disabled=true;status.textContent=msg.loading;
 let ready=false;
 fetch('/api/csrf.php',{method:'GET',cache:'no-store',credentials:'same-origin'}).then(async r=>{if(!r.ok)throw Error('csrf');const data=await r.json();if(!/^[0-9a-f]{64}$/i.test(data.csrf_token||''))throw Error('csrf');csrf.value=data.csrf_token;ready=true;button.disabled=false;status.textContent=msg.ready}).catch(()=>{status.textContent=msg.failed});
 form.addEventListener('submit',async event=>{
  event.preventDefault();
  if(!ready||!form.reportValidity()){if(!form.checkValidity())status.textContent=msg.invalid;return}
  button.disabled=true;status.textContent=msg.sending;
  try{
   const response=await fetch('/api/lead.php',{method:'POST',body:new FormData(form),credentials:'same-origin',headers:{Accept:'application/json'}});
   const result=await response.json().catch(()=>({}));
   if(!response.ok||result.ok!==true||!result.reference)throw Error('not_saved');
   status.textContent=msg.ok+result.reference;form.reset();
  }catch(_){status.textContent=msg.failed}
  finally{button.disabled=false}
 });
});
})();
