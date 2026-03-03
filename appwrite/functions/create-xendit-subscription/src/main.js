/**
 * Appwrite Function: create-xendit-subscription
 *
 * Called by the frontend when a user selects a plan on the Pricing page.
 *
 * Flow:
 *  1. Authenticate the calling user (Appwrite passes the JWT automatically)
 *  2. Validate the requested planId
 *  3. Call the Xendit Invoice API to create a hosted checkout page
 *  4. Store a pending payment record in Appwrite database
 *  5. Return the Xendit checkout URL to the frontend
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

import { Client, Databases, ID, Users } from 'node-appwrite';

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
    // Appwrite injects the user's JWT; we use a server client to read user info
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    const users = new Users(client);
    const databases = new Databases(client);

    // The calling user's ID is available via req.headers
    const userId = req.headers['x-appwrite-user-id'];
    if (!userId) {
      return res.json({ error: 'Authentication required' }, 401);
    }

    const user = await users.get(userId);

    // ── 3. Generate external ID ──────────────────────────────────
    const externalId = `pb_${planId}_${userId}_${Date.now()}`;

    // ── 4. Create Xendit Invoice ─────────────────────────────────
    const XENDIT_SECRET = process.env.XENDIT_SECRET_KEY;
    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

    const invoicePayload = {
      external_id: externalId,
      amount: plan.price / 100, // Xendit expects major currency units
      currency: plan.currency,
      description: `${plan.name} — PhotoBooth Pro`,
      payer_email: user.email,
      customer: {
        given_names: user.name || user.email.split('@')[0],
        email: user.email,
      },
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

    // ── 5. Store pending payment in Appwrite database ────────────
    const DATABASE_ID = process.env.DATABASE_ID || 'photobooth_db';
    const COLLECTION_PAYMENTS = process.env.COLLECTION_PAYMENTS || 'payments';

    await databases.createDocument(
      DATABASE_ID,
      COLLECTION_PAYMENTS,
      ID.unique(),
      {
        userId: userId,
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

    // ── 6. Return checkout URL ───────────────────────────────────
    return res.json({ checkoutUrl: invoice.invoice_url });
  } catch (err) {
    error(`create-xendit-subscription error: ${err.message}`);
    return res.json({ error: 'Internal server error' }, 500);
  }
}
