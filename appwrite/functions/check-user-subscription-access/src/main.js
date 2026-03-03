/**
 * Appwrite Function: check-user-subscription-access
 *
 * Server-side check for whether the authenticated user has an active subscription.
 * Used by both the website dashboard and the desktop Electron app.
 *
 * Returns:
 *   { hasAccess: true, planId, planName, expiresAt }   — if active
 *   { hasAccess: false }                               — if no active sub
 *
 * This is the authoritative check. The frontend can cache/show the result
 * but the desktop app should re-check this periodically.
 *
 * Environment variables:
 *   APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY
 *   DATABASE_ID, COLLECTION_SUBSCRIPTIONS
 */

import { Client, Databases, Query } from 'node-appwrite';

export default async function main({ req, res, log, error }) {
  try {
    // Primary: use Appwrite-injected user ID (authenticated calls from website frontend)
    let userId = req.headers['x-appwrite-user-id'];

    // Fallback: accept userId from request body (unauthenticated calls from desktop app)
    if (!userId) {
      let body;
      try {
        body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      } catch { /* ignore parse errors */ }
      userId = body?.userId;
    }

    if (!userId) {
      return res.json({ hasAccess: false, error: 'User ID required' }, 401);
    }

    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);
    const DATABASE_ID = process.env.DATABASE_ID || 'photobooth_db';
    const COLLECTION_SUBSCRIPTIONS = process.env.COLLECTION_SUBSCRIPTIONS || 'subscriptions';

    const now = new Date().toISOString();

    const result = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_SUBSCRIPTIONS,
      [
        Query.equal('userId', userId),
        Query.equal('status', 'active'),
        Query.greaterThan('expiresAt', now),
        Query.orderDesc('expiresAt'),
        Query.limit(1),
      ],
    );

    if (result.total === 0) {
      log(`Access check: user ${userId} has NO active subscription`);
      return res.json({ hasAccess: false });
    }

    const sub = result.documents[0];
    log(`Access check: user ${userId} has active sub ${sub.$id} until ${sub.expiresAt}`);

    return res.json({
      hasAccess: true,
      planId: sub.planId,
      planName: sub.planName,
      expiresAt: sub.expiresAt,
      subscriptionId: sub.$id,
    });
  } catch (err) {
    error(`check-user-subscription-access error: ${err.message}`);
    return res.json({ hasAccess: false, error: 'Internal server error' }, 500);
  }
}
