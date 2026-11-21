import { expect, test } from '@playwright/test';

test('daily study loads, days differ, and the Siddur path advances', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/');

  // Today: units render, with Hebrew marked RTL.
  const cards = page.getByTestId('unit-card');
  await expect(cards.first()).toBeVisible();
  await expect(page.locator('.hebrew[dir="rtl"][lang="he"]').first()).toBeVisible();
  const todayIds = await cards.evaluateAll((els) => els.map((e) => e.getAttribute('data-unit-id')!.slice(11)));

  // Next day shows different content.
  await page.getByRole('button', { name: 'Next day' }).click();
  await expect
    .poll(async () => cards.evaluateAll((els) => els.map((e) => e.getAttribute('data-unit-id')!.slice(11))))
    .not.toEqual(todayIds);

  // Siddur: complete the first unit, reload, and the second is shown.
  await page.getByRole('link', { name: 'Siddur' }).click();
  await expect(page.getByTestId('siddur-position')).toHaveText('Unit 1 of 3');
  await page.getByRole('button', { name: 'Mark complete' }).click();
  await expect(page.getByTestId('siddur-position')).toHaveText('Unit 2 of 3');
  await page.reload();
  await expect(page.getByTestId('siddur-position')).toHaveText('Unit 2 of 3');

  // Settings: switching to English removes Hebrew from the daily study.
  await page.getByRole('link', { name: 'Settings' }).click();
  await page.getByLabel('Language Mode').selectOption('english');
  await page.getByRole('button', { name: 'Save' }).click();
  await page.getByRole('link', { name: 'Today' }).click();
  await expect(cards.first()).toBeVisible();
  await expect(page.locator('.hebrew')).toHaveCount(0);

  expect(errors).toEqual([]);
});
