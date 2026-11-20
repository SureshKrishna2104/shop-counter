import { test, expect } from '@playwright/test';

test('Test 1: Checkout divergence charges the server snapshot, not the live cart', async ({ page }) => {
  await page.goto('/checkout');

  // Add one Field notebook and press Pay
  await page.getByRole('button', { name: 'Add Field notebook' }).click();
  await page.getByRole('button', { name: 'Pay', exact: true }).click();

  const paymentRegion = page.getByRole('region', { name: 'Payment in progress' });
  await expect(paymentRegion).toBeVisible();
  await expect(paymentRegion).toContainText('$15');

  // Add a Gel pen after payment started
  await page.getByRole('button', { name: 'Add Gel pen' }).click();

  // Amount due stays $15 and exact status message is visible
  await expect(paymentRegion).toContainText('$15');
  await expect(
    page.getByText('Your cart changed after payment started. You will be charged the amount below.')
  ).toBeVisible();

  // Complete payment and assert placed order is only the notebook at $15
  await page.getByRole('button', { name: 'Complete payment' }).click();

  const orderRegion = page.getByRole('region', { name: 'Order placed' });
  await expect(orderRegion).toBeVisible();
  await expect(orderRegion).toContainText('Field notebook');
  await expect(orderRegion).not.toContainText('Gel pen');
  await expect(orderRegion).toContainText('$15');
});

test('Test 3: URL filter persists on reload and restores on browser Back', async ({ page }) => {
  await page.goto('/shop');

  await page.getByLabel('Search').fill('lamp');
  await page.getByRole('button', { name: 'Apply' }).click();

  await expect(page).toHaveURL(/q=lamp/);
  await expect(page.getByText('Maple lamp')).toBeVisible();
  await expect(page.getByText('Cedar stool')).not.toBeVisible();

  // Reload keeps the filter
  await page.reload();
  await expect(page).toHaveURL(/q=lamp/);
  await expect(page.getByText('Maple lamp')).toBeVisible();
  await expect(page.getByText('Cedar stool')).not.toBeVisible();

  // Browser Back returns to all 5 items
  await page.goBack();
  await expect(page.getByText('Maple lamp')).toBeVisible();
  await expect(page.getByText('Cedar stool')).toBeVisible();
  await expect(page.getByText('Field notebook')).toBeVisible();
  await expect(page.getByText('Gel pen')).toBeVisible();
  await expect(page.getByText('Slip case')).toBeVisible();
});