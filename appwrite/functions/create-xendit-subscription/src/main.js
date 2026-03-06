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

import { Client, Databases, ID, Users, Query } from 'node-appwrite';

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

// Xendit invoice lifetime in seconds (24 hours).
// Sent to Xendit AND used locally to detect stale pending checkouts.
const INVOICE_DURATION_SECONDS = 86400;

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

export default async function main({ req, res, log, error }) {
  try {
    // ── 1. Parse input ───────────────────────────────────────────
    const body = JSON.parse(req.body || '{}');
    const { planId } = body;

    const plan = PLANS[planId];
    if (!plan) {
      return res.json({ error: 'Invalid plan selected' }, 400);
    }

    // ── 2. Get the calling user ──────────────────────────────────
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

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
        await databases.updateDocument(DATABASE_ID, COLLECTION_PAYMENTS, pending.$id, { status: 'expired' });
        log(`Marked stale pending payment ${pending.$id} as expired`);
        continue;
      }

      if (pendingPlanId === planId && pending.checkoutUrl) {
        log(`Reusing existing pending checkout ${pending.$id} for plan ${planId}`);
        return res.json({ checkoutUrl: pending.checkoutUrl, reused: true });
      }

      await expireXenditInvoice(pending.xenditInvoiceId, XENDIT_SECRET, log);
      await databases.updateDocument(DATABASE_ID, COLLECTION_PAYMENTS, pending.$id, { status: 'superseded' });
      log(`Superseded pending payment ${pending.$id} (was ${pendingPlanId}, user now wants ${planId})`);
    }

    // ── 4. Generate external ID ──────────────────────────────────
    const externalId = `pb_${planId}_${userId}_${Date.now()}`;

    // ── 5. Create Xendit Invoice ─────────────────────────────────
    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

    const invoicePayload = {
      external_id: externalId,
      amount: plan.price / 100, // Xendit expects major currency units
      currency: plan.currency,
      description: `${plan.name} — Luis&Co. Photobooth App`,
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
          name: plan.name,
          quantity: 1,
          price: plan.price / 100,
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
    await databases.createDocument(
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
        amount: plan.price,
        currency: plan.currency,
        status: 'pending',
        method: '',
        paidAt: '',
        createdAt: new Date().toISOString(),
      },
    );

    // ── 7. Return checkout URL ───────────────────────────────────
    return res.json({ checkoutUrl: invoice.invoice_url });
  } catch (err) {
    error(`create-xendit-subscription error: ${err.message}`);
    return res.json({ error: 'Internal server error' }, 500);
  }
}
