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

  // Today: units render, with Hebrew marked RTL; the reader opens and closes.
  const cards = page.getByTestId('unit-card');
  await expect(cards.first()).toBeVisible();
  await expect(page.locator('.hebrew[dir="rtl"][lang="he"]').first()).toBeVisible();
  await page.getByRole('button', { name: 'Continue reading' }).click();
  await expect(page.locator('.reader')).toBeVisible();
  await page.getByRole('button', { name: 'Back to Today' }).click();
  await expect(page.locator('.reader')).toHaveCount(0);

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

  // Siddur: overview shows where you are; continue, complete the unit, it survives a reload.
  // (Counts come from content, so match the number rather than hard-coding it.)
  await page.getByRole('link', { name: 'Siddur' }).click();
  await expect(page.getByTestId('siddur-position')).toHaveText(/^Continue · Unit 1 of \d+$/);
  await page.getByTestId('siddur-position').click();
  await expect(page.getByTestId('siddur-position')).toHaveText(/^Unit 1 of \d+$/);
  await page.getByRole('button', { name: 'Mark complete' }).click();
  await expect(page.getByTestId('siddur-position')).toHaveText(/^Unit 2 of \d+$/);
  await page.reload();
  await expect(page.getByTestId('siddur-position')).toHaveText(/^Continue · Unit 2 of \d+$/);
  await expect(page.getByText(/^1 of \d+ units$/)).toBeVisible();

  // Musar path: separate progress from the Siddur path.
  await page.getByRole('link', { name: 'Musar' }).click();
  await expect(page.getByTestId('musar-position')).toHaveText(/^Continue · Unit 1 of \d+$/);
  await page.getByTestId('musar-position').click();
  await page.getByRole('button', { name: 'Mark complete' }).click();
  await expect(page.getByTestId('musar-position')).toHaveText(/^Unit 2 of \d+$/);
  await page.getByRole('button', { name: 'Back to overview' }).click();
  await page.reload();
  await expect(page.getByTestId('musar-position')).toHaveText(/^Continue · Unit 2 of \d+$/);

  // Settings saved on the server: English mode removes Hebrew, also after reload.
  await page.getByRole('link', { name: 'Settings' }).click();
  await page.getByRole('radio', { name: 'English', exact: true }).check();
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
