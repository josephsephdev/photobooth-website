/**
 * Appwrite Function: desktop-auth-handoff
 *
 * Handles the desktop app auth code flow with two actions:
 *
 *   1. create-code  — Called by the website frontend (authenticated user).
 *      Generates a short-lived, one-time auth code and stores it in the
 *      `desktop_auth_codes` collection. Returns { code }.
 *
 *   2. exchange-code — Called by the desktop app (unauthenticated).
 *      Looks up the code, verifies it's valid / unused / not expired,
 *      marks it as used, creates an Appwrite session for the user,
 *      and returns a JWT + user payload.
 *
 * Environment variables:
 *   DATABASE_ID                  — Appwrite database ID (default: photobooth_db)
 *   COLLECTION_DESKTOP_AUTH_CODES — Collection ID (default: desktop_auth_codes)
 *   CODE_TTL_MINUTES             — Code expiry in minutes (default: 2)
 */

import { Client, Databases, Query, Users, ID } from 'node-appwrite';

// ── Constants ────────────────────────────────────────────────────────

const CODE_LENGTH = 48;
const ALLOWED_ACTIONS = ['create-code', 'exchange-code'];

// ── Helpers ──────────────────────────────────────────────────────────

/**
 * Generate a cryptographically-random, URL-safe code.
 * Uses the Web Crypto API available in Node 18+ / Appwrite function runtimes.
 */
function generateCode(length = CODE_LENGTH) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

// ── Main entry point ─────────────────────────────────────────────────

export default async ({ req, res, log, error }) => {
  // ── Parse body ─────────────────────────────────────────────────────
  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.json({ ok: false, error: 'Invalid JSON body' }, 400);
  }

  const action = body?.action;
  if (!action || !ALLOWED_ACTIONS.includes(action)) {
    return res.json(
      { ok: false, error: `Invalid action. Expected one of: ${ALLOWED_ACTIONS.join(', ')}` },
      400,
    );
  }

  // ── Appwrite admin client ──────────────────────────────────────────
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(req.headers['x-appwrite-key'] ?? '');

  const databases = new Databases(client);
  const users = new Users(client);

  const DATABASE_ID = process.env.DATABASE_ID || 'photobooth_db';
  const COLLECTION  = process.env.COLLECTION_DESKTOP_AUTH_CODES || 'desktop_auth_codes';
  const TTL_MINUTES = parseInt(process.env.CODE_TTL_MINUTES || '2', 10);

  // ── Route to action handler ────────────────────────────────────────
  if (action === 'create-code') {
    return handleCreateCode({ req, res, log, error, databases, users, DATABASE_ID, COLLECTION, TTL_MINUTES });
  }
  if (action === 'exchange-code') {
    return handleExchangeCode({ req, res, log, error, databases, users, client, DATABASE_ID, COLLECTION });
  }
};

// ══════════════════════════════════════════════════════════════════════
//  ACTION: create-code
// ══════════════════════════════════════════════════════════════════════

async function handleCreateCode({ req, res, log, error, databases, users, DATABASE_ID, COLLECTION, TTL_MINUTES }) {
  // The caller must be an authenticated Appwrite user (session-based)
  const userId = req.headers['x-appwrite-user-id'];
  if (!userId) {
    return res.json({ ok: false, error: 'Authentication required' }, 401);
  }

  log(`create-code: userId=${userId}, DATABASE_ID=${DATABASE_ID}, COLLECTION=${COLLECTION}`);
  log(`create-code: endpoint=${process.env.APPWRITE_FUNCTION_API_ENDPOINT}, project=${process.env.APPWRITE_FUNCTION_PROJECT_ID}`);
  log(`create-code: has x-appwrite-key=${!!req.headers['x-appwrite-key']}`);

  try {
    // Fetch user info from Appwrite Auth (server-side, via admin key)
    log(`create-code: fetching user ${userId}...`);
    const user = await users.get(userId);
    log(`create-code: got user ${user.email}`);

    // Clean up any existing unused codes for this user
    try {
      const existing = await databases.listDocuments(DATABASE_ID, COLLECTION, [
        Query.equal('userId', userId),
        Query.equal('used', false),
      ]);
      for (const doc of existing.documents) {
        await databases.deleteDocument(DATABASE_ID, COLLECTION, doc.$id);
      }
    } catch (cleanupErr) {
      // Non-fatal — log and continue
      log(`Cleanup of old codes failed (non-fatal): ${cleanupErr.message}`);
    }

    // Generate the code and expiry
    const code = generateCode();
    const expiresAt = new Date(Date.now() + TTL_MINUTES * 60 * 1000).toISOString();

    // Store in the collection
    log(`create-code: writing document to ${DATABASE_ID}/${COLLECTION}...`);
    await databases.createDocument(DATABASE_ID, COLLECTION, ID.unique(), {
      code,
      userId: user.$id,
      email: user.email,
      name: user.name || '',
      expiresAt,
      used: false,
    });

    log(`create-code: generated code for user=${userId}, expires=${expiresAt}`);
    return res.json({ ok: true, code });
  } catch (err) {
    error(`create-code error: ${err.message}`);
    error(`create-code stack: ${err.stack}`);
    // Surface the real error for debugging
    return res.json({ ok: false, error: `Failed to generate auth code: ${err.message}` }, 500);
  }
}

// ══════════════════════════════════════════════════════════════════════
//  ACTION: exchange-code
// ══════════════════════════════════════════════════════════════════════

async function handleExchangeCode({ req, res, log, error, databases, users, client, DATABASE_ID, COLLECTION }) {
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const { code } = body;

  if (!code) {
    return res.json({ ok: false, error: 'Code is required' }, 400);
  }

  try {
    // Look up the code
    const result = await databases.listDocuments(DATABASE_ID, COLLECTION, [
      Query.equal('code', code),
      Query.limit(1),
    ]);

    if (result.total === 0) {
      return res.json({ ok: false, error: 'Invalid or expired code' }, 401);
    }

    const doc = result.documents[0];

    // Check if already used
    if (doc.used) {
      // Delete the used code document
      await databases.deleteDocument(DATABASE_ID, COLLECTION, doc.$id);
      return res.json({ ok: false, error: 'Code has already been used' }, 401);
    }

    // Check if expired
    if (new Date(doc.expiresAt) < new Date()) {
      await databases.deleteDocument(DATABASE_ID, COLLECTION, doc.$id);
      return res.json({ ok: false, error: 'Code has expired' }, 401);
    }

    // Mark as used
    await databases.updateDocument(DATABASE_ID, COLLECTION, doc.$id, {
      used: true,
    });

    // Fetch the user from Appwrite Auth
    const user = await users.get(doc.userId);

    // Create a short-lived token (JWT) for the desktop app.
    // Appwrite Users.createToken() generates a server-side secret that the
    // desktop app can use with account.createSession() to establish a session.
    const tokenResult = await users.createToken(doc.userId);

    log(`exchange-code: code exchanged for user=${doc.userId}`);

    // Clean up the code document
    await databases.deleteDocument(DATABASE_ID, COLLECTION, doc.$id);

    return res.json({
      ok: true,
      userId: user.$id,
      email: user.email,
      name: user.name,
      emailVerification: user.emailVerification,
      // The secret is used by the desktop app to create a session
      // via account.createSession(userId, secret)
      secret: tokenResult.secret,
    });
  } catch (err) {
    error(`exchange-code error: ${err.message}`);
    return res.json({ ok: false, error: 'Failed to exchange auth code' }, 500);
  }
}
