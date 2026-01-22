import { test, expect } from '@playwright/test';

test('marketing homepage loads', async ({ page }) => {
  const response = await page.goto('/');
  expect(response, 'expected a response from /').not.toBeNull();
  expect(response?.status(), 'expected a successful status code').toBeLessThan(400);
});
