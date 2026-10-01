import { expect, test } from '@playwright/test';

test('Ghost ball lesson end to end, progress survives a reload', async ({ page }) => {
  await page.goto('./');
  await page.getByTestId('continue-lesson').click();
  await page.getByTestId('start-exercises').click();

  await page.getByTestId('choice-1').click();
  await page.getByTestId('estimate-submit').click();
  await expect(page.getByTestId('estimate-feedback')).toContainText('Correcto');
  await page.getByTestId('exercise-continue').click();

  await page.getByTestId('angle-slider').fill('30');
  await page.getByTestId('estimate-submit').click();
  await expect(page.getByTestId('estimate-feedback')).toBeVisible();
  await page.getByTestId('exercise-continue').click();

  for (const attempts of [5, 8]) {
    for (let i = 0; i < attempts; i++) {
      await page.getByTestId('shoot').click();
      const skip = page.getByTestId('skip-playback');
      const result = page.getByTestId('shot-result');
      await expect(skip.or(result)).toBeVisible({ timeout: 15_000 });
      if (await skip.isVisible()) await skip.click({ timeout: 2_000 }).catch(() => {});
      await expect(result).toBeVisible({ timeout: 15_000 });
      if (i < attempts - 1) await page.getByTestId('next-shot').click();
    }
    await page.getByTestId('exercise-continue').click();
  }

  for (let s = 0; s < 2; s++) {
    for (let i = 0; i < 10; i++) await page.getByTestId('real-hit').click();
    await expect(page.getByTestId('real-summary')).toContainText('10 de 10');
    await page.getByTestId('exercise-continue').click();
  }

  await expect(page.getByTestId('lesson-progress')).toContainText('Mesa real: 100%');
  await page.reload();
  await expect(page.getByTestId('lesson-progress')).toContainText('Mesa real: 100%');
});
