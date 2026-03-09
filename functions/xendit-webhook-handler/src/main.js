/**
 * Appwrite Function: xendit-webhook-handler
 *
 * Receives webhook/callback events from Xendit and updates the Appwrite
 * database accordingly. This is the ONLY trusted source for payment confirmation.
 *
 * Environment variables:
 *   XENDIT_WEBHOOK_VERIFICATION_TOKEN
 *   DATABASE_ID, COLLECTION_PAYMENTS, COLLECTION_SUBSCRIPTIONS
 */

import { Client, Databases, ID, Query, Permission, Role } from 'node-appwrite';

const PLANS = {
  event_pass: { id: 'event_pass', name: 'Event Pass', price: 15000, currency: 'PHP', durationDays: 1 },
  monthly:    { id: 'monthly',    name: 'Pro Monthly', price: 70000, currency: 'PHP', durationDays: 30 },
  yearly:     { id: 'yearly',     name: 'Studio Annual', price: 700000, currency: 'PHP', durationDays: 365 },
};

export default async ({ req, res, log, error }) => {
  try {
    // ── 1. Verify webhook authenticity ───────────────────────────
    const WEBHOOK_TOKEN = process.env.XENDIT_WEBHOOK_VERIFICATION_TOKEN || '';
    const callbackToken = req.headers['x-callback-token'];

    if (!callbackToken || callbackToken !== WEBHOOK_TOKEN) {
      error('Webhook: invalid or missing callback token');
      return res.json({ error: 'Forbidden' }, 403);
    }

    // ── 2. Parse the event ──────────────────────────────────────
    const event = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body ?? {});
    const externalId = event.external_id || '';
    const status = (event.status || '').toUpperCase();

    log(`Webhook received: status=${status} external_id=${externalId}`);

    if (!externalId) {
      return res.json({ received: true, message: 'No external_id' });
    }

    // ── 3. Initialise Appwrite client ────────────────────────────
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
      .setKey(req.headers['x-appwrite-key'] ?? '');

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
    // PHASE 1 FIX: Make webhook idempotent by checking current status before update
    
    if (status === 'PAID' || status === 'SETTLED') {
      // IDEMPOTENT CHECK: If already marked paid, skip duplicate processing
      if (paymentDoc.status === 'paid') {
        log(`Payment ${paymentDoc.$id} already marked paid; skipping duplicate webhook`);
        return res.json({ received: true });
      }

      // Log state transition
      log(`Payment ${paymentDoc.$id}: transitioning from ${paymentDoc.status} to paid`);

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
      
      // Activate subscription only on successful payment
      await activateSubscription(databases, DATABASE_ID, COLLECTION_SUBSCRIPTIONS, paymentDoc, log);

    } else if (status === 'EXPIRED' || status === 'FAILED') {
      // IDEMPOTENT CHECK: Skip if already in final state
      if (['expired', 'failed', 'paid', 'cancelled'].includes(paymentDoc.status)) {
        log(`Payment ${paymentDoc.$id} already in final state (${paymentDoc.status}); skipping`);
        return res.json({ received: true });
      }

      // Log state transition
      log(`Payment ${paymentDoc.$id}: transitioning from ${paymentDoc.status} to ${status.toLowerCase()}`);

      await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_PAYMENTS,
        paymentDoc.$id,
        { status: status.toLowerCase() },
      );
      log(`Payment ${paymentDoc.$id} marked as ${status.toLowerCase()}`);
    } else {
      // Unknown status—log but do not update
      log(`Payment ${paymentDoc.$id}: unknown status received: ${status}`);
    }

    // PHASE 1 FIX: Return success only after all DB operations complete
    return res.json({ received: true });

  } catch (err) {
    // PHASE 1 FIX: Return error (5xx) so Xendit retries
    // Do NOT return 200 on failure
    error(`xendit-webhook-handler error: ${err.message}`);
    return res.json({ error: 'internal_error', details: err.message }, 500);
  }
};

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

  // Use durationDays from payment doc (set by create-xendit-subscription) with plan fallback
  const durationDays = paymentDoc.durationDays || plan.durationDays;
  const deviceLimit = paymentDoc.deviceLimit || 2;

  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + durationDays);

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

  const docPermissions = [
    Permission.read(Role.user(userId)),
  ];

  if (existingSubs.total > 0) {
    const existing = existingSubs.documents[0];
    const currentEnd = new Date(existing.expiresAt);
    const newEnd = new Date(currentEnd);
    newEnd.setDate(newEnd.getDate() + durationDays);

    await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_SUBSCRIPTIONS,
      existing.$id,
      {
        planId: plan.id,
        planName: plan.name,
        expiresAt: newEnd.toISOString(),
        nextBillingDate: newEnd.toISOString(),
        deviceLimit: deviceLimit,
        updatedAt: now.toISOString(),
      },
      docPermissions,
    );

    log(`Subscription ${existing.$id} extended to ${newEnd.toISOString()}`);
  } else {
    await databases.createDocument(
      DATABASE_ID,
      COLLECTION_SUBSCRIPTIONS,
      ID.unique(),
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
        deviceLimit: deviceLimit,
        canceledAt: null,
        updatedAt: now.toISOString(),
      },
      docPermissions,
    );

    log(`New subscription created for user ${userId} until ${expiresAt.toISOString()}`);
  }
}
