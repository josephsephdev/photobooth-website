/**
 * Appwrite Function: renew-xendit-subscription
 *
 * Called when a user wants to renew or reactivate their subscription.
 * Creates a new Xendit invoice for the selected plan.
 *
 * Applies the same pending-payment dedup logic as create-xendit-subscription:
 *  • Same plan still pending → reuse existing checkout URL
 *  • Different plan pending  → expire old Xendit invoice, supersede record, create new
 *  • Expired pending         → mark expired, create new
 *
 * Environment variables:
 *   APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY
 *   XENDIT_SECRET_KEY, FRONTEND_URL
 *   DATABASE_ID, COLLECTION_PAYMENTS
 */

import { Client, Databases, ID, Users, Query } from 'node-appwrite';

const PLANS = {
  event_pass: { id: 'event_pass', name: 'Event Pass', price: 15000, currency: 'PHP', durationDays: 1 },
  monthly:    { id: 'monthly',    name: 'Pro Monthly', price: 70000, currency: 'PHP', durationDays: 30 },
  yearly:     { id: 'yearly',     name: 'Studio Annual', price: 700000, currency: 'PHP', durationDays: 365 },
};

const INVOICE_DURATION_SECONDS = 1800;

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
    const body = JSON.parse(req.body || '{}');
    const { planId } = body;

    const plan = PLANS[planId];
    if (!plan) {
      return res.json({ error: 'Invalid plan selected' }, 400);
    }

    const userId = req.headers['x-appwrite-user-id'];
    if (!userId) {
      return res.json({ error: 'Authentication required' }, 401);
    }

    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    const users = new Users(client);
    const databases = new Databases(client);
    const user = await users.get(userId);

    const XENDIT_SECRET = process.env.XENDIT_SECRET_KEY;
    const DATABASE_ID = process.env.DATABASE_ID || 'photobooth_db';
    const COLLECTION_PAYMENTS = process.env.COLLECTION_PAYMENTS || 'payments';

    // ── Handle existing pending payments ─────────────────────────
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

    // ── Create Xendit Invoice ────────────────────────────────────
    const externalId = `pb_renew_${planId}_${userId}_${Date.now()}`;
    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

    const invoicePayload = {
      external_id: externalId,
      amount: plan.price / 100,
      currency: plan.currency,
      description: `${plan.name} Renewal — Luis&Co. Photobooth App`,
      payer_email: user.email,
      customer: {
        given_names: user.name || user.email.split('@')[0],
        email: user.email,
      },
      invoice_duration: INVOICE_DURATION_SECONDS,
      success_redirect_url: `${FRONTEND_URL}/#/checkout/success?ref=${externalId}`,
      failure_redirect_url: `${FRONTEND_URL}/#/checkout/cancel`,
      items: [
        { name: `${plan.name} (Renewal)`, quantity: 1, price: plan.price / 100, category: 'subscription' },
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
      error(`Xendit renewal invoice failed: ${xenditRes.status} ${errText}`);
      return res.json({ error: 'Payment provider error' }, 502);
    }

    const invoice = await xenditRes.json();
    log(`Renewal invoice created: ${invoice.id} for user ${userId}`);

    // ── Store pending payment ────────────────────────────────────
    await databases.createDocument(
      DATABASE_ID,
      COLLECTION_PAYMENTS,
      ID.unique(),
      {
        userId,
        planId,
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

    return res.json({ checkoutUrl: invoice.invoice_url });
  } catch (err) {
    error(`renew-xendit-subscription error: ${err.message}`);
    return res.json({ error: 'Internal server error' }, 500);
  }
}
