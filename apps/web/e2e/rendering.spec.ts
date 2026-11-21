import { expect, test, type Page } from '@playwright/test';
import { E2E_PASSPHRASE } from '../playwright.config';

/**
 * Hebrew rendering guardrail (ADR-013): every language mode, light and dark, phone and desktop.
 * Checks structure (RTL + lang on every Hebrew run), the Hebrew font actually loaded, no
 * horizontal overflow, and attaches a screenshot of each case for review. Screenshots are not
 * compared pixel by pixel: font rasterization differs between machines and would make CI flaky.
 */
const MODES = ['english', 'hebrew', 'split', 'mixed'] as const;
const LAYOUT = { english: 'stacked', hebrew: 'stacked', split: 'side-by-side', mixed: ['interleaved', 'stacked'] } as const;
const SIZES = {
  phone: {}, // the config default (iPhone 13)
  desktop: { viewport: { width: 1440, height: 900 }, isMobile: false, hasTouch: false, deviceScaleFactor: 1 },
} as const;

async function signIn(page: Page) {
  await page.goto('/');
  await page.getByLabel('Passphrase').fill(E2E_PASSPHRASE);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByTestId('unit-card').first()).toBeVisible();
}

async function setMode(page: Page, languageMode: string) {
  const res = await page.request.put('/v1/profile', {
    data: {
      framework: 'masorti_conservative',
      level: 'intermediate',
      interests: ['siddur', 'musar', 'kabbalah', 'kavannah'],
      studyLength: 'medium',
      languageMode,
      showCantillation: false,
      divineName: 'abbreviated',
    },
  });
  expect(res.ok()).toBe(true);
}

for (const [size, use] of Object.entries(SIZES)) {
  for (const scheme of ['light', 'dark'] as const) {
    test.describe(`${size} · ${scheme}`, () => {
      test.use({ ...use, colorScheme: scheme });

      test('reader renders every language mode correctly', async ({ page }, info) => {
        const errors: string[] = [];
        page.on('pageerror', (e) => errors.push(e.message));
        await signIn(page);

        for (const mode of MODES) {
          await setMode(page, mode);
          await page.reload();
          await expect(page.getByTestId('unit-card').first()).toBeVisible();
          if (size === 'phone') await page.getByRole('button', { name: 'Continue reading' }).click();
          const reader = page.locator('.reader');
          await expect(reader).toBeVisible();

          const layout = await reader.locator('[data-layout]').first().getAttribute('data-layout');
          expect([LAYOUT[mode]].flat()).toContain(layout);

          const hebrew = reader.locator('.hebrew');
          if (mode === 'english') {
            await expect(hebrew).toHaveCount(0);
          } else {
            expect(await hebrew.count()).toBeGreaterThan(0);
            const bad = await hebrew.evaluateAll((els) =>
              els.filter((e) => e.getAttribute('dir') !== 'rtl' || e.getAttribute('lang') !== 'he').length
            );
            expect(bad).toBe(0);
            const font = await hebrew.first().evaluate((e) => getComputedStyle(e).fontFamily);
            expect(font).toMatch(/^"?Noto Serif Hebrew/);
            const loaded = await page.evaluate(async () => {
              await document.fonts.ready;
              return document.fonts.check('24px "Noto Serif Hebrew"', 'בָּרוּךְ');
            });
            expect(loaded).toBe(true);
          }

          const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
          expect(overflow).toBeLessThanOrEqual(0);
          await info.attach(`${size}-${scheme}-${mode}`, { body: await page.screenshot(), contentType: 'image/png' });
        }
        expect(errors).toEqual([]);
      });
    });
  }
}

test.describe('desktop keyboard and focus mode', () => {
  test.use(SIZES.desktop);

  test('F enters focus mode (navigation hidden), Esc leaves it; arrows change the day', async ({ page }) => {
    await signIn(page);
    const date = await page.getByTestId('study-date').textContent();
    await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible();
    await page.keyboard.press('f');
    await expect(page.getByRole('navigation', { name: 'Main' })).toBeHidden();
    await expect(page.getByRole('button', { name: 'Exit focus' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByTestId('study-date')).not.toHaveText(date!);
  });
});
