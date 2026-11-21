const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

const origin = 'http://127.0.0.1:4174';
const locales = ['uk', 'ru', 'en'];
const localeCopy = {
  uk: { skip: 'Перейти до вмісту', ok: 'Запит отримано сервером.' },
  ru: { skip: 'Перейти к содержимому', ok: 'Запрос принят сервером.' },
  en: { skip: 'Skip to content', ok: 'Request received by server.' },
};

// All external brand imagery is served from the SAME approved repository files.
// Tests remain reproducible even when public website availability changes.
test.beforeEach(async ({ page }) => {
  await page.route(/^https:\/\/zamagui\.com\/assets\//, async route => {
    const url = new URL(route.request().url());
    const relative = decodeURIComponent(url.pathname).replace(/^\//, '');
    const assetPath = path.join(process.cwd(), relative);
    if (!assetPath.startsWith(path.join(process.cwd(), 'assets') + path.sep) ||
        !fs.existsSync(assetPath)) {
      await route.fulfill({ status: 404, body: 'Missing approved asset' });
      return;
    }
    await route.fulfill({ path: assetPath });
  });
});

for (const locale of locales) {
  test('Business directory: localized layout, images and controls in ' + locale, async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(origin + '/' + locale + '/', { waitUntil: 'networkidle' });
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect(page.locator('.skip')).toHaveText(localeCopy[locale].skip);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.cards .card')).toHaveCount(6);
    await expect(page.locator('.hero-art img')).toBeVisible();
    const broken = await page.locator('img').evaluateAll(imgs =>
      imgs.filter(img => !img.complete || img.naturalWidth === 0).map(img => img.src));
    expect(broken, 'Approved imagery should load').toEqual([]);
    await page.locator('.theme-toggle').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.locator('.theme-toggle').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    expect(errors).toEqual([]);
  });

  test('Business directory: mobile menu keyboard accessibility in ' + locale, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(origin + '/' + locale + '/');
    const toggle = page.locator('.menu-toggle');
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#business-nav')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  test('Business contact: form response stays in locale ' + locale, async ({ page }) => {
    await page.route('**/api/lead.php', route =>
      route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ ok: true, reference: 'QA-123' }) }));
    await page.goto(origin + '/' + locale + '/contact/');
    const form = page.locator('form[data-intake]');
    await form.locator('input[name="name"]').fill('Test User');
    await form.locator('input[name="email"]').fill('qa@example.test');
    await form.locator('textarea[name="message"]').fill('This is a QA-only example request, not a live lead.');
    await form.locator('input[name="consent"]').check();
    await form.locator('button[type="submit"]').click();
    await expect(form.locator('[role="status"]')).toContainText(localeCopy[locale].ok);
    await expect(form.locator('[role="status"]')).toContainText('QA-123');
  });

  test('Business pages: no horizontal overflow at 320–1920px in ' + locale, async ({ page }) => {
    for (const route of ['', 'services/', 'projects/', 'partners/']) {
      for (const width of [320, 360, 390, 768, 1024, 1440, 1920]) {
        await page.setViewportSize({ width, height: 900 });
        const response = await page.goto(origin + '/' + locale + '/' + route, { waitUntil: 'domcontentloaded' });
        expect(response.ok()).toBeTruthy();
        const overflow = await page.evaluate(() =>
          document.documentElement.scrollWidth - window.innerWidth);
        expect(overflow, locale + '/' + route + ' at ' + width + 'px').toBeLessThanOrEqual(3);
      }
    }
  });
}

test('Business project headings are localized in ru and uk', async ({ page }) => {
  for (const locale of ['ru', 'uk']) {
    await page.goto(origin + '/' + locale + '/projects/');
    const headings = await page.locator('.cards h3').allTextContents();
    expect(headings).not.toContain('Growth & owner advisory');
    expect(headings).not.toContain('Business Academy');
    await expect(page.locator('.cards .card')).toHaveCount(18);
  }
});
