/**
 * Appwrite Client Configuration
 *
 * This file initialises the Appwrite Web SDK using **public-safe** values only:
 *   - Endpoint URL
 *   - Project ID
 *
 * ⚠️  NEVER put API keys or secrets in frontend code.
 *     All secret operations (Xendit, admin DB writes) run in Appwrite Functions.
 *
 * Usage:
 *   import { account, databases } from '@/app/lib/appwrite';
 */

import { Client, Account, Databases } from 'appwrite';

// ── Environment Variables ──────────────────────────────────────────
const endpoint  = import.meta.env.VITE_APPWRITE_ENDPOINT  || 'https://cloud.appwrite.io/v1';
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID || '';

if (!projectId) {
  console.warn(
    '[Appwrite] VITE_APPWRITE_PROJECT_ID is not set. ' +
    'Copy .env.example → .env and fill in your Appwrite project ID.'
  );
}

// ── Client Singleton ───────────────────────────────────────────────
const client = new Client();

client
  .setEndpoint(endpoint)
  .setProject(projectId);

// ── SDK Service Instances ──────────────────────────────────────────
/** Account service — handles auth (signup, login, sessions, verification) */
export const account = new Account(client);

/** Databases service — CRUD on profiles, subscriptions, payments collections */
export const databases = new Databases(client);

/** Raw client — only needed if you use additional Appwrite services later */
export { client };

export default client;
