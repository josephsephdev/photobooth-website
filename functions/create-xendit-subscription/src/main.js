/**
 * Appwrite Function: create-xendit-subscription
 *
 * Called by the frontend when a user selects a plan on the Pricing page.
 *
 * Flow:
 *  1. Authenticate the calling user (Appwrite passes the JWT automatically)
 *  2. Validate the requested planId
 *  3. Check for existing pending payments for this user:
 *     - Same plan + still valid  → reuse the existing Xendit checkout URL
 *     - Different plan           → expire old invoice on Xendit, supersede record, create new
 *     - Expired pending          → mark expired, create new checkout
 *  4. Call the Xendit Invoice API to create a hosted checkout page
 *  5. Store a pending payment record in Appwrite database
 *  6. Return the Xendit checkout URL to the frontend
 *
 * Business rules:
 *  • Only ONE active pending checkout per user at any time.
 *  • Subscription is NEVER activated here — only by the webhook handler.
 *
 * Environment variables (set in Appwrite Console → Function → Settings):
 *   APPWRITE_ENDPOINT         — e.g. https://cloud.appwrite.io/v1
 *   APPWRITE_PROJECT_ID
 *   APPWRITE_API_KEY           — server API key with databases.write scope
 *   XENDIT_SECRET_KEY          — Xendit secret API key
 *   FRONTEND_URL               — e.g. https://yourapp.com
 *   DATABASE_ID                — e.g. photobooth_db
 *   COLLECTION_PAYMENTS        — e.g. payments
 *   COLLECTION_SUBSCRIPTIONS   — e.g. subscriptions
 */

import { Client, Databases, ID, Users, Query, Permission, Role } from 'node-appwrite';

// ── Plan config (mirror of frontend plans — backend is source of truth) ──
const PLANS = {
  event_pass: {
    id: 'event_pass',
    name: 'Event Pass',
    price: 15000,       // centavos → ₱150.00
    currency: 'PHP',
    durationDays: 1,
  },
  monthly: {
    id: 'monthly',
    name: 'Pro Monthly',
    price: 70000,       // ₱700.00
    currency: 'PHP',
    durationDays: 30,
  },
  yearly: {
    id: 'yearly',
    name: 'Studio Annual',
    price: 700000,      // ₱7,000.00
    currency: 'PHP',
    durationDays: 365,
  },
};

// Xendit invoice lifetime in seconds (30 minutes).
// Sent to Xendit AND used locally to detect stale pending checkouts.
const INVOICE_DURATION_SECONDS = 1800;

/**
 * Extract planId from an external_id string.
 * Formats: pb_{planId}_{userId}_{ts}  or  pb_renew_{planId}_{userId}_{ts}
 */
function extractPlanId(externalId) {
  const prefix = 'pb_';
  if (!externalId || !externalId.startsWith(prefix)) return null;
  let rest = externalId.slice(prefix.length);
  if (rest.startsWith('renew_')) rest = rest.slice('renew_'.length);
  const knownIds = Object.keys(PLANS).sort((a, b) => b.length - a.length);
  for (const pid of knownIds) {
    if (rest.startsWith(pid + '_')) return pid;
  }
  return null;
}

/**
 * Expire a Xendit invoice so it can no longer be paid.
 */
async function expireXenditInvoice(xenditInvoiceId, xenditSecret, log) {
  if (!xenditInvoiceId) return;
  try {
    await fetch(`https://api.xendit.co/invoices/${xenditInvoiceId}/expire!`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(xenditSecret + ':').toString('base64')}`,
      },
    });
    log(`Expired Xendit invoice ${xenditInvoiceId}`);
  } catch (e) {
    log(`Warning: could not expire Xendit invoice ${xenditInvoiceId}: ${e.message}`);
  }
}

export default async ({ req, res, log, error }) => {
  try {
    // ── 1. Parse input ───────────────────────────────────────────
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body ?? {});
    const { planId } = body;
    const durationUnits = Math.max(1, Math.floor(Number(body.durationUnits) || 1));
    const deviceLimit = Math.max(2, Math.min(10, Math.floor(Number(body.deviceLimit) || 2)));

    if (!planId || typeof planId !== 'string') {
      return res.json({ error: 'Invalid plan selected' }, 400);
    }
    const plan = PLANS[planId];
    if (!plan) {
      return res.json({ error: 'Invalid plan selected' }, 400);
    }

    // ── Dynamic pricing ──────────────────────────────────────────
    const periodPrice = plan.price * durationUnits;
    const extraDevices = Math.max(0, deviceLimit - 2);
    const deviceAddOn = Math.round(periodPrice * extraDevices * 0.20);
    const totalPrice = periodPrice + deviceAddOn;
    const totalDurationDays = plan.durationDays * durationUnits;

    // ── 2. Get the calling user ──────────────────────────────────
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
      .setKey(req.headers['x-appwrite-key'] ?? '');

    const users = new Users(client);
    const databases = new Databases(client);

    const userId = req.headers['x-appwrite-user-id'];
    if (!userId) {
      return res.json({ error: 'Authentication required' }, 401);
    }

    const user = await users.get(userId);

    const XENDIT_SECRET = process.env.XENDIT_SECRET_KEY;
    const DATABASE_ID = process.env.DATABASE_ID || 'photobooth_db';
    const COLLECTION_PAYMENTS = process.env.COLLECTION_PAYMENTS || 'payments';

    // ── 3. Handle existing pending payments ──────────────────────
    // Enforce: only ONE active pending checkout per user at a time.
    const pendingList = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_PAYMENTS,
      [
        Query.equal('userId', userId),
        Query.equal('status', 'pending'),
        Query.orderDesc('createdAt'),
        Query.limit(25),
      ],
    );

    for (const pending of pendingList.documents) {
      const pendingPlanId = pending.planId || extractPlanId(pending.providerPaymentId);
      const createdAt = new Date(pending.createdAt);
      const invoiceExpiry = new Date(createdAt.getTime() + INVOICE_DURATION_SECONDS * 1000);
      const isExpired = new Date() >= invoiceExpiry;

      if (isExpired) {
        // Xendit webhook should have marked this expired already, but clean up just in case
        await databases.updateDocument(DATABASE_ID, COLLECTION_PAYMENTS, pending.$id, { status: 'expired' });
        log(`Marked stale pending payment ${pending.$id} as expired`);
        continue;
      }

      // Pending checkout is still within its validity window
      if (pendingPlanId === planId && pending.checkoutUrl) {
        // SAME plan + checkout URL stored → reuse existing Xendit checkout
        log(`Reusing existing pending checkout ${pending.$id} for plan ${planId}`);
        return res.json({ checkoutUrl: pending.checkoutUrl, reused: true });
      }

      // Different plan OR same plan without a stored URL (legacy record) → supersede
      await expireXenditInvoice(pending.xenditInvoiceId, XENDIT_SECRET, log);
      await databases.updateDocument(DATABASE_ID, COLLECTION_PAYMENTS, pending.$id, { status: 'superseded' });
      log(`Superseded pending payment ${pending.$id} (was ${pendingPlanId}, user now wants ${planId})`);
    }

    // ── 4. Generate external ID ──────────────────────────────────
    const externalId = `pb_${planId}_${userId}_${Date.now()}`;

    // ── 4.5 PHASE 8: Final duplicate check (prevent race condition) ──
    // Between checking existing payments above and now, another request
    // might have created a pending payment for the same user+plan.
    // Re-check to prevent concurrent duplicates under load.
    const finalPendingCheck = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_PAYMENTS,
      [
        Query.equal('userId', userId),
        Query.equal('planId', planId),
        Query.equal('status', 'pending'),
        Query.limit(1),
      ],
    );

    if (finalPendingCheck.documents.length > 0) {
      const existingPending = finalPendingCheck.documents[0];
      log(`PHASE 8: Race condition detected. Pending payment ${existingPending.$id} already exists for user ${userId} / plan ${planId}. Returning existing.`);
      return res.json({ checkoutUrl: existingPending.checkoutUrl, reused: true, raceConditionHandled: true });
    }

    // ── 5. Create Xendit Invoice ─────────────────────────────────
    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

    // Build description with duration and device info
    const durationLabel = planId === 'event_pass'
      ? `${durationUnits} day${durationUnits > 1 ? 's' : ''}`
      : planId === 'monthly'
        ? `${durationUnits} month${durationUnits > 1 ? 's' : ''}`
        : `${durationUnits} year${durationUnits > 1 ? 's' : ''}`;
    const deviceLabel = deviceLimit > 2 ? ` | ${deviceLimit} devices` : '';

    const invoicePayload = {
      external_id: externalId,
      amount: totalPrice / 100, // Xendit expects major currency units
      currency: plan.currency,
      description: `${plan.name} × ${durationLabel}${deviceLabel} — Luis&Co. Photobooth App`,
      payer_email: user.email,
      customer: {
        given_names: user.name || user.email.split('@')[0],
        email: user.email,
      },
      invoice_duration: INVOICE_DURATION_SECONDS,
      success_redirect_url: `${FRONTEND_URL}/#/checkout/success?ref=${externalId}`,
      failure_redirect_url: `${FRONTEND_URL}/#/checkout/cancel`,
      items: [
        {
          name: `${plan.name} × ${durationLabel}${deviceLabel}`,
          quantity: 1,
          price: totalPrice / 100,
          category: 'subscription',
        },
      ],
    };

    const xenditRes = await fetch('https://api.xendit.co/v2/invoices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(XENDIT_SECRET + ':').toString('base64')}`,
      },
      body: JSON.stringify(invoicePayload),
    });

    if (!xenditRes.ok) {
      const errText = await xenditRes.text();
      error(`Xendit invoice creation failed: ${xenditRes.status} ${errText}`);
      return res.json({ error: 'Payment provider error' }, 502);
    }

    const invoice = await xenditRes.json();
    log(`Xendit invoice created: ${invoice.id} for user ${userId}`);

    // ── 6. Store pending payment in Appwrite database ────────────
    // PHASE 5: Add new audit trail fields
    const newPayment = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_PAYMENTS,
      ID.unique(),
      {
        userId: userId,
        planId: planId,
        subscriptionId: '',
        providerPaymentId: externalId,
        xenditInvoiceId: invoice.id,
        checkoutUrl: invoice.invoice_url,
        amount: totalPrice,
        currency: plan.currency,
        status: 'pending',
        method: '',
        paidAt: '',
        cancelledAt: null,
        supersededAt: null,
        replacementTransactionId: null,
        durationUnits: durationUnits,
        durationDays: totalDurationDays,
        deviceLimit: deviceLimit,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      [
        Permission.read(Role.user(userId)),
      ],
    );

    // ── 7. Return checkout URL ───────────────────────────────────
    return res.json({ checkoutUrl: invoice.invoice_url });
  } catch (err) {
    error(`create-xendit-subscription error: ${err.message}`);
    return res.json({ error: 'Internal server error' }, 500);
  }
};
