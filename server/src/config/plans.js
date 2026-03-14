/**
 * Plan configuration — single source of truth for pricing & entitlements.
 *
 * The frontend displays these values but the backend always validates
 * against this config before creating a Xendit checkout session.
 */

export const PLANS = {
  test: {
    id: 'test',
    name: 'Test Plan',
    price: 100,              // amount in centavos (₱1.00)
    currency: 'PHP',
    durationMinutes: 5,      // 5-minute test period
    priceLabel: '₱1',
    priceNote: 'test only',
    description: 'Test plan for 5 minutes (testing purposes only).',
    removeWatermark: true,
  },
  event_pass: {
    id: 'event_pass',
    name: 'Event Pass',
    price: 15000,            // amount in centavos (₱150.00)
    currency: 'PHP',
    durationDays: 1,
    priceLabel: '₱150',
    priceNote: 'one-time',
    description: 'Full access for 24 hours — perfect for a single event.',
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
    description: 'Unlimited events per month with premium features.',
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
    description: '12-month access at the best price — save over ₱1,400.',
    removeWatermark: true,
  },
};

/**
 * Lookup a plan by its id. Returns undefined for unknown ids.
 */
export function getPlan(planId) {
  return PLANS[planId] ?? undefined;
}
