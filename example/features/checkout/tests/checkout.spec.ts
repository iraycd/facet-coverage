import { test, expect } from '@playwright/test';
import { facet } from '../../../dist/integrations/playwright.js';

test.describe('Checkout Flow', () => {
  test('guest user completes purchase', {
    annotation: facet(
      'business:guest-purchase-flow',
      'compliance:pci-dss-payment-requirements'
    )
  }, async ({ page }) => {
    // This is an example test
    await page.goto('/checkout');
    await page.fill('[data-test="email"]', 'user@example.com');
    await page.fill('[data-test="card"]', '4242424242424242');
    await page.click('[data-test="place-order"]');

    // Verify business requirement
    await expect(page.locator('.order-confirmation')).toBeVisible();

    // Verify compliance: card masking
    const maskedCard = page.locator('.card-last-four');
    await expect(maskedCard).toHaveText('•••• 4242');
  });

  test('cart management', {
    annotation: facet('business:cart-management')
  }, async ({ page }) => {
    await page.goto('/cart');
    // Add item
    await page.click('[data-test="add-item"]');
    await expect(page.locator('.cart-count')).toHaveText('1');
  });

  test('mobile checkout experience', {
    annotation: facet(
      'ux:mobile-checkout-experience',
      'ux:form-validation'
    )
  }, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/checkout');

    // Verify touch targets
    const submitButton = page.locator('[data-test="place-order"]');
    const box = await submitButton.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });

  test('GDPR consent', {
    annotation: facet('compliance:gdpr-data-handling')
  }, async ({ page }) => {
    await page.goto('/checkout');
    // Verify consent checkbox
    await expect(page.locator('[data-test="gdpr-consent"]')).toBeVisible();
  });
});
