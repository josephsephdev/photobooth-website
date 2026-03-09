/**
 * Billing routes — create Xendit hosted checkout sessions.
 *
 * POST /api/billing/create-checkout
 *   Body: { planId: "event_pass" | "monthly" | "yearly" }
 *   Returns: { checkoutUrl }
 *
 * The backend is the source of truth for pricing.
 * The Xendit Invoice API is used to generate a hosted payment page
 * that supports bank transfers, e-wallets, cards, etc.
 */

import { Router } from 'express';
import { nanoid } from 'nanoid';
import { requireAuth } from '../middleware/auth.js';
import { getPlan } from '../config/plans.js';
import db from '../db/index.js';

const router = Router();

const XENDIT_SECRET = process.env.XENDIT_SECRET_KEY || '';
const FRONTEND_URL  = process.env.FRONTEND_URL || 'http://localhost:5173';

/* ------------------------------------------------------------------ */
/*  POST /api/billing/create-checkout                                 */
/* ------------------------------------------------------------------ */
router.post('/create-checkout', requireAuth, async (req, res) => {
  try {
    const { planId } = req.body;

    // 1. Validate plan server-side
    if (!planId || typeof planId !== 'string') {
      return res.status(400).json({ error: 'Invalid plan selected' });
    }
    const plan = getPlan(planId);
    if (!plan) {
      return res.status(400).json({ error: 'Invalid plan selected' });
    }

    // 2. Lookup user
    const user = db.prepare('SELECT id, email, name FROM users WHERE id = ?').get(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 3. Generate a unique external id for this payment
    const externalId = `pb_${planId}_${user.id}_${nanoid(12)}`;

    // 4. Create Xendit Invoice via REST API
    //    Docs: https://developers.xendit.co/api-reference/#create-invoice
    const invoicePayload = {
      external_id: externalId,
      amount: plan.price / 100,                 // Xendit expects major units (₱700, not 70000 centavos)
      currency: plan.currency,
      description: `${plan.name} — Luis&Co. Photobooth App`,
      payer_email: user.email,
      customer: {
        given_names: user.name,
        email: user.email,
      },
      success_redirect_url: `${FRONTEND_URL}/#/checkout/success?ref=${externalId}`,
      failure_redirect_url: `${FRONTEND_URL}/#/checkout/cancel`,
      // Items list (optional but nice for the hosted page)
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
      const errBody = await xenditRes.text();
      console.error('Xendit invoice creation failed:', xenditRes.status, errBody);
      return res.status(502).json({ error: 'Payment provider error' });
    }

    const invoice = await xenditRes.json();

    // 5. Persist the pending payment in our DB
    db.prepare(`
      INSERT INTO payments (user_id, plan_id, amount, currency, status, xendit_external_id, xendit_invoice_id, checkout_url)
      VALUES (?, ?, ?, ?, 'pending', ?, ?, ?)
    `).run(
      user.id,
      plan.id,
      plan.price,
      plan.currency,
      externalId,
      invoice.id,
      invoice.invoice_url,
    );

    // 6. Return the hosted checkout URL to the frontend
    return res.json({ checkoutUrl: invoice.invoice_url });
  } catch (err) {
    console.error('create-checkout error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
