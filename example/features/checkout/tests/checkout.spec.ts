/**
 * Example: Linking Tests to Facets
 *
 * This file demonstrates how to use Facet Coverage with any testing framework.
 * Works with: Jest, Vitest, Mocha, Bun, Node test runner, or any other framework.
 */

// Using Bun's test runner (replace with your framework's imports)
// Jest/Vitest: import { test, expect } from 'vitest'
// Mocha: import { describe, it } from 'mocha'; import { expect } from 'chai'
import { test, expect } from 'bun:test';

// Import the generated types and facet() function for type-safe linking
import { Facets, facet } from '../.facet/facets';

// ============================================================================
// RECOMMENDED: Use facet() function inside your tests
// ============================================================================
// Just call facet() at the start of your test - like expect() but for coverage!

test('guest user can complete a purchase', () => {
  // Declare which facets this test covers - type-safe with autocomplete!
  facet(Facets.FEATURES_CHECKOUT_BUSINESS_GUEST_PURCHASE_FLOW);
  facet(Facets.FEATURES_CHECKOUT_COMPLIANCE_PCI_DSS);

  // Simulate checkout flow
  const cart = { items: [{ id: 1, name: 'Product', price: 99 }] };
  const order = checkout(cart, 'user@example.com', '4242424242424242');

  // Verify business requirement: order confirmation
  expect(order.confirmed).toBe(true);
  expect(order.email).toBe('user@example.com');

  // Verify compliance: card is masked (PCI-DSS)
  expect(order.maskedCard).toBe('•••• 4242');
});

test('user can add items to cart', () => {
  facet(Facets.FEATURES_CHECKOUT_BUSINESS_CART_MANAGEMENT);

  const cart = createCart();
  cart.add({ id: 1, name: 'Product', price: 50 });

  expect(cart.items.length).toBe(1);
  expect(cart.total).toBe(50);
});

test('checkout form validates email format', () => {
  facet(Facets.FEATURES_CHECKOUT_UX_FORM_VALIDATION);

  expect(validateEmail('invalid')).toBe(false);
  expect(validateEmail('user@example.com')).toBe(true);
});

test('user data is handled according to GDPR', () => {
  facet(Facets.FEATURES_CHECKOUT_COMPLIANCE_GDPR);

  const userData = collectUserData({ email: 'user@example.com', consent: true });

  // Only collect data if consent is given
  expect(userData).not.toBeNull();
  expect(userData!.consent).toBe(true);
  expect(userData!.collectedAt).toBeDefined();
});

test('mobile checkout has touch-friendly buttons', () => {
  facet(Facets.FEATURES_CHECKOUT_UX_MOBILE_CHECKOUT);

  const button = renderCheckoutButton({ mobile: true });
  expect(button.height).toBeGreaterThanOrEqual(44); // iOS minimum touch target
});

test('payment processing meets all compliance requirements', () => {
  // You can call facet() multiple times or with multiple arguments
  facet(Facets.FEATURES_CHECKOUT_COMPLIANCE_PCI_DSS, Facets.FEATURES_CHECKOUT_COMPLIANCE_GDPR);

  const payment = processPayment({
    card: '4242424242424242',
    consent: true,
  });

  expect(payment.encrypted).toBe(true);      // PCI-DSS
  expect(payment.cvvStored).toBe(false);     // PCI-DSS
  expect(payment.consentRecorded).toBe(true); // GDPR
});

// ============================================================================
// Helper functions (mock implementations for demo)
// ============================================================================

function checkout(cart: { items: any[] }, email: string, card: string) {
  return {
    confirmed: cart.items.length > 0,
    email,
    maskedCard: `•••• ${card.slice(-4)}`,
  };
}

function createCart() {
  const items: any[] = [];
  return {
    items,
    total: 0,
    add(item: any) {
      items.push(item);
      this.total += item.price;
    },
  };
}

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function collectUserData(data: { email: string; consent: boolean }) {
  if (!data.consent) return null;
  return { ...data, collectedAt: new Date() };
}

function renderCheckoutButton(options: { mobile: boolean }) {
  return { height: options.mobile ? 48 : 36 };
}

function processPayment(data: { card: string; consent: boolean }) {
  return {
    encrypted: true,
    cvvStored: false,
    consentRecorded: data.consent,
  };
}
