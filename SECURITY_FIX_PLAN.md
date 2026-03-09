# 🛠️ Security Fix Implementation Plan

**Created:** March 9, 2026  
**Reference:** `SECURITY_AUDIT.md`  
**Status:** ✅ Code Changes Complete — Pending deployment & V-13 manual console config

---

## Overview

This document specifies the exact changes needed to fix all vulnerabilities identified in the security audit. Changes are grouped into 4 phases by priority. Each phase should be completed and tested before moving to the next.

---

## Phase 1 — Critical Fixes (Do First)

These vulnerabilities allow account takeover or unrestricted abuse. Must be fixed before any production traffic.

---

### Fix 1.1: Remove Password Auto-Overwrite in Desktop-Code Endpoint

**Fixes:** V-01 (CRITICAL)  
**File:** `server/src/routes/auth.js`  
**Type:** Backend-only  
**Risk of Regression:** Low — only affects desktop-code flow where password mismatch was silently accepted

**What to change:**

In the `POST /api/auth/desktop-code` handler (~line 119–126), replace the auto-update block:

```js
// ❌ REMOVE THIS:
const valid = await verifyPassword(password, user.password_hash);
if (!valid) {
  // Password changed on website side? Re-hash and update.
  const passwordHash = await hashPassword(password);
  db.prepare('UPDATE users SET password_hash = ?, updated_at = datetime(\'now\') WHERE id = ?')
    .run(passwordHash, user.id);
}

// ✅ REPLACE WITH:
const valid = await verifyPassword(password, user.password_hash);
if (!valid) {
  return res.status(401).json({ error: 'Invalid email or password' });
}
```

**Why it works:** Wrong password now returns 401 instead of silently overwriting the stored hash.

**Test:**
- [ ] `POST /api/auth/desktop-code` with correct email + wrong password → returns 401
- [ ] `POST /api/auth/desktop-code` with correct email + correct password → returns auth code
- [ ] Existing user's password remains unchanged after a failed attempt

---

### Fix 1.2: Fix `cancel-xendit-payment` IDOR (Use Trusted Header)

**Fixes:** V-03 (CRITICAL)  
**Files:** `functions/cancel-xendit-payment/src/main.js`, `appwrite/functions/cancel-xendit-payment/src/main.js`, `src/app/lib/subscription.service.ts`  
**Type:** Backend + Frontend

**What to change (backend — both copies):**

In `functions/cancel-xendit-payment/src/main.js` (~line 43–48):

```js
// ❌ REMOVE:
const body = JSON.parse(req.body || '{}');
const { paymentId, userId } = body;

if (!userId) {
  return res.json({ error: 'Authentication required' }, 401);
}

// ✅ REPLACE WITH:
const body = JSON.parse(req.body || '{}');
const { paymentId } = body;

const userId = req.headers['x-appwrite-user-id'];
if (!userId) {
  return res.json({ error: 'Authentication required' }, 401);
}
```

Apply the same change in `appwrite/functions/cancel-xendit-payment/src/main.js`.

**What to change (frontend):**

In `src/app/lib/subscription.service.ts`, function `cancelXenditPayment`:

```ts
// ❌ REMOVE:
export async function cancelXenditPayment(paymentId: string): Promise<any> {
  const user = await account.get();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const execution = await functions.createExecution(
    FUNCTION_IDS.CANCEL_XENDIT_PAYMENT,
    JSON.stringify({ paymentId, userId: user.$id }),
    false,
    undefined,
    ExecutionMethod.POST,
  );

// ✅ REPLACE WITH:
export async function cancelXenditPayment(paymentId: string): Promise<any> {
  const execution = await functions.createExecution(
    FUNCTION_IDS.CANCEL_XENDIT_PAYMENT,
    JSON.stringify({ paymentId }),
    false,
    undefined,
    ExecutionMethod.POST,
  );
```

Also remove the `import { account }` reference if it becomes unused (check other usages first).

**Why it works:** `x-appwrite-user-id` is injected by the Appwrite platform from the validated session and cannot be spoofed by the caller.

**Test:**
- [ ] Cancel own pending payment → succeeds
- [ ] Try to cancel another user's payment → returns 403 Forbidden
- [ ] Unauthenticated call → returns 401
- [ ] Deploy both copies via `appwrite push function`

---

### Fix 1.3: Add Rate Limiting to Express Server

**Fixes:** V-02 (CRITICAL)  
**Files:** `server/package.json`, `server/src/index.js`  
**Type:** Backend-only

**Step 1 — Install dependency:**

```bash
cd server
npm install express-rate-limit
```

**Step 2 — Add to `server/src/index.js`:**

After the existing imports, add:

```js
import rateLimit from 'express-rate-limit';

// Auth endpoints: 15 requests per 15-minute window
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts, please try again later' },
});

// Billing endpoints: 10 requests per 15-minute window
const billingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many checkout requests, please try again later' },
});

// General API: 100 requests per 15-minute window
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});
```

Apply limiters before route mounting:

```js
// ── Rate Limiting ──────────────────────────────────────────────────
app.use('/api/auth', authLimiter);
app.use('/api/billing', billingLimiter);
app.use('/api/', generalLimiter);

// ── Routes ─────────────────────────────────────────────────────────
app.use('/api/auth',    authRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/xendit',  webhookRoutes);
app.use('/api/account', accountRoutes);
```

**Why it works:** IP-based rate limiting prevents brute force, credential stuffing, and resource exhaustion attacks.

**Test:**
- [ ] Send 16 rapid requests to `POST /api/auth/signin` → 16th returns 429
- [ ] Send 11 rapid requests to `POST /api/billing/create-checkout` → 11th returns 429
- [ ] Normal usage within limits works fine
- [ ] Rate limit headers present in responses (`RateLimit-*`)

---

## Phase 2 — High Priority Fixes

These prevent account takeover via open redirect and harden auth infrastructure.

---

### Fix 2.1: Validate Desktop Auth `redirect` URL (Prevent Open Redirect)

**Fixes:** V-04 (HIGH)  
**Files:** `src/app/pages/SignIn.tsx`, `src/app/pages/SignUp.tsx`  
**Type:** Frontend-only

**Step 1 — Create shared validation utility:**

Create `src/app/lib/redirect-validator.ts`:

```ts
/**
 * Validate that a desktop auth redirect URL is safe.
 * Only allows known desktop app callback schemes and localhost.
 */
const ALLOWED_PATTERNS = [
  /^photobooth:\/\//i,              // Custom protocol for desktop app
  /^http:\/\/localhost(:\d+)?\//,    // Localhost with path
  /^http:\/\/127\.0\.0\.1(:\d+)?\//  // Loopback with path
];

export function isValidDesktopRedirect(url: string): boolean {
  return ALLOWED_PATTERNS.some(pattern => pattern.test(url));
}
```

**Step 2 — Apply in `SignIn.tsx`:**

Add import at the top:
```tsx
import { isValidDesktopRedirect } from '../lib/redirect-validator';
```

Change the `isDesktop` computation:
```tsx
const isDesktop = source === 'desktop' && !!redirect && isValidDesktopRedirect(redirect);
```

**Step 3 — Apply in `SignUp.tsx`:**

Same import and same `isDesktop` validation.

**Why it works:** Only known-safe protocols/origins (custom scheme, localhost) pass validation. External URLs like `https://evil.com` are rejected before any code is generated.

**Test:**
- [ ] `?source=desktop&redirect=photobooth://callback` → works normally
- [ ] `?source=desktop&redirect=http://localhost:3000/callback` → works
- [ ] `?source=desktop&redirect=https://evil.com/steal` → `isDesktop` is false, no redirect
- [ ] `?source=desktop&redirect=javascript:alert(1)` → rejected
- [ ] Normal (non-desktop) sign-in flow unaffected

---

### Fix 2.2: Remove Hardcoded JWT Secret Fallback

**Fixes:** V-05 (HIGH)  
**File:** `server/src/middleware/auth.js`  
**Type:** Backend-only

**What to change:**

```js
// ❌ REMOVE:
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

// ✅ REPLACE WITH:
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is required. Set it in server/.env');
}
```

**Why it works:** Server refuses to start with a missing/default secret, preventing production deployment with weak auth.

**Test:**
- [ ] Start server without `JWT_SECRET` in `.env` → crashes with clear error message
- [ ] Start server with `JWT_SECRET` set → starts normally
- [ ] Existing auth flow works unchanged

---

### Fix 2.3: Change `check-user-subscription-access` Execute to `users`

**Fixes:** V-09 (MEDIUM — bundled here for convenience since it's config-only)  
**File:** `appwrite.config.json`  
**Type:** Config-only (deploy via `appwrite push function`)

**What to change:**

```json
// ❌ BEFORE:
{
  "$id": "check-user-subscription-access",
  "execute": ["any"]
}

// ✅ AFTER:
{
  "$id": "check-user-subscription-access",
  "execute": ["users"]
}
```

**Why it works:** Appwrite rejects unauthenticated calls at the platform level, before the function runs.

**Test:**
- [ ] Authenticated user checks subscription access → works
- [ ] Unauthenticated call → rejected by Appwrite (no function execution)

---

## Phase 3 — Medium Priority Fixes

These improve input validation and reliability.

---

### Fix 3.1: Fix Express Webhook Error Response

**Fixes:** V-08 (MEDIUM)  
**File:** `server/src/routes/webhook.js`  
**Type:** Backend-only

**What to change:**

In the catch block of `POST /api/xendit/webhook`:

```js
// ❌ REMOVE:
return res.status(200).json({ received: true, error: 'internal' });

// ✅ REPLACE WITH:
return res.status(500).json({ error: 'internal_error' });
```

**Why it works:** Xendit retries webhooks that return non-2xx. Transient errors (DB lock, network blip) will be retried automatically.

**Test:**
- [ ] Simulate a DB error during webhook processing → returns 500
- [ ] Normal webhook flow → still returns 200

---

### Fix 3.2: Add Type Validation to All User-Supplied IDs

**Fixes:** V-10 (MEDIUM)  
**Files:** `functions/create-xendit-subscription/src/main.js`, `functions/renew-xendit-subscription/src/main.js`, `functions/cancel-xendit-payment/src/main.js`, `functions/cancel-xendit-subscription/src/main.js`, `server/src/routes/billing.js` (+ appwrite/ copies)  
**Type:** Backend-only

**Pattern to apply in each function after parsing the body:**

For `planId`:
```js
if (!planId || typeof planId !== 'string') {
  return res.json({ error: 'Invalid plan selected' }, 400);
}
```

For `paymentId`:
```js
if (!paymentId || typeof paymentId !== 'string') {
  return res.json({ error: 'paymentId must be a valid string' }, 400);
}
```

For `subscriptionDocId`:
```js
if (!subscriptionDocId || typeof subscriptionDocId !== 'string') {
  return res.json({ error: 'subscriptionDocId must be a valid string' }, 400);
}
```

For Express billing route:
```js
if (!planId || typeof planId !== 'string') {
  return res.status(400).json({ error: 'Invalid plan selected' });
}
```

**Test:**
- [ ] Send `{ planId: 123 }` → 400 error
- [ ] Send `{ planId: { "$ne": "" } }` → 400 error
- [ ] Send `{ planId: "monthly" }` → works normally

---

### Fix 3.3: Add Input Validation to Express Signup/Signin

**Fixes:** V-11 (MEDIUM)  
**File:** `server/src/routes/auth.js`  
**Type:** Backend-only

**What to change in `POST /api/auth/signup`:**

After `const { email, password, name } = req.body;`, add:

```js
if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
  return res.status(400).json({ error: 'Email and password are required' });
}
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
  return res.status(400).json({ error: 'Invalid email format' });
}
if (password.length < 8) {
  return res.status(400).json({ error: 'Password must be at least 8 characters' });
}
if (name !== undefined && (typeof name !== 'string' || name.length > 200)) {
  return res.status(400).json({ error: 'Invalid name' });
}
```

**What to change in `POST /api/auth/signin`:**

After `const { email, password } = req.body;`, add:

```js
if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
  return res.status(400).json({ error: 'Email and password are required' });
}
```

**What to change in `POST /api/auth/desktop-code`:**

Same pattern — add type checks after destructuring.

**Test:**
- [ ] Signup with 3-char password → 400
- [ ] Signup with valid data → works
- [ ] Signup with malformed email (no @) → 400
- [ ] Signin with non-string inputs → 400

---

## Phase 4 — Low Priority Fixes

Hardening and best practices. Lower risk but recommended.

---

### Fix 4.1: Restrict CORS Localhost to Development Only

**Fixes:** V-12 (LOW)  
**File:** `server/src/index.js`  
**Type:** Backend-only

**What to change:**

```js
// ❌ BEFORE:
const corsOrigin = (origin, callback) => {
  if (!origin || /^https?:\/\/localhost(:\d+)?$/.test(origin)) {
    callback(null, true);
  } else if (origin === FRONTEND_URL) {
    callback(null, true);
  } else {
    callback(new Error('Not allowed by CORS'));
  }
};

// ✅ AFTER:
const corsOrigin = (origin, callback) => {
  if (!origin) return callback(null, true);
  if (origin === FRONTEND_URL) return callback(null, true);
  if (process.env.NODE_ENV !== 'production' && /^https?:\/\/localhost(:\d+)?$/.test(origin)) {
    return callback(null, true);
  }
  callback(new Error('Not allowed by CORS'));
};
```

**Test:**
- [ ] In development: localhost origins accepted
- [ ] In production (NODE_ENV=production): only FRONTEND_URL accepted

---

### Fix 4.2: Change `sync-xendit-payment-history` Execute to Admin-Only

**Fixes:** V-14 (LOW)  
**File:** `appwrite.config.json`  
**Type:** Config-only

**What to change:**

```json
// ❌ BEFORE:
{
  "$id": "sync-xendit-payment-history",
  "execute": ["users"]
}

// ✅ AFTER:
{
  "$id": "sync-xendit-payment-history",
  "execute": []
}
```

**Why:** This function is CRON-triggered only. No user should be able to invoke it manually.

---

### Fix 4.3: Tighten Appwrite Auth Security Settings

**Fixes:** V-13 (LOW)  
**Where:** Appwrite Console → Settings → Auth Security (or `appwrite.config.json`)  
**Type:** Config-only

**Recommended changes:**

```json
"security": {
    "duration": 2592000,          // 30-day sessions (was 1 year)
    "limit": 10,                  // Lock out after 10 failed attempts (was 0)
    "sessionsLimit": 10,          // Unchanged
    "passwordHistory": 3,         // Prevent reusing last 3 passwords
    "passwordDictionary": true,   // Block common weak passwords
    "personalDataCheck": true     // Prevent password = email
}
```

---

## Deployment Order

```
Phase 1 (Critical)
  ├── 1.1  Fix desktop-code password overwrite     → redeploy server
  ├── 1.2  Fix cancel-xendit-payment IDOR          → redeploy function + frontend
  └── 1.3  Add rate limiting                        → install dep + redeploy server

Phase 2 (High)
  ├── 2.1  Validate redirect URL                    → redeploy frontend
  ├── 2.2  Remove JWT secret fallback               → redeploy server
  └── 2.3  Change subscription-access execute       → appwrite push

Phase 3 (Medium)
  ├── 3.1  Fix webhook error response              → redeploy server
  ├── 3.2  Add ID type validation                  → redeploy functions
  └── 3.3  Add signup/signin validation            → redeploy server

Phase 4 (Low)
  ├── 4.1  Restrict CORS                           → redeploy server
  ├── 4.2  Change sync execute permission          → appwrite push
  └── 4.3  Tighten Appwrite auth settings          → Appwrite Console
```

---

## Post-Implementation Checklist

After all fixes are applied:

- [ ] `cancel-xendit-payment` uses `req.headers['x-appwrite-user-id']` — verified
- [ ] Frontend `cancelXenditPayment()` does not send `userId` in body
- [ ] `POST /api/auth/desktop-code` returns 401 on wrong password
- [ ] Rate limiting active on `/api/auth/*`, `/api/billing/*`, `/api/*`
- [ ] `redirect` parameter validated in `SignIn.tsx` and `SignUp.tsx`
- [ ] Server crashes on startup if `JWT_SECRET` is unset
- [ ] `check-user-subscription-access` execute = `["users"]`
- [ ] `sync-xendit-payment-history` execute = `[]`
- [ ] Express webhook returns 500 on errors
- [ ] `planId`, `paymentId`, `subscriptionDocId` have string type checks
- [ ] Signup validates email format and password length
- [ ] Localhost CORS restricted to non-production
- [ ] Appwrite auth settings tightened
- [ ] All Appwrite functions redeployed via `appwrite push function`
- [ ] Frontend rebuilt and deployed
- [ ] Express server redeployed
- [ ] No new errors in Appwrite function execution logs
- [ ] No new errors in Express server logs
- [ ] All existing tests still pass (signup, signin, checkout, cancel, webhook)
