/**
 * Appwrite Function: cancel-xendit-subscription
 *
 * Called by the frontend when a user wants to cancel their subscription.
 *
 * Flow:
 *  1. Authenticate the calling user
 *  2. Look up the subscription document in Appwrite
 *  3. Verify ownership (userId must match)
 *  4. Update the subscription status to 'canceled' in Appwrite
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

    const userId = req.headers['x-appwrite-user-id'];
    if (!userId) {
      return res.json({ error: 'Authentication required' }, 401);
    }

    if (!subscriptionDocId) {
      return res.json({ error: 'subscriptionDocId is required' }, 400);
    }

    const client = new Client()
      .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
      .setKey(req.headers['x-appwrite-key'] ?? '');

    const databases = new Databases(client);
    const DATABASE_ID = process.env.DATABASE_ID || 'photobooth_db';
    const COLLECTION_SUBSCRIPTIONS = process.env.COLLECTION_SUBSCRIPTIONS || 'subscriptions';

    // ── 1. Fetch the subscription document ───────────────────────
    const subDoc = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_SUBSCRIPTIONS,
      subscriptionDocId,
    );

    // ── 2. Verify ownership ─────────────────────────────────────
    if (subDoc.userId !== userId) {
      return res.json({ error: 'Forbidden' }, 403);
    }

    if (subDoc.status === 'canceled') {
      return res.json({ message: 'Subscription is already canceled' });
    }

    log(`Canceling subscription ${subscriptionDocId} for user ${userId}`);

    // ── 3. Update Appwrite document ──────────────────────────────
    await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_SUBSCRIPTIONS,
      subscriptionDocId,
      {
        status: 'canceled',
        canceledAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    );

    return res.json({ message: 'Subscription canceled successfully' });
  } catch (err) {
    error(`cancel-xendit-subscription error: ${err.message}`);
    return res.json({ error: 'Internal server error' }, 500);
  }
};
