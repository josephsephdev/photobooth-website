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
 *  1. Clear any existing session (to prevent "session is active" error)
 *  2. account.create()           — register user in Appwrite Auth
 *  3. account.createEmailPasswordSession() — session needed for verification email + link
 *  4. sendVerificationEmail()    — send "verify your email" email
 *  5. If email verification fails, delete the user account
 *
 * NOTE: Session is kept active so `updateVerification` works when the user
 *       clicks the verification link. The AuthContext does NOT treat unverified
 *       users as authenticated, so the session alone doesn't grant access.
 *       Profile document is only created after email verification is complete.
 *
 * ⚠️  FIXES:
 *     - Clears any stale sessions before creating the account (prevents "session is active" errors)
 *     - If email verification fails, the newly created account is deleted to prevent orphaned unverified accounts
 */
export async function createAccount({ email, password, fullName }: SignUpParams) {
  // 0. Clear any existing session (e.g., leftover from previous signup attempt)
  try {
    await account.deleteSession('current');
  } catch {
    // No session exists — that's fine
  }

  // 1. Create the Appwrite user
  const newUser = await account.create(
    ID.unique(),
    email,
    password,
    fullName,
  );

  // 2. Create a session (needed for sending verification + completing it later)
  await account.createEmailPasswordSession(email, password);

  // 3. Send email verification (with error handling)
  try {
    await sendVerificationEmail();
  } catch (emailError) {
    // If email verification fails, delete the account that was just created
    // to prevent orphaned unverified accounts
    try {
      await account.delete();
    } catch (deleteError) {
      console.error('Failed to clean up account after email verification failure:', deleteError);
    }
    // Re-throw the original email error
    throw emailError;
  }

  return newUser;
}

/**
 * Sign in with email + password.
 * Blocks unverified users — they must verify their email first.
 */
export async function signIn(email: string, password: string) {
  // Clear any stale session (e.g. leftover from signup before verification)
  try { await account.deleteSession('current'); } catch { /* no session — fine */ }

  const session = await account.createEmailPasswordSession(email, password);

  // Check that the user's email is verified
  const user = await account.get();
  if (!user.emailVerification) {
    await account.deleteSession('current');
    throw new Error('Please verify your email address before signing in. Check your inbox for a verification link.');
  }

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

/**
 * Change password for the currently logged-in user.
 * Requires the user to provide their current password as verification.
 */
export async function changePassword(currentPassword: string, newPassword: string) {
  await account.updatePassword(newPassword, currentPassword);
}

/**
 * Request a password reset email.
 * Sends an email with a recovery link to the user.
 */
export async function requestPasswordReset(email: string) {
  const appUrl = import.meta.env.VITE_APP_URL || 'http://localhost:5173';
  await account.createRecovery(email, `${appUrl}/reset-password`);
}

/**
 * Complete password reset after the user clicks the recovery link.
 * Called with the userId and secret from the URL params.
 */
export async function completePasswordReset(userId: string, secret: string, newPassword: string) {
  await account.updateRecovery(userId, secret, newPassword);
}

// ── Profile Helper ─────────────────────────────────────────────────

/**
 * Create a profile document for a verified user.
 *
 * Called after email verification is complete — only verified users
 * get a profile document in the database.
 *
 * Document permissions:
 *   - Read:  user:{userId}   (only the owner can read)
 *   - Write: user:{userId}   (only the owner can update)
 */
export async function createUserProfile(userId: string, fullName: string, email: string) {
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
