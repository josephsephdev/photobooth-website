/**
 * Plan configuration — single source of truth for pricing & entitlements.
 *
 * The frontend displays these values but the backend always validates
 * against this config before creating a Xendit checkout session.
 */

export const PLANS = {
  event_pass: {
    id: 'event_pass',
    name: 'Event Pass',
    price: 15000,            // amount in centavos (₱150.00)
    currency: 'PHP',
    durationDays: 1,
    priceLabel: '₱150',
    priceNote: 'one-time',
    description: 'For one day',
    removeWatermark: true,
  },
  monthly: {
    id: 'monthly',
    name: 'Pro Monthly',
    price: 70000,            // ₱700.00
    currency: 'PHP',
    durationDays: 30,
    priceLabel: '₱700',
    priceNote: '/month',
    description: 'For growing photobooth businesses',
    removeWatermark: true,
  },
  yearly: {
    id: 'yearly',
    name: 'Studio Annual',
    price: 700000,           // ₱7,000.00
    currency: 'PHP',
    durationDays: 365,
    priceLabel: '₱7,000',
    priceNote: '/year',
    description: 'For serious long-term use',
    removeWatermark: true,
  },
  test: {
    id: 'test',
    name: 'Test Plan',
    price: 100,              // ₱1.00 (1 centavo = ₱0.01, 100 = ₱1.00)
    currency: 'PHP',
    durationMinutes: 1,      // 1 minute for quick testing
    priceLabel: '₱1',
    priceNote: 'test',
    description: 'For testing subscriptions',
    removeWatermark: true,
  },
};

/**
 * Lookup a plan by its id. Returns undefined for unknown ids.
 */
export function getPlan(planId) {
  return PLANS[planId] ?? undefined;
}
