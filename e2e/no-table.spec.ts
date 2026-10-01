import { expect, test } from '@playwright/test';

test('without a table: onboarding, placement test, lesson without real-table exercises', async ({ page }) => {
  await page.goto('./');
  await page.getByTestId('welcome-no').click();
  await page.getByTestId('welcome-placement').click();

  await page.getByTestId('choice-1').click();
  await page.getByTestId('estimate-submit').click();
  await page.getByTestId('exercise-continue').click();
  await page.getByTestId('angle-slider').fill('32');
  await page.getByTestId('estimate-submit').click();
  await page.getByTestId('exercise-continue').click();

  await expect(page.getByTestId('placement-summary')).toBeVisible();
  await page.getByTestId('placement-done').click();
  await page.getByTestId('lesson-card-ghost-ball').click();
  await page.getByTestId('start-exercises').click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('1/5');
});
