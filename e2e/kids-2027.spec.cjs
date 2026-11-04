const {test,expect}=require('@playwright/test');
const locales=[['uk','/kids-2027.html'],['ru','/ru/kids-2027.html'],['en','/en/kids-2027.html']];
const widths=[320,390,768,1440,1920];
for(const [lang,path] of locales)for(const width of widths){
 test(lang+' Kids 2027 layout and track selection '+width,async({page})=>{
  await page.setViewportSize({width,height:940});
  await page.goto(path);
  await expect(page.locator('.zmg27 h1')).toBeVisible();
  await expect(page.locator('img[src="/assets/approved/kids-light.webp"]')).toHaveCount(1);
  await expect(page.locator('.quarter:visible')).toHaveCount(4);
  await page.locator('[data-duration-button="24"]').click();
  await expect(page.locator('.quarter:visible')).toHaveCount(8);
  await page.locator('[data-cohort-button="student-17-22"]').click();
  await expect(page.locator('[name=cohort]')).toHaveValue('student-17-22');
  await page.locator('[name=age]').selectOption('17');
  await expect(page.locator('[name=role]')).toHaveValue('guardian');
  await expect(page.locator('[name=role] option[value=self]')).toBeDisabled();
  await page.locator('[name=age]').selectOption('19');
  await expect(page.locator('[name=role] option[value=self]')).toBeEnabled();
  for(const theme of ['light','dark']){
   await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
   const s=await page.evaluate(()=>[document.documentElement.scrollWidth,window.innerWidth]);
   expect(s[0]).toBeLessThanOrEqual(s[1]+2);
  }
 });
}
test('pre-registration success is shown only after CRM server response (mocked)',async({page})=>{
 await page.goto('/ru/kids-2027.html');
 await page.route('**/api/kids-preregister.php',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,reference:'TEST-ONLY-0001'})}));
 await expect(page.locator('#z27-form button[type=submit]')).toBeEnabled();
 await page.locator('[name=name]').fill('Тестовый представитель');
 await page.locator('[name=email]').fill('parent@example.test');
 await page.locator('[name=consent]').check();
 await page.locator('#z27-form button[type=submit]').click();
 await expect(page.locator('#z27-status')).toContainText('TEST-ONLY-0001');
 await expect(page.locator('#z27-status')).toHaveAttribute('data-type','success');
});
test('CRM failure never confirms registration (mocked)',async({page})=>{
 await page.goto('/en/kids-2027.html');
 await page.route('**/api/kids-preregister.php',r=>r.fulfill({status:503,contentType:'application/json',body:'{"ok":false,"error":"crm_unavailable"}'}));
 await expect(page.locator('#z27-form button[type=submit]')).toBeEnabled();
 await page.locator('[name=name]').fill('Test Guardian');
 await page.locator('[name=email]').fill('parent@example.test');
 await page.locator('[name=consent]').check();
 await page.locator('#z27-form button[type=submit]').click();
 await expect(page.locator('#z27-status')).toHaveAttribute('data-type','error');
 await expect(page.locator('#z27-status')).not.toContainText('Reference:');
});
test('CSRF is mandatory for real PHP endpoint (no CRM writes)',async({request})=>{
 const a=await request.post('/api/kids-preregister.php',{form:{name:'Test Person',email:'test@example.test'}});
 expect(a.status()).toBe(403);
 const b=await request.get('/api/kids-preregister.php');
 expect(b.status()).toBe(405);
});
