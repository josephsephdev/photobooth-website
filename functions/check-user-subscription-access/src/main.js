/**
 * Appwrite Function: check-user-subscription-access
 *
 * Authoritative server-side access evaluator.
 * Returns a stable, desktop-friendly JSON payload describing the user's
 * subscription state, account type, and whether watermarking should be applied.
 *
 * Business rules (single source of truth — do NOT duplicate elsewhere):
 *   see `getSubscriptionAccessState()` below.
 *
 * Environment variables:
 *   DATABASE_ID, COLLECTION_SUBSCRIPTIONS
 */

import { Client, Databases, Query } from 'node-appwrite';

// ── Centralized access evaluator ────────────────────────────────────
// This is the ONLY place access rules live. Every consumer (website,
// desktop app, other functions) should call this function rather than
// reimplementing the logic.

/**
 * Evaluate a user's subscription access state.
 *
 * @param {Databases} databases  – node-appwrite Databases instance (admin key)
 * @param {string}    databaseId
 * @param {string}    collectionId
 * @param {string}    userId
 * @returns {Promise<SubscriptionAccessState>}
 *
 * Rules:
 *  1. No subscription record → Free
 *  2. status === 'active'   && expiresAt > now → Paid / Active
 *  3. status === 'canceled' && expiresAt > now → Paid / Active (grace period)
 *  4. status in {expired, failed, unpaid, pending} OR expiresAt <= now → Free / Inactive
 *
 * Derived:
 *  - watermarkEnabled = !hasAccess
 */
async function getSubscriptionAccessState(databases, databaseId, collectionId, userId) {
  const FREE_RESPONSE = {
    hasAccess: false,
    accountType: 'free',
    subscriptionStatus: 'none',
    planId: null,
    planName: null,
    expiresAt: null,
    watermarkEnabled: true,
  };

  // Fetch the user's most-recently-updated subscription (any status)
  const result = await databases.listDocuments(databaseId, collectionId, [
    Query.equal('userId', userId),
    Query.orderDesc('updatedAt'),
    Query.limit(1),
  ]);

  if (result.total === 0) {
    return FREE_RESPONSE;
  }

  const sub = result.documents[0];
  const now = new Date();
  const expiresAt = sub.expiresAt ? new Date(sub.expiresAt) : null;
  const isExpired = !expiresAt || expiresAt <= now;

  // Statuses that grant access as long as the period hasn't ended
  const ACTIVE_STATUSES = ['active', 'canceled'];

  const hasAccess = ACTIVE_STATUSES.includes(sub.status) && !isExpired;

  return {
    hasAccess,
    accountType: hasAccess ? 'paid' : 'free',
    subscriptionStatus: sub.status,
    planId: hasAccess ? sub.planId : null,
    planName: hasAccess ? sub.planName : null,
    expiresAt: sub.expiresAt || null,
    watermarkEnabled: !hasAccess,
  };
}

// ── Function entry point ────────────────────────────────────────────

export default async ({ req, res, log, error }) => {
  try {
    // PHASE 4 SECURITY FIX: Require proper authentication, do not accept userId from request body
    // This prevents privacy leak where any caller could check any user's subscription status
    
    const userId = req.headers['x-appwrite-user-id'];

    if (!userId) {
      // Return 401 if not authenticated
      // Desktop app users should authenticate through desktop-auth-handoff first
      // and either pass auth token OR implement their own secure mechanism
      return res.json(
        {
          hasAccess: false,
          accountType: 'free',
          subscriptionStatus: 'none',
          planId: null,
          planName: null,
          expiresAt: null,
          watermarkEnabled: true,
          error: 'Authentication required. Must use authenticated session (x-appwrite-user-id header).',
        },
        401,
      );
    }

    const client = new Client()
      .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
      .setKey(req.headers['x-appwrite-key'] ?? '');

    const databases = new Databases(client);
    const DATABASE_ID = process.env.DATABASE_ID || 'photobooth_db';
    const COLLECTION_SUBSCRIPTIONS = process.env.COLLECTION_SUBSCRIPTIONS || 'subscriptions';

    const state = await getSubscriptionAccessState(
      databases,
      DATABASE_ID,
      COLLECTION_SUBSCRIPTIONS,
      userId,
    );

    log(
      `Access check: user=${userId} accountType=${state.accountType} ` +
      `status=${state.subscriptionStatus} watermark=${state.watermarkEnabled}`,
    );

    return res.json(state);
  } catch (err) {
    error(`check-user-subscription-access error: ${err.message}`);
    return res.json(
      {
        hasAccess: false,
        accountType: 'free',
        subscriptionStatus: 'none',
        planId: null,
        planName: null,
        expiresAt: null,
        watermarkEnabled: true,
        error: 'Internal server error',
      },
      500,
    );
  }
};
