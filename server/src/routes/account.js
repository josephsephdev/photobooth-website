/**
 * Account routes — subscription status, payment history.
 *
 * GET /api/account/subscription   — current plan & status
 * GET /api/account/payments       — payment history
 *
 * These endpoints are also designed for the Electron desktop app
 * to read subscription status and decide watermark behaviour.
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getPlan, PLANS } from '../config/plans.js';
import { getSubscriptionByEmail, isAppwriteConfigured } from '../config/appwrite.js';
import db from '../db/index.js';

const router = Router();

/* ------------------------------------------------------------------ */
/*  GET /api/account/subscription                                     */
/* ------------------------------------------------------------------ */
router.get('/subscription', requireAuth, async (req, res) => {
  const FREE_RESPONSE = {
    plan: 'free',
    planName: 'Free',
    status: 'none',
    removeWatermark: false,
    startDate: null,
    endDate: null,
    activeUntil: null,
  };

  // ── Primary: query Appwrite (source of truth) ─────────────────
  if (isAppwriteConfigured() && req.userEmail) {
    try {
      const appwriteResult = await getSubscriptionByEmail(req.userEmail);
      if (appwriteResult !== null) {
        return res.json(appwriteResult);
      }
    } catch (err) {
      console.error('⚠️  Appwrite subscription lookup failed, falling back to SQLite:', err.message);
    }
  }

  // ── Fallback: query SQLite (legacy) ───────────────────────────
  const sub = db.prepare(`
    SELECT * FROM subscriptions
    WHERE user_id = ? AND status = 'active' AND active_until > datetime('now')
    ORDER BY active_until DESC
    LIMIT 1
  `).get(req.userId);

  if (!sub) {
    return res.json(FREE_RESPONSE);
  }

  const plan = getPlan(sub.plan_id) || {};
  return res.json({
    plan: sub.plan_id,
    planName: plan.name || sub.plan_id,
    price: plan.priceLabel || '',
    priceNote: plan.priceNote || '',
    status: sub.status,
    removeWatermark: plan.removeWatermark ?? false,
    startDate: sub.start_date,
    endDate: sub.end_date,
    activeUntil: sub.active_until,
    autoRenew: !!sub.auto_renew,
    durationDays: plan.durationDays || 0,
  });
});

/* ------------------------------------------------------------------ */
/*  GET /api/account/payments                                         */
/* ------------------------------------------------------------------ */
router.get('/payments', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT id, plan_id, amount, currency, status, payment_method,
           xendit_external_id, created_at, paid_at
    FROM payments
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 50
  `).all(req.userId);

  const payments = rows.map((p) => {
    const plan = getPlan(p.plan_id);
    return {
      id: p.xendit_external_id,
      plan: plan?.name || p.plan_id,
      amount: `₱${(p.amount / 100).toLocaleString()}`,
      amountRaw: p.amount,
      currency: p.currency,
      status: p.status,
      paymentMethod: p.payment_method,
      date: p.paid_at || p.created_at,
    };
  });

  return res.json({ payments });
});

/* ------------------------------------------------------------------ */
/*  GET /api/account/plans  — list available plans (public-safe)      */
/* ------------------------------------------------------------------ */
router.get('/plans', (_req, res) => {
  const list = Object.values(PLANS).map((p) => ({
    id: p.id,
    name: p.name,
    price: p.priceLabel,
    priceNote: p.priceNote,
    durationDays: p.durationDays,
    description: p.description,
  }));
  return res.json({ plans: list });
});

export default router;
