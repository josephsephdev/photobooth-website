/**
 * Appwrite Function: desktop-auth-handoff
 *
 * Handles the desktop app authentication handoff using a secure one-time code flow.
 *
 * Actions:
 *   - create-code   : Website frontend calls after Appwrite sign-in/sign-up (authenticated)
 *   - exchange-code  : Desktop app calls with the one-time code (unauthenticated)
 *
 * Environment variables:
 *   DATABASE_ID, COLLECTION_DESKTOP_AUTH_CODES, CODE_TTL_MINUTES
 */

import { Client, Databases, Query, Users, ID } from 'node-appwrite';

const CODE_LENGTH = 48;
const ALLOWED_ACTIONS = ['create-code', 'exchange-code'];

function generateCode(length = CODE_LENGTH) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

export default async ({ req, res, log, error }) => {
  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.json({ ok: false, error: 'Invalid JSON body' }, 400);
  }

  const action = body?.action;
  if (!action || !ALLOWED_ACTIONS.includes(action)) {
    return res.json({ ok: false, error: `Invalid action. Expected one of: ${ALLOWED_ACTIONS.join(', ')}` }, 400);
  }

  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(req.headers['x-appwrite-key'] ?? '');

  const databases = new Databases(client);
  const users = new Users(client);

  const DATABASE_ID = process.env.DATABASE_ID || 'photobooth_db';
  const COLLECTION = process.env.COLLECTION_DESKTOP_AUTH_CODES || 'desktop_auth_codes';
  const TTL_MINUTES = parseInt(process.env.CODE_TTL_MINUTES || '2', 10);

  if (action === 'create-code') {
    return handleCreateCode({ req, res, log, error, databases, users, DATABASE_ID, COLLECTION, TTL_MINUTES });
  }
  if (action === 'exchange-code') {
    return handleExchangeCode({ req, res, log, error, databases, users, client, DATABASE_ID, COLLECTION });
  }
};

async function handleCreateCode({ req, res, log, error, databases, users, DATABASE_ID, COLLECTION, TTL_MINUTES }) {
  const userId = req.headers['x-appwrite-user-id'];
  if (!userId) {
    return res.json({ ok: false, error: 'Authentication required' }, 401);
  }

  try {
    const user = await users.get(userId);

    // Block unverified users from getting a desktop auth code
    if (!user.emailVerification) {
      log(`create-code: blocked unverified user ${user.email}`);
      return res.json({ ok: false, error: 'Please verify your email address before signing in to the desktop app.' }, 403);
    }

    try {
      const existing = await databases.listDocuments(DATABASE_ID, COLLECTION, [
        Query.equal('userId', userId),
        Query.equal('used', false),
      ]);
      for (const doc of existing.documents) {
        await databases.deleteDocument(DATABASE_ID, COLLECTION, doc.$id);
      }
    } catch (cleanupErr) {
      log(`Cleanup of old codes failed (non-fatal): ${cleanupErr.message}`);
    }

    const code = generateCode();
    const expiresAt = new Date(Date.now() + TTL_MINUTES * 60 * 1000).toISOString();

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
    return res.json({ ok: false, error: 'Failed to generate auth code' }, 500);
  }
}

async function handleExchangeCode({ req, res, log, error, databases, users, client, DATABASE_ID, COLLECTION }) {
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const { code } = body;

  if (!code) {
    return res.json({ ok: false, error: 'Code is required' }, 400);
  }

  try {
    const result = await databases.listDocuments(DATABASE_ID, COLLECTION, [
      Query.equal('code', code),
      Query.limit(1),
    ]);

    if (result.total === 0) {
      return res.json({ ok: false, error: 'Invalid or expired code' }, 401);
    }

    const doc = result.documents[0];

    if (doc.used) {
      await databases.deleteDocument(DATABASE_ID, COLLECTION, doc.$id);
      return res.json({ ok: false, error: 'Code has already been used' }, 401);
    }

    if (new Date(doc.expiresAt) < new Date()) {
      await databases.deleteDocument(DATABASE_ID, COLLECTION, doc.$id);
      return res.json({ ok: false, error: 'Code has expired' }, 401);
    }

    await databases.updateDocument(DATABASE_ID, COLLECTION, doc.$id, { used: true });

    const user = await users.get(doc.userId);

    // Block unverified users (defense in depth)
    if (!user.emailVerification) {
      await databases.deleteDocument(DATABASE_ID, COLLECTION, doc.$id);
      log(`exchange-code: blocked unverified user ${user.email}`);
      return res.json({ ok: false, error: 'Please verify your email address before signing in to the desktop app.' }, 403);
    }

    const tokenResult = await users.createToken(doc.userId);

    log(`exchange-code: code exchanged for user=${doc.userId}`);

    await databases.deleteDocument(DATABASE_ID, COLLECTION, doc.$id);

    return res.json({
      ok: true,
      userId: user.$id,
      email: user.email,
      name: user.name,
      emailVerification: user.emailVerification,
      secret: tokenResult.secret,
    });
  } catch (err) {
    error(`exchange-code error: ${err.message}`);
    return res.json({ ok: false, error: 'Failed to exchange auth code' }, 500);
  }
}
