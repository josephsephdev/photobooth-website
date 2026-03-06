/**
 * Database Service — Appwrite Web SDK
 *
 * Provides frontend-safe read operations on:
 *   - profiles
 *   - subscriptions
 *   - payments
 *
 * Write operations for subscriptions & payments are performed
 * server-side by Appwrite Functions (triggered by Xendit webhooks).
 * The frontend only READS these collections.
 *
 * ⚠️  No API keys here — all queries run under the user's session.
 *     Collection permissions must allow the user to read their own documents.
 */

import { Query, type Models } from 'appwrite';
import { databases } from './appwrite';
import {
  DATABASE_ID, COLLECTION,
  PROFILE_FIELDS, SUBSCRIPTION_FIELDS, PAYMENT_FIELDS,
} from './database.constants';

// ── Types ──────────────────────────────────────────────────────────

export interface ProfileDocument extends Models.Document {
  userId: string;
  fullName: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionDocument extends Models.Document {
  userId: string;
  planId: string;
  planName: string;
  status: string;
  provider: string;
  providerSubscriptionId: string;
  startDate: string;
  nextBillingDate: string;
  expiresAt: string;
  canceledAt: string | null;
  updatedAt: string;
}

export interface PaymentDocument extends Models.Document {
  userId: string;
  planId: string;
  subscriptionId: string;
  providerPaymentId: string;
  xenditInvoiceId: string;
  checkoutUrl: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  paidAt: string;
  createdAt: string;
}

// ── Profile Queries ────────────────────────────────────────────────

/**
 * Fetch the current user's profile document.
 * Returns null if not found.
 */
export async function getUserProfile(userId: string): Promise<ProfileDocument | null> {
  try {
    const res = await databases.listDocuments<ProfileDocument>(
      DATABASE_ID,
      COLLECTION.PROFILES,
      [
        Query.equal(PROFILE_FIELDS.USER_ID, userId),
        Query.limit(1),
      ],
    );
    return res.documents[0] ?? null;
  } catch {
    return null;
  }
}

/**
 * Update the current user's profile document.
 */
export async function updateUserProfile(
  documentId: string,
  data: Partial<Pick<ProfileDocument, 'fullName' | 'email'>>,
) {
  return databases.updateDocument(
    DATABASE_ID,
    COLLECTION.PROFILES,
    documentId,
    {
      ...data,
      [PROFILE_FIELDS.UPDATED_AT]: new Date().toISOString(),
    },
  );
}

// ── Subscription Queries ───────────────────────────────────────────

/**
 * Fetch the user's active subscription.
 * Filters for status = 'active' and expiresAt > now.
 */
export async function getActiveSubscription(
  userId: string,
): Promise<SubscriptionDocument | null> {
  try {
    const res = await databases.listDocuments<SubscriptionDocument>(
      DATABASE_ID,
      COLLECTION.SUBSCRIPTIONS,
      [
        Query.equal(SUBSCRIPTION_FIELDS.USER_ID, userId),
        Query.equal(SUBSCRIPTION_FIELDS.STATUS, 'active'),
        Query.greaterThan(SUBSCRIPTION_FIELDS.EXPIRES_AT, new Date().toISOString()),
        Query.orderDesc(SUBSCRIPTION_FIELDS.EXPIRES_AT),
        Query.limit(1),
      ],
    );
    return res.documents[0] ?? null;
  } catch {
    return null;
  }
}

/**
 * Fetch all subscriptions for a user (any status).
 */
export async function getUserSubscriptions(
  userId: string,
): Promise<SubscriptionDocument[]> {
  try {
    const res = await databases.listDocuments<SubscriptionDocument>(
      DATABASE_ID,
      COLLECTION.SUBSCRIPTIONS,
      [
        Query.equal(SUBSCRIPTION_FIELDS.USER_ID, userId),
        Query.orderDesc(SUBSCRIPTION_FIELDS.UPDATED_AT),
        Query.limit(25),
      ],
    );
    return res.documents;
  } catch {
    return [];
  }
}

// ── Payment Queries ────────────────────────────────────────────────

/**
 * Fetch the user's payment history (most recent first).
 */
export async function getUserPayments(
  userId: string,
  limit = 50,
): Promise<PaymentDocument[]> {
  try {
    const res = await databases.listDocuments<PaymentDocument>(
      DATABASE_ID,
      COLLECTION.PAYMENTS,
      [
        Query.equal(PAYMENT_FIELDS.USER_ID, userId),
        Query.orderDesc(PAYMENT_FIELDS.CREATED_AT),
        Query.limit(limit),
      ],
    );
    return res.documents;
  } catch {
    return [];
  }
}

// ── Subscription Access Check ──────────────────────────────────────

/**
 * Quick boolean check: does the user have an active, non-expired subscription?
 * Useful for gating features in the frontend or desktop app.
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const sub = await getActiveSubscription(userId);
  return sub !== null;
}
