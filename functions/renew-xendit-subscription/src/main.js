/**
 * Appwrite Function: renew-xendit-subscription
 *
 * Called when a user wants to renew or reactivate their subscription.
 * Creates a new Xendit invoice for the selected plan.
 *
 * Environment variables:
 *   XENDIT_SECRET_KEY, FRONTEND_URL
 *   DATABASE_ID, COLLECTION_PAYMENTS
 */

import { Client, Databases, ID, Users } from 'node-appwrite';

const PLANS = {
  event_pass: { id: 'event_pass', name: 'Event Pass', price: 15000, currency: 'PHP', durationDays: 1 },
  monthly:    { id: 'monthly',    name: 'Pro Monthly', price: 70000, currency: 'PHP', durationDays: 30 },
  yearly:     { id: 'yearly',     name: 'Studio Annual', price: 700000, currency: 'PHP', durationDays: 365 },
};

export default async ({ req, res, log, error }) => {
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body ?? {});
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
      .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
      .setKey(req.headers['x-appwrite-key'] ?? '');

    const users = new Users(client);
    const databases = new Databases(client);
    const user = await users.get(userId);

    const externalId = `pb_renew_${planId}_${userId}_${Date.now()}`;
    const XENDIT_SECRET = process.env.XENDIT_SECRET_KEY;
    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

    // ── Create Xendit Invoice ────────────────────────────────────
    const invoicePayload = {
      external_id: externalId,
      amount: plan.price / 100,
      currency: plan.currency,
      description: `${plan.name} Renewal — PhotoBooth Pro`,
      payer_email: user.email,
      customer: {
        given_names: user.name || user.email.split('@')[0],
        email: user.email,
      },
      success_redirect_url: `${FRONTEND_URL}/checkout/success?ref=${externalId}`,
      failure_redirect_url: `${FRONTEND_URL}/checkout/cancel`,
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
    const DATABASE_ID = process.env.DATABASE_ID || 'photobooth_db';
    const COLLECTION_PAYMENTS = process.env.COLLECTION_PAYMENTS || 'payments';

    await databases.createDocument(
      DATABASE_ID,
      COLLECTION_PAYMENTS,
      ID.unique(),
      {
        userId,
        subscriptionId: '',
        providerPaymentId: externalId,
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
};
