/**
 * Appwrite Service — server-side access to Appwrite Cloud.
 *
 * Uses `node-appwrite` with an API key to read from the Appwrite
 * database (profiles, subscriptions, payments).
 *
 * This bridges the Express/SQLite backend with the Appwrite data
 * that the website frontend and Appwrite Functions write to.
 *
 * Required environment variables:
 *   APPWRITE_ENDPOINT          — e.g. https://sgp.cloud.appwrite.io/v1
 *   APPWRITE_PROJECT_ID        — your Appwrite project ID
 *   APPWRITE_API_KEY           — server-side API key (Databases read scope)
 *   APPWRITE_DATABASE_ID       — e.g. photobooth_db
 *   APPWRITE_COLLECTION_SUBSCRIPTIONS — e.g. subscriptions
 *   APPWRITE_COLLECTION_PROFILES      — e.g. profiles
 */

import { Client, Databases, Query } from 'node-appwrite';

// ── Config ─────────────────────────────────────────────────────────

const ENDPOINT   = process.env.APPWRITE_ENDPOINT   || process.env.VITE_APPWRITE_ENDPOINT   || '';
const PROJECT_ID = process.env.APPWRITE_PROJECT_ID || process.env.VITE_APPWRITE_PROJECT_ID || '';
const API_KEY    = process.env.APPWRITE_API_KEY    || '';

const DATABASE_ID              = process.env.APPWRITE_DATABASE_ID               || process.env.VITE_APPWRITE_DATABASE_ID               || 'photobooth_db';
const COLLECTION_SUBSCRIPTIONS = process.env.APPWRITE_COLLECTION_SUBSCRIPTIONS  || process.env.VITE_APPWRITE_COLLECTION_SUBSCRIPTIONS  || 'subscriptions';
const COLLECTION_PROFILES      = process.env.APPWRITE_COLLECTION_PROFILES       || process.env.VITE_APPWRITE_COLLECTION_PROFILES       || 'profiles';

// ── SDK Init ───────────────────────────────────────────────────────

let databases = null;

function getDb() {
  if (databases) return databases;

  if (!ENDPOINT || !PROJECT_ID || !API_KEY) {
    console.warn(
      '⚠️  Appwrite credentials missing (APPWRITE_ENDPOINT / APPWRITE_PROJECT_ID / APPWRITE_API_KEY). ' +
      'Subscription lookup will fall back to SQLite.',
    );
    return null;
  }

  const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

  databases = new Databases(client);
  console.log('✅ Appwrite SDK initialised for server-side queries');
  return databases;
}

// ── Queries ────────────────────────────────────────────────────────

/**
 * Look up the Appwrite userId for a given email by querying the
 * `profiles` collection.  Returns the userId string, or null.
 */
export async function getAppwriteUserIdByEmail(email) {
  const db = getDb();
  if (!db) return null;

  try {
    const result = await db.listDocuments(DATABASE_ID, COLLECTION_PROFILES, [
      Query.equal('email', email),
      Query.limit(1),
    ]);
    if (result.total === 0) return null;
    return result.documents[0].userId ?? null;
  } catch (err) {
    console.error('Appwrite profile lookup error:', err.message);
    return null;
  }
}

/**
 * Get the subscription access state for a user from Appwrite.
 *
 * This replicates the business rules from the Appwrite Function
 * `check-user-subscription-access`, ensuring the Express server
 * returns the same data the website frontend sees.
 *
 * Rules:
 *   1. No subscription → Free
 *   2. status in {active, canceled} AND expiresAt > now → Paid / Active
 *   3. Otherwise → Free / Inactive
 *
 * @param {string} appwriteUserId  — the Appwrite auth user ID
 * @returns {Promise<object>}  access state
 */
export async function getSubscriptionByAppwriteUserId(appwriteUserId) {
  const FREE_RESPONSE = {
    plan: 'free',
    planName: 'Free',
    status: 'none',
    removeWatermark: false,
    startDate: null,
    endDate: null,
    activeUntil: null,
  };

  const db = getDb();
  if (!db) return null;     // null = Appwrite not configured, use SQLite fallback

  try {
    const result = await db.listDocuments(DATABASE_ID, COLLECTION_SUBSCRIPTIONS, [
      Query.equal('userId', appwriteUserId),
      Query.orderDesc('updatedAt'),
      Query.limit(1),
    ]);

    if (result.total === 0) return FREE_RESPONSE;

    const sub = result.documents[0];
    const now = new Date();
    const expiresAt = sub.expiresAt ? new Date(sub.expiresAt) : null;
    const isExpired = !expiresAt || expiresAt <= now;

    const ACTIVE_STATUSES = ['active', 'canceled'];
    const hasAccess = ACTIVE_STATUSES.includes(sub.status) && !isExpired;

    return {
      plan: hasAccess ? sub.planId : 'free',
      planName: hasAccess ? (sub.planName || sub.planId) : 'Free',
      price: '',
      priceNote: '',
      status: sub.status,
      removeWatermark: hasAccess,
      startDate: sub.startDate || null,
      endDate: sub.expiresAt || null,
      activeUntil: sub.expiresAt || null,
      autoRenew: false,
      durationDays: 0,
    };
  } catch (err) {
    console.error('Appwrite subscription query error:', err.message);
    return null;    // null = error, fall back to SQLite
  }
}

/**
 * Full subscription lookup by user email.
 * 1. Finds the Appwrite userId via profiles collection
 * 2. Queries subscriptions by that userId
 *
 * Returns the subscription response object, or null if Appwrite
 * is not configured or the lookup fails (caller should fall back).
 */
export async function getSubscriptionByEmail(email) {
  const appwriteUserId = await getAppwriteUserIdByEmail(email);
  if (!appwriteUserId) return null;
  return getSubscriptionByAppwriteUserId(appwriteUserId);
}

/**
 * Check if Appwrite is configured and usable.
 */
export function isAppwriteConfigured() {
  return !!(ENDPOINT && PROJECT_ID && API_KEY);
}
