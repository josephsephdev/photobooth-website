/**
 * Appwrite Function: xendit-webhook-handler
 *
 * Receives webhook/callback events from Xendit and updates the Appwrite
 * database accordingly. This is the ONLY trusted source for payment confirmation.
 *
 * Xendit sends POST requests with:
 *   - Header: x-callback-token (for verification)
 *   - Body: invoice event payload with external_id, status, payment details
 *
 * Deploy this function and set its URL as the webhook callback in Xendit Dashboard.
 *
 * Environment variables:
 *   APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY
 *   XENDIT_WEBHOOK_VERIFICATION_TOKEN
 *   DATABASE_ID, COLLECTION_PAYMENTS, COLLECTION_SUBSCRIPTIONS
 */

import { Client, Databases, ID, Query } from 'node-appwrite';

const PLANS = {
  event_pass: { id: 'event_pass', name: 'Event Pass', price: 15000, currency: 'PHP', durationDays: 1 },
  monthly:    { id: 'monthly',    name: 'Pro Monthly', price: 70000, currency: 'PHP', durationDays: 30 },
  yearly:     { id: 'yearly',     name: 'Studio Annual', price: 700000, currency: 'PHP', durationDays: 365 },
};

export default async function main({ req, res, log, error }) {
  try {
    // ── 1. Verify webhook authenticity ───────────────────────────
    const WEBHOOK_TOKEN = process.env.XENDIT_WEBHOOK_VERIFICATION_TOKEN || '';
    const callbackToken = req.headers['x-callback-token'];

    if (!callbackToken || callbackToken !== WEBHOOK_TOKEN) {
      error('Webhook: invalid or missing callback token');
      return res.json({ error: 'Forbidden' }, 403);
    }

    // ── 2. Parse the event ──────────────────────────────────────
    const event = JSON.parse(req.body || '{}');
    const externalId = event.external_id || '';
    const status = (event.status || '').toUpperCase();

    log(`Webhook received: status=${status} external_id=${externalId}`);

    if (!externalId) {
      return res.json({ received: true, message: 'No external_id' });
    }

    // ── 3. Initialise Appwrite client ────────────────────────────
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);
    const DATABASE_ID = process.env.DATABASE_ID || 'photobooth_db';
    const COLLECTION_PAYMENTS = process.env.COLLECTION_PAYMENTS || 'payments';
    const COLLECTION_SUBSCRIPTIONS = process.env.COLLECTION_SUBSCRIPTIONS || 'subscriptions';

    // ── 4. Look up the payment record ────────────────────────────
    const paymentsList = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_PAYMENTS,
      [Query.equal('providerPaymentId', externalId), Query.limit(1)],
    );

    if (paymentsList.total === 0) {
      log(`Webhook: unknown external_id ${externalId}`);
      return res.json({ received: true });
    }

    const paymentDoc = paymentsList.documents[0];

    // ── 5. Handle payment status ─────────────────────────────────
    if (status === 'PAID' || status === 'SETTLED') {
      // Update payment → paid
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_PAYMENTS,
        paymentDoc.$id,
        {
          status: 'paid',
          method: event.payment_method || event.payment_channel || 'unknown',
          paidAt: new Date().toISOString(),
        },
      );

      log(`Payment ${paymentDoc.$id} marked as paid`);

      // Activate / extend subscription
      await activateSubscription(databases, DATABASE_ID, COLLECTION_SUBSCRIPTIONS, paymentDoc, log);

    } else if (status === 'EXPIRED' || status === 'FAILED') {
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_PAYMENTS,
        paymentDoc.$id,
        { status: status.toLowerCase() },
      );
      log(`Payment ${paymentDoc.$id} marked as ${status.toLowerCase()}`);
    }
    // PENDING → no action needed, already stored as pending

    return res.json({ received: true });
  } catch (err) {
    error(`xendit-webhook-handler error: ${err.message}`);
    // Return 200 to prevent Xendit from retrying on our bug
    return res.json({ received: true, error: 'internal' }, 200);
  }
}

// ── Helpers ──────────────────────────────────────────────────────

/**
 * Extract the planId from an external_id string.
 *
 * Formats:
 *   pb_{planId}_{userId}_{timestamp}          – new purchase
 *   pb_renew_{planId}_{userId}_{timestamp}    – renewal
 *
 * Plan IDs may contain underscores (e.g. "event_pass"), so we cannot
 * simply split on "_". Instead we try each known plan ID (longest first)
 * against the remainder of the string after the prefix.
 */
function extractPlanId(externalId) {
  const prefix = 'pb_';
  if (!externalId || !externalId.startsWith(prefix)) return null;

  let rest = externalId.slice(prefix.length);

  // Strip the renewal marker if present
  if (rest.startsWith('renew_')) {
    rest = rest.slice('renew_'.length);
  }

  // Try known plan IDs, longest first, so "event_pass" is matched before "event"
  const knownIds = Object.keys(PLANS).sort((a, b) => b.length - a.length);
  for (const pid of knownIds) {
    if (rest.startsWith(pid + '_')) {
      return pid;
    }
  }

  return null;
}

// ── Subscription activation helper ───────────────────────────────

async function activateSubscription(databases, DATABASE_ID, COLLECTION_SUBSCRIPTIONS, paymentDoc, log) {
  const planId = extractPlanId(paymentDoc.providerPaymentId);

  const plan = PLANS[planId];
  if (!plan) {
    log(`activateSubscription: unknown plan from external_id: ${paymentDoc.providerPaymentId}`);
    return;
  }

  const userId = paymentDoc.userId;
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + plan.durationDays);

  // Check for existing active subscription
  const existingSubs = await databases.listDocuments(
    DATABASE_ID,
    COLLECTION_SUBSCRIPTIONS,
    [
      Query.equal('userId', userId),
      Query.equal('status', 'active'),
      Query.greaterThan('expiresAt', now.toISOString()),
      Query.orderDesc('expiresAt'),
      Query.limit(1),
    ],
  );

  if (existingSubs.total > 0) {
    // Extend the existing subscription
    const existing = existingSubs.documents[0];
    const currentEnd = new Date(existing.expiresAt);
    const newEnd = new Date(currentEnd);
    newEnd.setDate(newEnd.getDate() + plan.durationDays);

    await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_SUBSCRIPTIONS,
      existing.$id,
      {
        planId: plan.id,
        planName: plan.name,
        expiresAt: newEnd.toISOString(),
        nextBillingDate: newEnd.toISOString(),
        updatedAt: now.toISOString(),
      },
    );

    log(`Subscription ${existing.$id} extended to ${newEnd.toISOString()}`);
  } else {
    // Create new subscription
    const newSubId = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_SUBSCRIPTIONS,
      `sub_${userId}_${Date.now()}`,
      {
        userId,
        planId: plan.id,
        planName: plan.name,
        status: 'active',
        provider: 'xendit',
        providerSubscriptionId: paymentDoc.providerPaymentId,
        startDate: now.toISOString(),
        nextBillingDate: expiresAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
        canceledAt: null,
        updatedAt: now.toISOString(),
      },
    );

    log(`New subscription created for user ${userId} until ${expiresAt.toISOString()}`);
  }
}
