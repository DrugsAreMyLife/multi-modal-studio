import { expect, test } from '@playwright/test';

test('homepage loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Multi-Modal Generation Studio/i);
});
