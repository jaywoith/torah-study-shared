import { expect, test } from '@playwright/test';
import { E2E_PASSPHRASE } from '../playwright.config';

const unitIds = (page: import('@playwright/test').Page) =>
  page.getByTestId('unit-card').evaluateAll((els) => els.map((e) => e.getAttribute('data-unit-id')!.slice(11)));

test('sign in, study, progress persists on the server, sign out', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));

  // Sign in (wrong passphrase first).
  await page.goto('/');
  await page.getByLabel('Passphrase').fill('wrong');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('alert')).toHaveText('Incorrect passphrase.');
  await page.getByLabel('Passphrase').fill(E2E_PASSPHRASE);
  await page.getByRole('button', { name: 'Sign in' }).click();

  // Today: units render, with Hebrew marked RTL.
  const cards = page.getByTestId('unit-card');
  await expect(cards.first()).toBeVisible();
  await expect(page.locator('.hebrew[dir="rtl"][lang="he"]').first()).toBeVisible();

  // Mark the first unit done; it survives a reload (stored on the server).
  await expect(page.getByTestId('done-summary')).toHaveText(/^0 of \d+ done$/);
  await cards.first().getByRole('button', { name: 'Mark done' }).click();
  await expect(page.getByTestId('done-summary')).toHaveText(/^1 of \d+ done$/);
  await page.reload();
  await expect(page.getByTestId('done-summary')).toHaveText(/^1 of \d+ done$/);

  // Next day shows different content, with nothing done yet.
  const todayIds = await unitIds(page);
  await page.getByRole('button', { name: 'Next day' }).click();
  await expect.poll(() => unitIds(page)).not.toEqual(todayIds);
  await expect(page.getByTestId('done-summary')).toHaveText(/^0 of \d+ done$/);

  // Siddur: complete the first unit; it survives a reload.
  await page.getByRole('link', { name: 'Siddur' }).click();
  await expect(page.getByTestId('siddur-position')).toHaveText('Unit 1 of 3');
  await page.getByRole('button', { name: 'Mark complete' }).click();
  await expect(page.getByTestId('siddur-position')).toHaveText('Unit 2 of 3');
  await page.reload();
  await expect(page.getByTestId('siddur-position')).toHaveText('Unit 2 of 3');

  // Settings saved on the server: English mode removes Hebrew, also after reload.
  await page.getByRole('link', { name: 'Settings' }).click();
  await page.getByLabel('Language Mode').selectOption('english');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('status')).toHaveText('Saved');
  await page.getByRole('link', { name: 'Today' }).click();
  await page.reload();
  await expect(cards.first()).toBeVisible();
  await expect(page.locator('.hebrew')).toHaveCount(0);

  // Sign out returns to the login screen.
  await page.getByRole('link', { name: 'Settings' }).click();
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();

  expect(errors).toEqual([]);
});
