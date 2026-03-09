/**
 * Xendit webhook handler.
 *
 * POST /api/xendit/webhook
 *
 * Xendit sends invoice callback notifications here.
 * This is the **only** place we trust as proof of payment.
 * The frontend success redirect is purely cosmetic.
 *
 * Verification:
 *   Xendit sends an `x-callback-token` header that must match
 *   your XENDIT_WEBHOOK_VERIFICATION_TOKEN environment variable.
 */

import { Router } from 'express';
import db from '../db/index.js';
import { getPlan } from '../config/plans.js';

const router = Router();

const WEBHOOK_TOKEN = process.env.XENDIT_WEBHOOK_VERIFICATION_TOKEN || '';

/* ------------------------------------------------------------------ */
/*  POST /api/xendit/webhook                                          */
/* ------------------------------------------------------------------ */
router.post('/webhook', (req, res) => {
  try {
    // 1. Verify the callback token
    const callbackToken = req.headers['x-callback-token'];
    if (!callbackToken || callbackToken !== WEBHOOK_TOKEN) {
      console.warn('Webhook: invalid or missing callback token');
      return res.status(403).json({ error: 'Forbidden' });
    }

    const event = req.body;
    const externalId = event.external_id;
    const status     = (event.status || '').toUpperCase();

    console.log(`Webhook received: status=${status} external_id=${externalId}`);

    // 2. Look up the payment record
    const payment = db.prepare(
      'SELECT * FROM payments WHERE xendit_external_id = ?',
    ).get(externalId);

    if (!payment) {
      console.warn(`Webhook: unknown external_id ${externalId}`);
      // Still return 200 so Xendit doesn't retry
      return res.json({ received: true });
    }

    // 3. Handle status
    if (status === 'PAID' || status === 'SETTLED') {
      // Mark payment as paid
      db.prepare(`
        UPDATE payments
        SET status = 'paid',
            payment_method = ?,
            paid_at = datetime('now'),
            updated_at = datetime('now')
        WHERE id = ?
      `).run(event.payment_method || event.payment_channel || 'unknown', payment.id);

      // Activate or extend subscription
      activateSubscription(payment);
    } else if (status === 'EXPIRED' || status === 'FAILED') {
      db.prepare(`
        UPDATE payments SET status = ?, updated_at = datetime('now') WHERE id = ?
      `).run(status.toLowerCase(), payment.id);
    }
    // For PENDING we don't need to do anything — already stored as pending.

    return res.json({ received: true });
  } catch (err) {
    console.error('Webhook processing error:', err);
    return res.status(500).json({ error: 'internal' });
  }
});

/* ------------------------------------------------------------------ */
/*  Subscription activation helper                                    */
/* ------------------------------------------------------------------ */
function activateSubscription(payment) {
  const plan = getPlan(payment.plan_id);
  if (!plan) {
    console.error(`activateSubscription: unknown plan ${payment.plan_id}`);
    return;
  }

  const now = new Date();
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + plan.durationDays);

  const isoNow = now.toISOString();
  const isoEnd = endDate.toISOString();

  // Check if user already has an active subscription
  const existing = db.prepare(`
    SELECT * FROM subscriptions
    WHERE user_id = ? AND status = 'active' AND active_until > datetime('now')
    ORDER BY active_until DESC
    LIMIT 1
  `).get(payment.user_id);

  if (existing) {
    // Extend the existing subscription
    const currentEnd = new Date(existing.active_until);
    const newEnd = new Date(currentEnd);
    newEnd.setDate(newEnd.getDate() + plan.durationDays);
    const isoNewEnd = newEnd.toISOString();

    db.prepare(`
      UPDATE subscriptions
      SET plan_id = ?, end_date = ?, active_until = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(plan.id, isoNewEnd, isoNewEnd, existing.id);

    console.log(`Subscription ${existing.id} extended to ${isoNewEnd}`);
  } else {
    // Create new subscription
    db.prepare(`
      INSERT INTO subscriptions (user_id, plan_id, status, start_date, end_date, active_until)
      VALUES (?, ?, 'active', ?, ?, ?)
    `).run(payment.user_id, plan.id, isoNow, isoEnd, isoEnd);

    console.log(`New subscription created for user ${payment.user_id} until ${isoEnd}`);
  }
}

export default router;
