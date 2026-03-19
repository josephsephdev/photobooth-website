/**
 * Subscription Service — Frontend → Appwrite Functions bridge
 *
 * These functions call **Appwrite Functions** (server-side) which in turn
 * communicate with the Xendit API. The frontend never touches Xendit secrets.
 *
 * Each function uses the Appwrite SDK `functions.createExecution()` to invoke
 * a deployed Appwrite Function by its function ID.
 *
 * ⚠️  Replace the FUNCTION_ID constants below with the actual IDs from your
 *     Appwrite Console after deploying the functions.
 */

import { ExecutionMethod, Functions } from 'appwrite';
import { client } from './appwrite';

const functions = new Functions(client);

// ── Function IDs (set these after deploying Appwrite Functions) ────
const FUNCTION_IDS = {
  CREATE_XENDIT_SUBSCRIPTION:  'create-xendit-subscription',
  CANCEL_XENDIT_SUBSCRIPTION:  'cancel-xendit-subscription',
  CANCEL_XENDIT_PAYMENT:       'cancel-xendit-payment',
  RENEW_XENDIT_SUBSCRIPTION:   'renew-xendit-subscription',
  CHECK_SUBSCRIPTION_ACCESS:   'check-user-subscription-access',
} as const;

// ── Types ──────────────────────────────────────────────────────────

interface CheckoutResponse {
  checkoutUrl: string;
}

interface SubscriptionAccessResponse {
  hasAccess: boolean;
  accountType: 'free' | 'paid';
  subscriptionStatus: string;
  planId: string | null;
  planName: string | null;
  expiresAt: string | null;
  watermarkEnabled: boolean;
}

interface CancelSubscriptionResponse {
  message: string;
  effectiveAt: string | null;
  cancelAtPeriodEnd: boolean;
  alreadyCanceled?: boolean;
}

// ── Checkout ───────────────────────────────────────────────────────

/**
 * Call the Appwrite Function that creates a Xendit checkout / invoice.
 * Returns the hosted checkout URL to redirect the user to.
 */
export async function createXenditCheckout(
  planId: string,
  durationUnits: number = 1,
  deviceLimit: number = 2,
): Promise<CheckoutResponse> {
  console.log('[Checkout] Calling create-xendit-subscription with:', { planId, durationUnits, deviceLimit });
  
  const execution = await functions.createExecution(
    FUNCTION_IDS.CREATE_XENDIT_SUBSCRIPTION,
    JSON.stringify({ planId, durationUnits, deviceLimit }),
    false,        // async = false → wait for result
    undefined,    // path
    ExecutionMethod.POST,
  );

  console.log('[Checkout] Execution result:', {
    status: execution.status,
    responseStatusCode: execution.responseStatusCode,
    responseBody: execution.responseBody,
    functionId: execution.functionId,
  });

  if (execution.responseStatusCode >= 400) {
    const body = tryParseJson(execution.responseBody);
    throw new Error(body?.error || `Function returned status ${execution.responseStatusCode}: ${execution.responseBody}`);
  }

  const data = tryParseJson(execution.responseBody);
  if (!data?.checkoutUrl) {
    throw new Error(`Invalid response from checkout function. Status: ${execution.responseStatusCode}, Body: ${execution.responseBody}`);
  }
  return data as CheckoutResponse;
}

// ── Cancel ─────────────────────────────────────────────────────────

/**
 * Cancel the user's current subscription via Appwrite Function.
 */
export async function cancelXenditSubscription(
  subscriptionDocId?: string,
): Promise<CancelSubscriptionResponse> {
  const payload = subscriptionDocId ? { subscriptionDocId } : {};

  const execution = await functions.createExecution(
    FUNCTION_IDS.CANCEL_XENDIT_SUBSCRIPTION,
    JSON.stringify(payload),
    false,
    undefined,
    ExecutionMethod.POST,
  );

  if (execution.responseStatusCode >= 400) {
    const body = tryParseJson(execution.responseBody);
    throw new Error(body?.error || 'Failed to cancel subscription');
  }

  const data = tryParseJson(execution.responseBody);
  return {
    message: data?.message || 'Subscription cancellation scheduled',
    effectiveAt: data?.effectiveAt || null,
    cancelAtPeriodEnd: Boolean(data?.cancelAtPeriodEnd),
    alreadyCanceled: Boolean(data?.alreadyCanceled),
  };
}

/**
 * PHASE 2: Cancel a pending payment via Appwrite Function.
 * This will expire the invoice in Xendit and mark it cancelled locally.
 */
export async function cancelXenditPayment(paymentId: string): Promise<any> {
  const execution = await functions.createExecution(
    FUNCTION_IDS.CANCEL_XENDIT_PAYMENT,
    JSON.stringify({ paymentId }),
    false,
    undefined,
    ExecutionMethod.POST,
  );

  if (execution.responseStatusCode >= 400) {
    const body = tryParseJson(execution.responseBody);
    throw new Error(body?.error || 'Failed to cancel payment');
  }

  const data = tryParseJson(execution.responseBody);
  return data;
}

// ── Renew / Reactivate ─────────────────────────────────────────────

/**
 * Renew or reactivate a subscription via Appwrite Function.
 */
export async function renewXenditSubscription(planId: string): Promise<CheckoutResponse> {
  const execution = await functions.createExecution(
    FUNCTION_IDS.RENEW_XENDIT_SUBSCRIPTION,
    JSON.stringify({ planId }),
    false,
    undefined,
    ExecutionMethod.POST,
  );

  if (execution.responseStatusCode >= 400) {
    const body = tryParseJson(execution.responseBody);
    throw new Error(body?.error || 'Failed to renew subscription');
  }

  const data = tryParseJson(execution.responseBody);
  if (!data?.checkoutUrl) {
    throw new Error('Invalid response from renew function');
  }
  return data as CheckoutResponse;
}

// ── Access Check ───────────────────────────────────────────────────

/**
 * Server-side subscription access check (authoritative source of truth).
 * Returns the full access state including watermark flag.
 * Both the website and the desktop app should use this endpoint.
 */
export async function checkSubscriptionAccess(): Promise<SubscriptionAccessResponse> {
  const FREE_FALLBACK: SubscriptionAccessResponse = {
    hasAccess: false,
    accountType: 'free',
    subscriptionStatus: 'none',
    planId: null,
    planName: null,
    expiresAt: null,
    watermarkEnabled: true,
  };

  try {
    const execution = await functions.createExecution(
      FUNCTION_IDS.CHECK_SUBSCRIPTION_ACCESS,
      '',
      false,
      undefined,
      ExecutionMethod.GET,
    );

    if (execution.responseStatusCode >= 400) {
      return FREE_FALLBACK;
    }

    const data = tryParseJson(execution.responseBody);
    if (!data || typeof data.hasAccess !== 'boolean') {
      return FREE_FALLBACK;
    }
    return data as SubscriptionAccessResponse;
  } catch {
    return FREE_FALLBACK;
  }
}

// ── Util ───────────────────────────────────────────────────────────

function tryParseJson(str: string): any {
  try { return JSON.parse(str); } catch { return null; }
}
