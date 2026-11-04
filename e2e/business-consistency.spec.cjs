const { test, expect } = require('@playwright/test');
const langs = ['uk','ru','en'];
const viewports = [320,390,768,1440,1920];
for(const lang of langs)for(const width of viewports){
  test(lang+': shared header, artwork, six directions, no horizontal overflow at '+width+'px',async({page})=>{
    await page.setViewportSize({width,height:900});
    await page.goto('/'+lang+'/');
    await expect(page.locator('.site-header .brand')).toBeVisible();
    await expect(page.locator('.zmg-direction')).toHaveCount(6);
    await expect(page.locator('.zmg-biz-art img')).toBeVisible();
    const measured=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,inner:window.innerWidth}));
    expect(measured.scroll).toBeLessThanOrEqual(measured.inner+2);
    await page.goto('/'+lang+'/contact/?service='+encodeURIComponent('Growth audit'));
    await expect(page.locator('textarea[name="message"]')).toHaveValue(/Growth audit/);
    await expect(page.locator('.site-header')).toBeVisible();
    const contact=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,inner:window.innerWidth}));
    expect(contact.scroll).toBeLessThanOrEqual(contact.inner+2);
  });
}
