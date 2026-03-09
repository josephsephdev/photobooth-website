/**
 * Auth routes — sign-up, sign-in, current user.
 *
 * Passwords are hashed with Node's built-in crypto (scrypt).
 * In production swap for bcrypt / argon2 if preferred.
 */

import { Router } from 'express';
import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { nanoid } from 'nanoid';
import db from '../db/index.js';
import { signToken, requireAuth } from '../middleware/auth.js';
import { getUserByAppwriteId } from '../config/appwrite.js';

const scrypt = promisify(crypto.scrypt);
const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

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
    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });
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
    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
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
/*  POST /api/auth/desktop-code                                       */
/*                                                                    */
/*  Called by the website frontend after successful Appwrite auth      */
/*  when `source=desktop`. Finds or creates the user in SQLite,       */
/*  then returns a short-lived, one-time authorization code.          */
/*                                                                    */
/*  The website redirects to the desktop app callback with this code. */
/*  The desktop app then exchanges it via POST /api/auth/desktop-     */
/*  exchange to obtain a long-lived JWT.                              */
/* ------------------------------------------------------------------ */

const AUTH_CODE_TTL_MINUTES = 5;

router.post('/desktop-code', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (user) {
      // User exists — verify password
      const valid = await verifyPassword(password, user.password_hash);
      if (!valid) {
        return res.status(401).json({ error: 'Invalid email or password' });
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

    // Clean up any expired codes for this user
    db.prepare(
      'DELETE FROM auth_codes WHERE user_id = ? OR expires_at < datetime(\'now\')',
    ).run(user.id);

    // Generate a short-lived, one-time auth code
    const code = nanoid(48); // URL-safe, 48 chars
    const expiresAt = new Date(Date.now() + AUTH_CODE_TTL_MINUTES * 60 * 1000).toISOString();

    db.prepare(
      'INSERT INTO auth_codes (code, user_id, expires_at) VALUES (?, ?, ?)',
    ).run(code, user.id, expiresAt);

    return res.json({ code });
  } catch (err) {
    console.error('desktop-code error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/* ------------------------------------------------------------------ */
/*  POST /api/auth/desktop-exchange                                   */
/*                                                                    */
/*  Called by the desktop app to exchange a one-time auth code for a   */
/*  long-lived JWT. The code is single-use and expires after 5 min.   */
/*                                                                    */
/*  Request:  { "code": "<one-time-code>" }                           */
/*  Response: { "token": "JWT...", "user": { id, email, name } }      */
/* ------------------------------------------------------------------ */
router.post('/desktop-exchange', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Code is required' });
    }

    // Look up the auth code
    const row = db.prepare(
      'SELECT * FROM auth_codes WHERE code = ?',
    ).get(code);

    if (!row) {
      return res.status(401).json({ error: 'Invalid or expired code' });
    }

    // Check if already used
    if (row.used) {
      // Delete the used code and reject
      db.prepare('DELETE FROM auth_codes WHERE code = ?').run(code);
      return res.status(401).json({ error: 'Code has already been used' });
    }

    // Check expiration
    if (new Date(row.expires_at) < new Date()) {
      db.prepare('DELETE FROM auth_codes WHERE code = ?').run(code);
      return res.status(401).json({ error: 'Code has expired' });
    }

    // Mark the code as used and delete it (one-time)
    db.prepare('DELETE FROM auth_codes WHERE code = ?').run(code);

    // Look up the user
    const user = db.prepare(
      'SELECT id, email, name FROM users WHERE id = ?',
    ).get(row.user_id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Issue a long-lived JWT for the desktop app
    const token = signToken(user);
    return res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    console.error('desktop-exchange error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/* ------------------------------------------------------------------ */
/*  POST /api/auth/appwrite-exchange                                  */
/*                                                                    */
/*  Called by the desktop app after the Appwrite code-exchange flow.  */
/*  Accepts the Appwrite userId + token secret returned by the        */
/*  desktop-auth-handoff function, verifies the token against the     */
/*  Appwrite REST API, then issues a long-lived website JWT.          */
/*                                                                    */
/*  This is the bridge that lets the desktop app call the website's   */
/*  /api/account/subscription endpoint (which requires a website JWT).*/
/*                                                                    */
/*  Request:  { userId: string, secret: string }                      */
/*  Response: { token: string, user: { id, email, name } }            */
/* ------------------------------------------------------------------ */
router.post('/appwrite-exchange', async (req, res) => {
  try {
    const { userId, secret } = req.body;
    if (!userId || !secret || typeof userId !== 'string' || typeof secret !== 'string') {
      return res.status(400).json({ error: 'userId and secret are required' });
    }

    const endpoint = process.env.APPWRITE_ENDPOINT || process.env.VITE_APPWRITE_ENDPOINT || '';
    const projectId = process.env.APPWRITE_PROJECT_ID || process.env.VITE_APPWRITE_PROJECT_ID || '';

    if (!endpoint || !projectId) {
      return res.status(503).json({ error: 'Appwrite not configured on this server' });
    }

    // Verify the Appwrite token by exchanging it for a session.
    // POST /account/sessions/token is the magic-URL / token-session endpoint.
    // It does NOT require an API key — the secret IS the proof of identity.
    const sessionRes = await fetch(`${endpoint}/account/sessions/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': projectId,
      },
      body: JSON.stringify({ userId, secret }),
    });

    if (!sessionRes.ok) {
      return res.status(401).json({ error: 'Invalid or expired Appwrite token' });
    }

    // Use the admin SDK to get the verified email (trusted source over the request body)
    const appwriteUser = await getUserByAppwriteId(userId);
    if (!appwriteUser) {
      return res.status(404).json({ error: 'Appwrite user not found' });
    }
    if (!appwriteUser.emailVerification) {
      return res.status(403).json({ error: 'Email address is not verified' });
    }

    const email = appwriteUser.email;
    const displayName = appwriteUser.name ||
      email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    // Find or create the user in the SQLite billing DB
    let user = db.prepare('SELECT id, email, name FROM users WHERE email = ?').get(email);
    if (!user) {
      // Desktop-auth users don't have a local password — set a random one
      const randomPw = crypto.randomBytes(32).toString('hex');
      const passwordHash = await hashPassword(randomPw);
      const result = db.prepare(
        'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)',
      ).run(email, passwordHash, displayName);
      user = { id: result.lastInsertRowid, email, name: displayName };
    }

    const token = signToken(user);
    return res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    console.error('appwrite-exchange error:', err);
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
