import { expect, test } from '@playwright/test';

test('works offline after the first visit', async ({ page, context }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'AimPool' })).toBeVisible();
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'AimPool' })).toBeVisible();
  await page.getByTestId('go-map').click();
  await expect(page.getByTestId('lesson-card-ghost-ball')).toBeVisible();
});
