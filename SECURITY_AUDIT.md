# 🔒 Security Audit — Vulnerability Tracker

**Audit Date:** March 9, 2026  
**Auditor:** GitHub Copilot  
**Scope:** Full codebase — Appwrite functions, Express server, React frontend, configuration  
**Status:** ✅ Complete (except V-13 manual console change)

---

## Summary

| Severity | Count | Fixed |
|----------|-------|-------|
| Critical | 3     | 3     |
| High     | 4     | 2 + 2 accepted risk |
| Medium   | 4     | 4     |
| Low      | 3     | 2 + 1 manual |
| **Total**| **14**| **11 fixed, 2 accepted, 1 manual** |

---

## Critical Findings

### V-01: Desktop-Code Endpoint Silently Overwrites Any User's Password

| Field | Detail |
|-------|--------|
| **Severity** | 🔴 CRITICAL |
| **Status** | ✅ Fixed |
| **Category** | No Auth on Private Endpoint |
| **Affected File** | `server/src/routes/auth.js` — `POST /api/auth/desktop-code` |
| **OWASP** | A01:2021 — Broken Access Control |

**Description:**  
The `POST /api/auth/desktop-code` endpoint accepts `email` + `password`. If the password does not match the stored hash, the endpoint **silently re-hashes the provided password and overwrites the stored one**:

```js
const valid = await verifyPassword(password, user.password_hash);
if (!valid) {
  // Password changed on website side? Re-hash and update.
  const passwordHash = await hashPassword(password);
  db.prepare('UPDATE users SET password_hash = ? ... WHERE id = ?')
    .run(passwordHash, user.id);
}
```

**Exploit Scenario:**  
1. Attacker sends `POST /api/auth/desktop-code` with `{ email: "victim@example.com", password: "attacker-chosen" }`
2. The endpoint looks up the victim's account by email, finds a mismatch, and **overwrites the password**
3. Attacker now signs in as the victim with their chosen password

**Impact:** Complete account takeover on the Express/SQLite backend. Any user's password can be changed by anyone who knows their email.

**Fix:** Return 401 on wrong password instead of updating it.

---

### V-02: No Rate Limiting on Any Express Server Endpoint

| Field | Detail |
|-------|--------|
| **Severity** | 🔴 CRITICAL |
| **Status** | ✅ Fixed |
| **Category** | No Rate Limiting |
| **Affected Files** | `server/src/index.js`, `server/src/routes/auth.js`, `server/src/routes/billing.js` |
| **OWASP** | A07:2021 — Identification and Authentication Failures |

**Description:**  
Zero rate limiting exists anywhere in the Express server. No `express-rate-limit` dependency or any throttling middleware is present.

**Abusable Endpoints:**

| Endpoint | Abuse Scenario | Impact |
|----------|---------------|--------|
| `POST /api/auth/signin` | Brute force password guessing | Account takeover |
| `POST /api/auth/signup` | Mass account creation (spam) | Resource exhaustion |
| `POST /api/auth/desktop-code` | Repeated auth code generation | DB flooding |
| `POST /api/auth/desktop-exchange` | Brute force code guessing | Token theft |
| `POST /api/billing/create-checkout` | Spam Xendit invoice creation | Financial cost, Xendit suspension |
| `POST /api/xendit/webhook` | Synthetic webhook flood | DB churn |

**Fix:** Install `express-rate-limit` and apply tiered limiters per route group.

---

### V-03: `cancel-xendit-payment` Trusts `userId` from Request Body (IDOR)

| Field | Detail |
|-------|--------|
| **Severity** | 🔴 CRITICAL |
| **Status** | ✅ Fixed |
| **Category** | No Auth / Trust Boundary Break |
| **Affected Files** | `functions/cancel-xendit-payment/src/main.js`, `src/app/lib/subscription.service.ts` |
| **OWASP** | A01:2021 — Broken Access Control |

**Description:**  
The function reads `userId` from `req.body` (untrusted client input) instead of the Appwrite-injected `req.headers['x-appwrite-user-id']` (trusted). The ownership check then compares `paymentDoc.userId !== body.userId`, which means an attacker can supply the victim's userId to pass the check.

```js
const body = JSON.parse(req.body || '{}');
const { paymentId, userId } = body;  // ← UNTRUSTED
```

The function's execute permission is `["users"]`, so any authenticated user can call it.

**Exploit Scenario:**  
Attacker sends `{ paymentId: "victim_payment_id", userId: "victim_user_id" }`. The ownership check passes because both sides equal the victim's userId. The attacker cancels someone else's payment.

**Fix:** Read `userId` from `req.headers['x-appwrite-user-id']` (cannot be spoofed by the caller). Remove `userId` from the frontend request body.

---

## High Findings

### V-04: Open Redirect via Desktop Auth `redirect` Parameter

| Field | Detail |
|-------|--------|
| **Severity** | 🟠 HIGH |
| **Status** | ✅ Fixed |
| **Category** | Input Validation / Auth Bypass |
| **Affected Files** | `src/app/pages/SignIn.tsx`, `src/app/pages/SignUp.tsx` |
| **OWASP** | A01:2021 — Broken Access Control |

**Description:**  
The desktop auth flow reads the `redirect` URL from query parameters and performs `window.location.href = redirect + ?code=...` without validation:

```tsx
window.location.href = `${redirect}?code=${encodeURIComponent(code)}`;
```

**Exploit Scenario:**  
Attacker crafts: `https://luiscophotobooth.app/#/signin?source=desktop&redirect=https://evil.com/steal`

If the user is logged in, a valid one-time auth code is generated and the user is redirected to the attacker's server with the code. The attacker exchanges it for a session token.

**Impact:** Complete account takeover — attacker obtains a valid session token for the victim.

**Fix:** Validate `redirect` against an allowlist of known desktop app callback schemes/origins (e.g., `photobooth://`, `http://localhost:*`, `http://127.0.0.1:*`).

---

### V-05: Hardcoded JWT Secret Fallback

| Field | Detail |
|-------|--------|
| **Severity** | 🟠 HIGH |
| **Status** | ✅ Fixed |
| **Category** | API Key / Secret Exposure |
| **Affected File** | `server/src/middleware/auth.js` |
| **OWASP** | A02:2021 — Cryptographic Failures |

**Description:**  

```js
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
```

If `JWT_SECRET` is not set (misconfiguration, deployment error), the server uses a hardcoded fallback visible in the source code. Anyone who reads the code can forge valid JWTs.

**Impact:** Complete auth bypass — attacker forges JWTs for any user ID.

**Fix:** Crash on startup if `JWT_SECRET` is not set or equals the default value.

---

### V-06: `xendit-webhook-handler` Execute Permission Set to `any`

| Field | Detail |
|-------|--------|
| **Severity** | 🟠 HIGH |
| **Status** | 🟡 Accepted Risk |
| **Category** | No Auth on Endpoint |
| **Affected Files** | `appwrite.config.json`, `functions/xendit-webhook-handler/src/main.js` |
| **OWASP** | A01:2021 — Broken Access Control |

**Description:**  
`execute: ["any"]` means any unauthenticated caller can invoke the function via the Appwrite Functions API. The function verifies `x-callback-token` (static shared secret) — if this token leaks, anyone can forge webhooks.

**Mitigating Factor:** Xendit must call this without Appwrite auth, so `any` is partially expected. The callback token provides a layer of verification.

**Recommended Mitigations:**
- Keep callback token strong and rotated
- Add secondary verification (call Xendit GET invoice API to confirm status server-side)
- Monitor execution logs for anomalous patterns

---

### V-07: `desktop-auth-handoff` `exchange-code` Callable by `any`

| Field | Detail |
|-------|--------|
| **Severity** | 🟠 HIGH |
| **Status** | 🟡 Accepted Risk |
| **Category** | No Auth on Endpoint |
| **Affected Files** | `appwrite.config.json`, `functions/desktop-auth-handoff/src/main.js` |
| **OWASP** | A07:2021 — Identification and Authentication Failures |

**Description:**  
The `exchange-code` action is intentionally callable without authentication (the desktop app doesn't have a session yet). Combined with `execute: ["any"]`, anyone can call it from a browser or script.

**Mitigating Factors:**
- Code is 48 chars from 64-char alphabet (~2^288 combinations) — brute force infeasible
- 2-minute TTL + one-time use limits attack window
- No lockout on failed attempts (but entropy makes this acceptable)

**Recommendation:** Accept risk given high entropy, but add monitoring for unusual exchange-code call volumes.

---

## Medium Findings

### V-08: Express Webhook Returns 200 on Internal Errors

| Field | Detail |
|-------|--------|
| **Severity** | 🟡 MEDIUM |
| **Status** | ✅ Fixed |
| **Category** | Reliability / Data Integrity |
| **Affected File** | `server/src/routes/webhook.js` |

**Description:**  

```js
catch (err) {
    return res.status(200).json({ received: true, error: 'internal' });
}
```

Returning 200 on errors prevents Xendit from retrying. Legitimate payments may never be processed if a transient DB error occurs.

**Fix:** Return 500 so Xendit retries (matching the Appwrite function version).

---

### V-09: `check-user-subscription-access` Execute Permission `any`

| Field | Detail |
|-------|--------|
| **Severity** | 🟡 MEDIUM |
| **Status** | ✅ Fixed |
| **Category** | Over-permissive Access |
| **Affected File** | `appwrite.config.json` |

**Description:**  
The function checks `x-appwrite-user-id` and returns 401 if missing, but `execute: ["any"]` lets unauthenticated callers trigger execution (wasting compute). An attacker could spam this.

**Fix:** Change `execute` from `["any"]` to `["users"]`.

---

### V-10: No Type Validation on `planId`, `paymentId`, `subscriptionDocId`

| Field | Detail |
|-------|--------|
| **Severity** | 🟡 MEDIUM |
| **Status** | ✅ Fixed |
| **Category** | Input Validation |
| **Affected Files** | `functions/create-xendit-subscription/src/main.js`, `functions/renew-xendit-subscription/src/main.js`, `functions/cancel-xendit-payment/src/main.js`, `functions/cancel-xendit-subscription/src/main.js`, `server/src/routes/billing.js` |

**Description:**  
User-supplied `planId`, `paymentId`, and `subscriptionDocId` are used without confirming they are strings. Passing objects/arrays could cause unexpected behavior in Appwrite queries or Xendit API calls.

**Fix:** Add `typeof x !== 'string'` checks before usage.

---

### V-11: Minimal Input Validation on Express Signup/Signin

| Field | Detail |
|-------|--------|
| **Severity** | 🟡 MEDIUM |
| **Status** | ✅ Fixed |
| **Category** | Input Validation |
| **Affected File** | `server/src/routes/auth.js` |

**Description:**  
- No email format validation (arbitrary strings stored as email)
- No password minimum length enforcement (1-char passwords accepted)
- No name length limit or type check
- No email length limit

**Fix:** Validate email format, enforce min 8-char password, add type checks and length limits.

---

## Low Findings

### V-12: CORS Allows Localhost in Production

| Field | Detail |
|-------|--------|
| **Severity** | 🟢 LOW |
| **Status** | ✅ Fixed |
| **Category** | Over-permissive CORS |
| **Affected File** | `server/src/index.js` |

**Description:**  
The CORS origin function allows any `http://localhost:*` origin regardless of `NODE_ENV`. In production, this is unnecessary and could be exploited if an attacker can run code on the same host.

**Fix:** Gate localhost allowance on `process.env.NODE_ENV !== 'production'`.

---

### V-13: Permissive Appwrite Auth Security Settings

| Field | Detail |
|-------|--------|
| **Severity** | 🟢 LOW |
| **Status** | 🟡 Manual — Apply in Appwrite Console |
| **Category** | Configuration |
| **Affected File** | `appwrite.config.json` |

**Description:**
- `limit: 0` — No failed login attempt lockout
- `passwordDictionary: false` — Weak passwords allowed
- `duration: 31536000` — 1-year sessions
- `passwordHistory: 0` — No reuse prevention

**Recommendation:** Enable dictionary check, set login attempt limit to 10, reduce session duration.

---

### V-14: `sync-xendit-payment-history` Callable by Any Authenticated User

| Field | Detail |
|-------|--------|
| **Severity** | 🟢 LOW |
| **Status** | ✅ Fixed |
| **Category** | Over-permissive Access |
| **Affected File** | `appwrite.config.json` |

**Description:**  
`execute: ["users"]` allows any logged-in user to manually trigger the expensive Xendit sync (fetches 50 invoices, iterates DB). Intended to run only on CRON schedule.

**Fix:** Change `execute` to `[]` (empty — CRON/admin only).

---

## Change Log

| Date | Finding | Action | By |
|------|---------|--------|----|
| 2026-03-09 | All | Initial audit completed | Copilot |

---

## Notes

- **Appwrite Functions rate limiting:** Appwrite Cloud has platform-level rate limits per project, but no per-function custom throttling. This is an accepted platform limitation.
- **Frontend-only restrictions are NOT security:** All server-side endpoints must independently enforce auth, validation, and rate limiting.
- **`.env` files are properly git-ignored:** Confirmed no secret leaks in tracked files. `server/.env` contains real Xendit development key but is excluded by `.gitignore`.
- **Appwrite project ID in config:** This is public information required by the Web SDK. Not a security concern.
