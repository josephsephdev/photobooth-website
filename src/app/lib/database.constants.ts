/**
 * Database & Collection Constants
 *
 * Centralises all Appwrite database IDs, collection IDs, and field names
 * so they're consistent across frontend services and Appwrite Functions.
 *
 * These IDs must match exactly what you create in the Appwrite Console.
 */

// ── Database ───────────────────────────────────────────────────────
export const DATABASE_ID =
  import.meta.env.VITE_APPWRITE_DATABASE_ID || 'photobooth_db';

// ── Collections ────────────────────────────────────────────────────
export const COLLECTION = {
  PROFILES:      import.meta.env.VITE_APPWRITE_COLLECTION_PROFILES      || 'profiles',
  SUBSCRIPTIONS: import.meta.env.VITE_APPWRITE_COLLECTION_SUBSCRIPTIONS || 'subscriptions',
  PAYMENTS:      import.meta.env.VITE_APPWRITE_COLLECTION_PAYMENTS      || 'payments',
  DESKTOP_AUTH_CODES: import.meta.env.VITE_APPWRITE_COLLECTION_DESKTOP_AUTH_CODES || 'desktop_auth_codes',
  DEVICES:       import.meta.env.VITE_APPWRITE_COLLECTION_DEVICES       || 'devices',
} as const;

// ── Profile Fields ─────────────────────────────────────────────────
export const PROFILE_FIELDS = {
  USER_ID:    'userId',
  FULL_NAME:  'fullName',
  EMAIL:      'email',
  ROLE:       'role',
  CREATED_AT: 'createdAt',
  UPDATED_AT: 'updatedAt',
} as const;

// ── Subscription Fields ────────────────────────────────────────────
export const SUBSCRIPTION_FIELDS = {
  USER_ID:                  'userId',
  PLAN_ID:                  'planId',
  PLAN_NAME:                'planName',
  STATUS:                   'status',
  PROVIDER:                 'provider',
  PROVIDER_SUBSCRIPTION_ID: 'providerSubscriptionId',
  START_DATE:               'startDate',
  NEXT_BILLING_DATE:        'nextBillingDate',
  EXPIRES_AT:               'expiresAt',
  CANCELED_AT:              'canceledAt',
  UPDATED_AT:               'updatedAt',
  DEVICE_LIMIT:             'deviceLimit',
} as const;

// ── Payment Fields ─────────────────────────────────────────────────
export const PAYMENT_FIELDS = {
  USER_ID:             'userId',
  PLAN_ID:             'planId',
  SUBSCRIPTION_ID:     'subscriptionId',
  PROVIDER_PAYMENT_ID: 'providerPaymentId',
  XENDIT_INVOICE_ID:   'xenditInvoiceId',
  CHECKOUT_URL:        'checkoutUrl',
  AMOUNT:              'amount',
  CURRENCY:            'currency',
  STATUS:              'status',
  METHOD:              'method',
  PAID_AT:             'paidAt',
  CREATED_AT:          'createdAt',
  DURATION_UNITS:      'durationUnits',
  DURATION_DAYS:       'durationDays',
  DEVICE_LIMIT:        'deviceLimit',
} as const;

// ── Subscription Statuses ──────────────────────────────────────────
export const SUBSCRIPTION_STATUS = {
  ACTIVE:    'active',
  CANCELED:  'canceled',
  EXPIRED:   'expired',
  PENDING:   'pending',
  PAST_DUE:  'past_due',
  TRIALING:  'trialing',
} as const;

// ── Payment Statuses ───────────────────────────────────────────────
export const PAYMENT_STATUS = {
  PAID:       'paid',
  PENDING:    'pending',
  FAILED:     'failed',
  EXPIRED:    'expired',
  SUPERSEDED: 'superseded',
  REFUNDED:   'refunded',
} as const;

// ── Roles ──────────────────────────────────────────────────────────
export const USER_ROLES = {
  USER:  'user',
  ADMIN: 'admin',
} as const;

// ── Device Fields ────────────────────────────────────────────────────────
export const DEVICE_FIELDS = {
  USER_ID:     'userId',
  DEVICE_ID:   'deviceId',
  DEVICE_NAME: 'deviceName',
  PLATFORM:    'platform',
  LAST_ACTIVE: 'lastActive',
  CREATED_AT:  'createdAt',
} as const;
