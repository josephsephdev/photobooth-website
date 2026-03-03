/**
 * Authentication Service — Appwrite Web SDK
 *
 * All frontend auth operations go through this module:
 *   - createAccount  → creates Appwrite user + session + profile doc + verification email
 *   - signIn         → creates email/password session
 *   - signOut        → deletes the current session
 *   - getCurrentUser → fetches the currently logged-in user
 *   - sendVerificationEmail   → sends email verification link
 *   - completeVerification    → confirms the verification token
 *
 * ⚠️  No API keys are used here. Only the Appwrite Web SDK session cookie.
 */

import { ID, type Models } from 'appwrite';
import { account, databases } from './appwrite';
import {
  DATABASE_ID, COLLECTION,
  PROFILE_FIELDS, USER_ROLES,
} from './database.constants';

// ── Types ──────────────────────────────────────────────────────────

export interface AppwriteUser extends Models.User<Models.Preferences> {}

export interface SignUpParams {
  email: string;
  password: string;
  fullName: string;
}

// ── Auth Functions ─────────────────────────────────────────────────

/**
 * Create a new user account.
 *
 * Flow:
 *  1. account.create()           — register user in Appwrite Auth
 *  2. account.createEmailPasswordSession() — log the user in immediately
 *  3. createUserProfile()        — write a profile document to the database
 *  4. sendVerificationEmail()    — send "verify your email" email
 */
export async function createAccount({ email, password, fullName }: SignUpParams) {
  // 1. Create the Appwrite user
  const newUser = await account.create(
    ID.unique(),
    email,
    password,
    fullName,
  );

  // 2. Create an email/password session so the user is logged in
  await account.createEmailPasswordSession(email, password);

  // 3. Create a profile document in the database
  await createUserProfile(newUser.$id, fullName, email);

  // 4. Send email verification
  await sendVerificationEmail();

  return newUser;
}

/**
 * Sign in with email + password.
 */
export async function signIn(email: string, password: string) {
  const session = await account.createEmailPasswordSession(email, password);
  return session;
}

/**
 * Sign out — deletes the current session.
 */
export async function signOut() {
  await account.deleteSession('current');
}

/**
 * Get the currently logged-in user.
 * Returns null if no valid session exists.
 */
export async function getCurrentUser(): Promise<AppwriteUser | null> {
  try {
    return await account.get();
  } catch {
    // No active session or session expired
    return null;
  }
}

/**
 * Send an email verification link.
 * The user clicks the link → lands on /verify-email with userId + secret params.
 */
export async function sendVerificationEmail() {
  const appUrl = import.meta.env.VITE_APP_URL || 'http://localhost:5173';
  await account.createVerification(`${appUrl}/verify-email`);
}

/**
 * Complete email verification after the user clicks the link.
 */
export async function completeVerification(userId: string, secret: string) {
  await account.updateVerification(userId, secret);
}

// ── Profile Helper ─────────────────────────────────────────────────

/**
 * Create a profile document for a new user.
 *
 * Document permissions:
 *   - Read:  user:{userId}   (only the owner can read)
 *   - Write: user:{userId}   (only the owner can update)
 *
 * NOTE: In production you'll likely also want server-side write access
 *       via Appwrite Functions (for admin or webhook-driven updates).
 *       Configure that through collection-level permissions in the Console.
 */
async function createUserProfile(userId: string, fullName: string, email: string) {
  const now = new Date().toISOString();

  await databases.createDocument(
    DATABASE_ID,
    COLLECTION.PROFILES,
    ID.unique(),
    {
      [PROFILE_FIELDS.USER_ID]:    userId,
      [PROFILE_FIELDS.FULL_NAME]:  fullName,
      [PROFILE_FIELDS.EMAIL]:      email,
      [PROFILE_FIELDS.ROLE]:       USER_ROLES.USER,
      [PROFILE_FIELDS.CREATED_AT]: now,
      [PROFILE_FIELDS.UPDATED_AT]: now,
    },
  );
}
