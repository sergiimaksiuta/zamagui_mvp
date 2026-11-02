const { test, expect } = require('@playwright/test');

const languages = [
  { locale: 'uk', prefix: '' },
  { locale: 'ru', prefix: '/ru' },
  { locale: 'en', prefix: '/en' },
];

for (const { locale, prefix } of languages) {
  test(`homepage works in ${locale}`, async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    const response = await page.goto(`${prefix}/`, { waitUntil: 'networkidle' });
    expect(response.ok()).toBeTruthy();
    await expect(page.locator('body')).toHaveAttribute('data-locale', locale);
    await expect(page.locator('h1').first()).toBeVisible();
    const themeButton = page.locator('#theme-toggle');
    await expect(themeButton).toBeVisible();
    const before = await page.locator('html').getAttribute('data-theme');
    await themeButton.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', before === 'dark' ? 'light' : 'dark');
    expect(pageErrors).toEqual([]);
  });

  test(`ecosystem selection and links work in ${locale}`, async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    const response = await page.goto(`${prefix}/ecosystem.html`, { waitUntil: 'networkidle' });
    expect(response.ok()).toBeTruthy();
    await expect(page.locator('body')).toHaveAttribute('data-locale', locale);
    await expect(page.locator('.z11-map-tab')).toHaveCount(6);
    const kids = page.locator('.z11-map-tab[data-id="kids"]');
    await kids.click();
    await expect(kids).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#z11-focus-name')).toHaveText('Kids');
    await expect(page.locator('#z11-focus-link')).toHaveAttribute('href', `${prefix}/kids.html`);
    expect(await page.locator('#z11-route-list .z11-route').count()).toBeGreaterThan(0);
    expect(pageErrors).toEqual([]);
  });
}

for (const width of [320, 390, 768, 1440, 1920]) {
  for (const path of ['/', '/ecosystem.html']) {
    test(`no major horizontal overflow at ${width}px on ${path}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      const response = await page.goto(path, { waitUntil: 'networkidle' });
      expect(response.ok()).toBeTruthy();
      const overflow = await page.evaluate(() => {
        const doc = document.documentElement;
        return doc.scrollWidth - window.innerWidth;
      });
      expect(overflow, `Horizontal overflow at ${width}px: ${path}`).toBeLessThanOrEqual(4);
    });
  }
}
