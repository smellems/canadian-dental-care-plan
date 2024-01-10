import { expect, test } from '@playwright/test';

test('should navigate to index', async ({ page }) => {
  await page.goto('/');

  const screenId = await page.locator('span[property="identifier"]').textContent();
  expect(screenId).toBe('CDCP-0001');
});

test('receives mocked responses in loaders', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });

  const greeting = page.locator('#greeting');
  await expect(greeting).toHaveText('Hello, John');
});
