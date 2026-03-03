/**
 * Desktop Auth Service — Appwrite Function bridge
 *
 * Provides the frontend helper to call the `desktop-auth-handoff` Appwrite
 * Function when the user signs in/up from a desktop app context
 * (`?source=desktop`).
 *
 * The function generates a short-lived, one-time auth code. The website
 * then redirects the browser to the desktop app's local callback URL
 * with `?code=<generated_code>`.
 */

import { ExecutionMethod, Functions } from 'appwrite';
import { client } from './appwrite';

const functions = new Functions(client);

const FUNCTION_ID = 'desktop-auth-handoff';

/**
 * Call the Appwrite Function to generate a one-time desktop auth code.
 *
 * Must be called AFTER the user has successfully authenticated with Appwrite
 * (i.e. an active session exists), so the function can read the user's
 * identity from `x-appwrite-user-id`.
 *
 * @returns The one-time code string, or `null` if generation failed.
 */
export async function createDesktopAuthCode(): Promise<string | null> {
  const execution = await functions.createExecution(
    FUNCTION_ID,
    JSON.stringify({ action: 'create-code' }),
    false,        // async = false → wait for result
    undefined,    // path
    ExecutionMethod.POST,
  );

  if (execution.status === 'failed') {
    console.error('[DesktopAuth] Function execution failed:', execution.responseBody);
    return null;
  }

  const data = JSON.parse(execution.responseBody);
  if (!data.ok || !data.code) {
    console.error('[DesktopAuth] Unexpected response:', data);
    return null;
  }

  return data.code;
}
