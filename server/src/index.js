/**
 * Express server entry point.
 *
 * Mounts routes:
 *   /api/auth/*           — sign-up, sign-in, current user
 *   /api/billing/*        — create Xendit checkout
 *   /api/xendit/*         — Xendit webhook callbacks
 *   /api/account/*        — subscription & payment data
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import authRoutes    from './routes/auth.js';
import billingRoutes from './routes/billing.js';
import webhookRoutes from './routes/webhook.js';
import accountRoutes from './routes/account.js';

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Accept any localhost origin in development so port changes don't break CORS
const corsOrigin = (origin, callback) => {
  if (!origin || /^https?:\/\/localhost(:\d+)?$/.test(origin)) {
    callback(null, true);
  } else if (origin === FRONTEND_URL) {
    callback(null, true);
  } else {
    callback(new Error('Not allowed by CORS'));
  }
};

// ── Middleware ──────────────────────────────────────────────────────
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json());

// ── Routes ─────────────────────────────────────────────────────────
app.use('/api/auth',    authRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/xendit',  webhookRoutes);
app.use('/api/account', accountRoutes);

// ── Health check ───────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// ── Start ──────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✓ PhotoBooth server running on http://localhost:${PORT}`);
});
