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
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import authRoutes    from './routes/auth.js';
import billingRoutes from './routes/billing.js';
import webhookRoutes from './routes/webhook.js';
import accountRoutes from './routes/account.js';

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Accept any localhost origin in development so port changes don't break CORS
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const corsOrigin = (origin, callback) => {
  if (!origin) {
    callback(null, true);
  } else if (!IS_PRODUCTION && /^https?:\/\/localhost(:\d+)?$/.test(origin)) {
    callback(null, true);
  } else if (origin === FRONTEND_URL) {
    callback(null, true);
  } else {
    callback(new Error('Not allowed by CORS'));
  }
};

// ── Rate Limiters ──────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts, please try again later' },
});

const billingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many checkout requests, please try again later' },
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

// ── Middleware ──────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json());

// ── Rate Limiting (applied before routes) ──────────────────────────
app.use('/api/auth',    authLimiter);
app.use('/api/billing', billingLimiter);
app.use('/api/',        generalLimiter);

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
