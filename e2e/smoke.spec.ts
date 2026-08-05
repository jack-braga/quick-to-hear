import { expect, test } from '@playwright/test';

// Boots the production preview under the Pages base path and confirms the shell is
// interactive: Home renders and the theme toggle flips the <html> class.
test('shell boots and renders Home', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { name: /prepare a bible study/i })).toBeVisible();
});

test('theme toggle flips the document theme', async ({ page }) => {
  await page.goto('./');
  const toggle = page.getByRole('button', { name: /theme:/i });

  // Force a known starting point (light), then cycle to dark.
  await page.evaluate(() => localStorage.setItem('qth/theme', 'light'));
  await page.reload();
  await expect.poll(() => page.evaluate(() => document.documentElement.className)).toContain(
    'light',
  );

  await toggle.click(); // light -> dark
  await expect
    .poll(() => page.evaluate(() => document.documentElement.classList.contains('dark')))
    .toBe(true);
});
