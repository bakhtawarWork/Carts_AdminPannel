import { test, expect } from '@playwright/test';

test('Basic test', async ({ page }) => {
  await page.goto('http://localhost:3000');

  await expect(page).toHaveTitle('Sign in | Admin');
});