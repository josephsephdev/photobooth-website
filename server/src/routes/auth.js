/**
 * Auth routes — sign-up, sign-in, current user.
 *
 * Passwords are hashed with Node's built-in crypto (scrypt).
 * In production swap for bcrypt / argon2 if preferred.
 */

import { Router } from 'express';
import crypto from 'node:crypto';
import { promisify } from 'node:util';
import db from '../db/index.js';
import { signToken, requireAuth } from '../middleware/auth.js';

const scrypt = promisify(crypto.scrypt);
const router = Router();

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = /** @type {Buffer} */ (await scrypt(password, salt, 64));
  return `${salt}:${derived.toString('hex')}`;
}

async function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const derived = /** @type {Buffer} */ (await scrypt(password, salt, 64));
  return derived.toString('hex') === hash;
}

/* ------------------------------------------------------------------ */
/*  POST /api/auth/signup                                             */
/* ------------------------------------------------------------------ */
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await hashPassword(password);
    const displayName = name || email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    const result = db.prepare(
      'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)',
    ).run(email, passwordHash, displayName);

    const user = { id: result.lastInsertRowid, email, name: displayName };
    const token = signToken(user);

    return res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    console.error('signup error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/* ------------------------------------------------------------------ */
/*  POST /api/auth/signin                                             */
/* ------------------------------------------------------------------ */
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signToken(user);
    return res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    console.error('signin error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/* ------------------------------------------------------------------ */
/*  POST /api/auth/desktop-exchange                                   */
/*                                                                    */
/*  Called by the website frontend when `source=desktop`.              */
/*  Find-or-create the user in SQLite, then return a JWT that the     */
/*  desktop app can verify via GET /api/auth/me.                      */
/* ------------------------------------------------------------------ */
router.post('/desktop-exchange', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (user) {
      // User exists — verify password
      const valid = await verifyPassword(password, user.password_hash);
      if (!valid) {
        // Password changed on website? Re-hash and update.
        const passwordHash = await hashPassword(password);
        db.prepare('UPDATE users SET password_hash = ?, updated_at = datetime(\'now\') WHERE id = ?')
          .run(passwordHash, user.id);
      }
    } else {
      // First time — create user in billing DB
      const passwordHash = await hashPassword(password);
      const displayName = name || email.split('@')[0]
        .replace(/[._]/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());

      const result = db.prepare(
        'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)',
      ).run(email, passwordHash, displayName);

      user = { id: result.lastInsertRowid, email, name: displayName };
    }

    const token = signToken(user);
    return res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    console.error('desktop-exchange error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/* ------------------------------------------------------------------ */
/*  GET /api/auth/me   — returns current user from token              */
/* ------------------------------------------------------------------ */
router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id, email, name, created_at FROM users WHERE id = ?').get(req.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.json({ user });
});

export default router;
