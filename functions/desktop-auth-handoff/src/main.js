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

import { Client, Databases, Query, Users, ID, Permission, Role } from 'node-appwrite';

// ── Constants ────────────────────────────────────────────────────────

const CODE_LENGTH = 48;
const ALLOWED_ACTIONS = ['create-code', 'exchange-code', 'get-subscription', 'register-device', 'check-device'];

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

  const COLLECTION_SUBSCRIPTIONS = process.env.COLLECTION_SUBSCRIPTIONS || 'subscriptions';
  const COLLECTION_DEVICES = process.env.COLLECTION_DEVICES || 'devices';

  // ── Route to action handler ────────────────────────────────────────
  if (action === 'create-code') {
    return handleCreateCode({ req, res, log, error, databases, users, DATABASE_ID, COLLECTION, TTL_MINUTES });
  }
  if (action === 'exchange-code') {
    return handleExchangeCode({ req, res, log, error, databases, users, client, DATABASE_ID, COLLECTION, COLLECTION_SUBSCRIPTIONS });
  }
  if (action === 'get-subscription') {
    return handleGetSubscription({ req, res, log, error, databases, DATABASE_ID, COLLECTION_SUBSCRIPTIONS, body });
  }
  if (action === 'register-device') {
    return handleRegisterDevice({ req, res, log, error, databases, DATABASE_ID, COLLECTION_SUBSCRIPTIONS, COLLECTION_DEVICES, body });
  }
  if (action === 'check-device') {
    return handleCheckDevice({ req, res, log, error, databases, DATABASE_ID, COLLECTION_DEVICES, body });
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

    // Block unverified users from getting a desktop auth code
    if (!user.emailVerification) {
      log(`create-code: blocked unverified user ${user.email}`);
      return res.json({ ok: false, error: 'Please verify your email address before signing in to the desktop app.' }, 403);
    }

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

async function handleExchangeCode({ req, res, log, error, databases, users, client, DATABASE_ID, COLLECTION, COLLECTION_SUBSCRIPTIONS }) {
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

    // Block unverified users (defense in depth)
    if (!user.emailVerification) {
      await databases.deleteDocument(DATABASE_ID, COLLECTION, doc.$id);
      log(`exchange-code: blocked unverified user ${user.email}`);
      return res.json({ ok: false, error: 'Please verify your email address before signing in to the desktop app.' }, 403);
    }

    // Create a short-lived token (JWT) for the desktop app.
    // Appwrite Users.createToken() generates a server-side secret that the
    // desktop app can use with account.createSession() to establish a session.
    const tokenResult = await users.createToken(doc.userId);

    log(`exchange-code: code exchanged for user=${doc.userId}`);

    // Clean up the code document
    await databases.deleteDocument(DATABASE_ID, COLLECTION, doc.$id);

    // Fetch subscription state so the desktop app has it immediately
    const subscription = await getSubscriptionState(databases, DATABASE_ID, COLLECTION_SUBSCRIPTIONS, user.$id);
    log(`exchange-code: subscription for user=${doc.userId}: ${subscription.accountType} (${subscription.planName || 'none'})`);

    return res.json({
      ok: true,
      userId: user.$id,
      email: user.email,
      name: user.name,
      emailVerification: user.emailVerification,
      // The secret is used by the desktop app to create a session
      // via account.createSession(userId, secret)
      secret: tokenResult.secret,
      // Subscription state included so the desktop app doesn't need a separate call
      subscription,
    });
  } catch (err) {
    error(`exchange-code error: ${err.message}`);
    return res.json({ ok: false, error: 'Failed to exchange auth code' }, 500);
  }
}

// ══════════════════════════════════════════════════════════════════════
//  ACTION: get-subscription
// ══════════════════════════════════════════════════════════════════════

async function handleGetSubscription({ req, res, log, error, databases, DATABASE_ID, COLLECTION_SUBSCRIPTIONS, body }) {
  const { userId } = body;

  if (!userId) {
    return res.json({ ok: false, error: 'userId is required' }, 400);
  }

  try {
    const subscription = await getSubscriptionState(databases, DATABASE_ID, COLLECTION_SUBSCRIPTIONS, userId);
    log(`get-subscription: user=${userId} accountType=${subscription.accountType} watermark=${subscription.watermarkEnabled}`);
    return res.json({ ok: true, ...subscription });
  } catch (err) {
    error(`get-subscription error: ${err.message}`);
    return res.json({ ok: false, error: 'Failed to fetch subscription' }, 500);
  }
}

// ══════════════════════════════════════════════════════════════════════
//  ACTION: register-device
// ══════════════════════════════════════════════════════════════════════

const DEFAULT_DEVICE_LIMIT = 2;

async function handleRegisterDevice({ req, res, log, error, databases, DATABASE_ID, COLLECTION_SUBSCRIPTIONS, COLLECTION_DEVICES, body }) {
  const { userId, deviceId, deviceName, platform } = body;

  if (!userId) {
    return res.json({ ok: false, error: 'userId is required' }, 400);
  }
  if (!deviceId || typeof deviceId !== 'string') {
    return res.json({ ok: false, error: 'deviceId is required' }, 400);
  }
  if (!deviceName || typeof deviceName !== 'string') {
    return res.json({ ok: false, error: 'deviceName is required' }, 400);
  }

  try {
    // 1. Get device limit from active subscription (paid users only)
    // Free users (no active subscription) have unlimited devices
    const now = new Date().toISOString();
    const subs = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_SUBSCRIPTIONS,
      [
        Query.equal('userId', userId),
        Query.equal('status', 'active'),
        Query.greaterThan('expiresAt', now),
        Query.orderDesc('expiresAt'),
        Query.limit(1),
      ],
    );

    // If no active subscription, free user has unlimited devices (no limit)
    // If subscription exists, use its configured device limit
    const hasActiveSubscription = subs.total > 0;
    const deviceLimit = hasActiveSubscription 
      ? (subs.documents[0].deviceLimit ?? DEFAULT_DEVICE_LIMIT)
      : null; // null = unlimited for free users

    // 2. Get current devices for this user
    const existingDevices = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_DEVICES,
      [
        Query.equal('userId', userId),
        Query.limit(100),
      ],
    );

    // 3. Check if this device is already registered (idempotent)
    const existingDevice = existingDevices.documents.find(d => d.deviceId === deviceId);
    if (existingDevice) {
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_DEVICES,
        existingDevice.$id,
        {
          lastActive: new Date().toISOString(),
          deviceName: deviceName.slice(0, 100),
          platform: (platform || existingDevice.platform || 'unknown').slice(0, 20),
        },
      );
      log(`Device ${deviceId} already registered for user ${userId}; updated lastActive`);
      return res.json({
        ok: true,
        success: true,
        totalDevices: existingDevices.total,
        deviceLimit: deviceLimit ?? 0, // Return 0 to indicate unlimited
      });
    }

    // 4. Check device limit (only for paid users with a subscription)
    if (deviceLimit !== null && existingDevices.total >= deviceLimit) {
      log(`Device limit reached for user ${userId}: ${existingDevices.total}/${deviceLimit}`);
      return res.json({
        ok: false,
        error: 'device_limit_reached',
        message: `Device limit reached (${deviceLimit}). Remove a device to register a new one.`,
        devices: existingDevices.documents.map(d => ({
          $id: d.$id,
          deviceId: d.deviceId,
          deviceName: d.deviceName,
          platform: d.platform,
          lastActive: d.lastActive,
          createdAt: d.createdAt,
        })),
        deviceLimit,
      }, 429);
    }

    // 5. Create new device document
    await databases.createDocument(
      DATABASE_ID,
      COLLECTION_DEVICES,
      ID.unique(),
      {
        userId,
        deviceId: deviceId.slice(0, 64),
        deviceName: deviceName.slice(0, 100),
        platform: (platform || 'unknown').slice(0, 20),
        lastActive: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
      [
        Permission.read(Role.user(userId)),
        Permission.delete(Role.user(userId)),
      ],
    );

    log(`Device ${deviceId} registered for user ${userId} (${existingDevices.total + 1}/${deviceLimit ?? 'unlimited'})`);
    return res.json({
      ok: true,
      success: true,
      totalDevices: existingDevices.total + 1,
      deviceLimit: deviceLimit ?? 0, // Return 0 to indicate unlimited
    });
  } catch (err) {
    error(`register-device error: ${err.message}`);
    return res.json({ ok: false, error: 'Failed to register device' }, 500);
  }
}

// ══════════════════════════════════════════════════════════════════════
//  ACTION: check-device
// ══════════════════════════════════════════════════════════════════════

async function handleCheckDevice({ req, res, log, error, databases, DATABASE_ID, COLLECTION_DEVICES, body }) {
  const { userId, deviceId } = body;

  if (!userId || !deviceId) {
    return res.json({ ok: false, error: 'userId and deviceId are required' }, 400);
  }

  try {
    const result = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_DEVICES,
      [
        Query.equal('userId', userId),
        Query.equal('deviceId', deviceId),
        Query.limit(1),
      ],
    );

    const allowed = result.total > 0;
    log(`check-device: user=${userId} device=${deviceId.slice(0, 8)}… allowed=${allowed}`);
    return res.json({ ok: true, allowed });
  } catch (err) {
    error(`check-device error: ${err.message}`);
    return res.json({ ok: false, error: 'Failed to check device' }, 500);
  }
}

// ══════════════════════════════════════════════════════════════════════
//  SHARED: Subscription state lookup
// ══════════════════════════════════════════════════════════════════════

/**
 * Fetch a user's subscription state from the subscriptions collection.
 * Uses the same business rules as check-user-subscription-access.
 */
async function getSubscriptionState(databases, databaseId, collectionId, userId) {
  const FREE_STATE = {
    hasAccess: false,
    accountType: 'free',
    subscriptionStatus: 'none',
    planId: null,
    planName: null,
    expiresAt: null,
    watermarkEnabled: true,
    removeWatermark: false,
  };

  const result = await databases.listDocuments(databaseId, collectionId, [
    Query.equal('userId', userId),
    Query.orderDesc('updatedAt'),
    Query.limit(1),
  ]);

  if (result.total === 0) {
    return FREE_STATE;
  }

  const sub = result.documents[0];
  const now = new Date();
  const expiresAt = sub.expiresAt ? new Date(sub.expiresAt) : null;
  const isExpired = !expiresAt || expiresAt <= now;
  const ACTIVE_STATUSES = ['active', 'canceled'];
  const hasAccess = ACTIVE_STATUSES.includes(sub.status) && !isExpired;

  return {
    hasAccess,
    accountType: hasAccess ? 'paid' : 'free',
    subscriptionStatus: sub.status,
    planId: hasAccess ? sub.planId : null,
    planName: hasAccess ? sub.planName : null,
    expiresAt: sub.expiresAt || null,
    watermarkEnabled: !hasAccess,
    removeWatermark: hasAccess,
  };
}
