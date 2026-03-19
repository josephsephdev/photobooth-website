/**
 * Appwrite Function: cancel-xendit-subscription
 *
 * Called by the frontend when a user wants to cancel their subscription
 * at period end (no immediate access removal).
 *
 * Flow:
 *  1. Authenticate the calling user
 *  2. Resolve the current active subscription (or use provided document ID)
 *  3. Verify ownership (userId must match)
 *  4. Mark status as 'canceled' while keeping current period active
 *
 * Environment variables:
 *   XENDIT_SECRET_KEY
 *   DATABASE_ID, COLLECTION_SUBSCRIPTIONS
 */

import { Client, Databases, Query } from 'node-appwrite';

export default async ({ req, res, log, error }) => {
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body ?? {});
    const { subscriptionDocId } = body;
    const nowIso = new Date().toISOString();

    const userId = req.headers['x-appwrite-user-id'];
    if (!userId) {
      return res.json({ error: 'Authentication required' }, 401);
    }

    if (subscriptionDocId && typeof subscriptionDocId !== 'string') {
      return res.json({ error: 'subscriptionDocId must be a string' }, 400);
    }

    const client = new Client()
      .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
      .setKey(req.headers['x-appwrite-key'] ?? '');

    const databases = new Databases(client);
    const DATABASE_ID = process.env.DATABASE_ID || 'photobooth_db';
    const COLLECTION_SUBSCRIPTIONS = process.env.COLLECTION_SUBSCRIPTIONS || 'subscriptions';

    let subDoc = null;

    // ── 1. Resolve subscription document ────────────────────────
    if (subscriptionDocId) {
      subDoc = await databases.getDocument(
        DATABASE_ID,
        COLLECTION_SUBSCRIPTIONS,
        subscriptionDocId,
      );

      // ── 2. Verify ownership ───────────────────────────────────
      if (subDoc.userId !== userId) {
        return res.json({ error: 'Forbidden' }, 403);
      }
    } else {
      const result = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_SUBSCRIPTIONS,
        [
          Query.equal('userId', userId),
          Query.greaterThan('expiresAt', nowIso),
          Query.orderDesc('updatedAt'),
          Query.limit(10),
        ],
      );

      subDoc = result.documents.find((doc) => ['active', 'canceled'].includes(doc.status)) || null;
    }

    if (!subDoc) {
      return res.json({ error: 'No active subscription to cancel' }, 404);
    }

    const effectiveAt = subDoc.nextBillingDate || subDoc.expiresAt || null;

    if (subDoc.status === 'canceled') {
      return res.json({
        message: 'Subscription is already set to cancel at period end',
        effectiveAt,
        cancelAtPeriodEnd: true,
        alreadyCanceled: true,
      });
    }

    log(`Scheduling cancellation for subscription ${subDoc.$id} (user=${userId}, effectiveAt=${effectiveAt})`);

    // ── 3. Mark cancel-at-period-end ─────────────────────────────
    await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_SUBSCRIPTIONS,
      subDoc.$id,
      {
        status: 'canceled',
        canceledAt: nowIso,
        nextBillingDate: effectiveAt,
        updatedAt: nowIso,
      },
    );

    return res.json({
      message: 'Subscription will cancel at the next billing date',
      effectiveAt,
      cancelAtPeriodEnd: true,
    });
  } catch (err) {
    error(`cancel-xendit-subscription error: ${err.message}`);
    return res.json({ error: 'Internal server error' }, 500);
  }
};
