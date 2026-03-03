# Appwrite + Xendit Integration — Setup Guide

This guide walks you through setting up Appwrite as the backend for PhotoBooth Pro, replacing the custom Express/SQLite server with Appwrite Auth, Database, and Functions.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  React + Vite (hosted on Vercel / Netlify / etc.)           │
│                                                              │
│  Uses: Appwrite Web SDK (public project ID + endpoint only)  │
│  Handles: UI, form validation, routing, session state        │
│  NEVER touches: API keys, Xendit secrets, admin DB writes    │
└──────────────────┬──────────────────────────────────────────┘
                   │ Appwrite Web SDK (session cookie)
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                      APPWRITE                                │
│                                                              │
│  Auth        → user signup, login, sessions, verification    │
│  Database    → profiles, subscriptions, payments             │
│  Functions   → secure server-side logic (Node.js)            │
│                                                              │
│  Functions use:                                               │
│    - APPWRITE_API_KEY (server-side only)                     │
│    - XENDIT_SECRET_KEY (server-side only)                    │
│    - XENDIT_WEBHOOK_VERIFICATION_TOKEN (server-side only)    │
└──────────────────┬──────────────────────────────────────────┘
                   │ Xendit REST API
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                       XENDIT                                 │
│                                                              │
│  Handles: checkout pages, payment processing, invoices       │
│  Sends:   webhook callbacks to Appwrite Function URL         │
│  Supports: bank transfers, e-wallets, cards, etc.            │
└─────────────────────────────────────────────────────────────┘
```

### What runs WHERE:

| Component | Runs In | Has Access To |
|-----------|---------|---------------|
| UI rendering, form validation, routing | Frontend | Public Appwrite config only |
| User signup/login/logout | Appwrite Auth (via Web SDK) | Session cookie |
| Read own profile/sub/payments | Appwrite Database (via Web SDK) | User's own docs |
| Create Xendit checkout | Appwrite Function | API key + Xendit secret |
| Process Xendit webhooks | Appwrite Function | API key + webhook token |
| Cancel/renew subscription | Appwrite Function | API key + Xendit secret |
| Check subscription access | Appwrite Function | API key |

### What should NEVER be trusted from the frontend:

- Subscription status claims (always verify server-side)
- Payment amounts or plan prices (backend is source of truth)
- Xendit API calls (only Appwrite Functions talk to Xendit)
- Admin-level database writes (only Functions with API keys)

---

## Phase 1 — Create Your Appwrite Project

### Step 1: Sign up / Log in

Go to [https://cloud.appwrite.io](https://cloud.appwrite.io) and create an account (or self-host Appwrite).

### Step 2: Create a new project

1. Click **"Create Project"**
2. Name it: `PhotoBooth Pro`
3. Note your **Project ID** (e.g., `64f1a2b3c4d5e6f7`)

### Step 3: Add a Web Platform

1. Go to **Project Settings → Platforms**
2. Click **"Add Platform" → Web**
3. Set:
   - **Name**: `PhotoBooth Web`
   - **Hostname** (for local dev): `localhost`
4. For production, add another Web platform with your production domain (e.g., `app.yoursite.com`)

### Step 4: Get your config values

- **Endpoint**: `https://cloud.appwrite.io/v1` (or your self-hosted URL)
- **Project ID**: shown in project settings

### Step 5: Update `.env`

Copy `.env.example` to `.env` and fill in:

```env
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your-actual-project-id
VITE_APPWRITE_DATABASE_ID=photobooth_db
VITE_APPWRITE_COLLECTION_PROFILES=profiles
VITE_APPWRITE_COLLECTION_SUBSCRIPTIONS=subscriptions
VITE_APPWRITE_COLLECTION_PAYMENTS=payments
VITE_APP_URL=http://localhost:5173
```

---

## Phase 2 — Create the Database

### Step 1: Create the Database

1. Go to **Appwrite Console → Databases**
2. Click **"Create Database"**
3. **Database ID**: `photobooth_db`
4. **Name**: `PhotoBooth DB`

### Step 2: Create the `profiles` Collection

1. Click **"Create Collection"**
2. **Collection ID**: `profiles`
3. **Name**: `Profiles`

**Attributes:**

| Attribute | Type | Size | Required | Default |
|-----------|------|------|----------|---------|
| `userId` | String | 36 | Yes | — |
| `fullName` | String | 128 | Yes | — |
| `email` | String | 320 | Yes | — |
| `role` | String | 20 | Yes | `user` |
| `createdAt` | String | 30 | Yes | — |
| `updatedAt` | String | 30 | Yes | — |

**Indexes:**

| Key | Type | Attributes |
|-----|------|------------|
| `idx_userId` | Key | `userId` (ASC) |
| `idx_email` | Key | `email` (ASC) |

**Permissions:**

- Under **Settings → Permissions**, add:
  - **Role: Users** → Read
  - **Role: Users** → Create
  - **Role: Users** → Update

> This allows any logged-in user to create/read/update. The service checks `userId` matches.
> For tighter security, use **Document Security** and set permissions per-document (see below).

**Document-level security (recommended):**

1. Enable **"Document Security"** in collection settings
2. When creating a profile document, the frontend code already sets Appwrite to scope access to the creating user

### Step 3: Create the `subscriptions` Collection

1. **Collection ID**: `subscriptions`
2. **Name**: `Subscriptions`

**Attributes:**

| Attribute | Type | Size | Required | Default |
|-----------|------|------|----------|---------|
| `userId` | String | 36 | Yes | — |
| `planId` | String | 50 | Yes | — |
| `planName` | String | 100 | Yes | — |
| `status` | String | 20 | Yes | — |
| `provider` | String | 20 | Yes | `xendit` |
| `providerSubscriptionId` | String | 255 | No | — |
| `startDate` | String | 30 | Yes | — |
| `nextBillingDate` | String | 30 | No | — |
| `expiresAt` | String | 30 | Yes | — |
| `canceledAt` | String | 30 | No | — |
| `updatedAt` | String | 30 | Yes | — |

**Indexes:**

| Key | Type | Attributes |
|-----|------|------------|
| `idx_userId` | Key | `userId` (ASC) |
| `idx_userId_status` | Key | `userId` (ASC), `status` (ASC) |
| `idx_expiresAt` | Key | `expiresAt` (DESC) |

**Permissions:**

- **Role: Users** → Read (users can read their own subscriptions)
- Server writes only (Appwrite Functions with API key create/update these)
- Enable **Document Security** if you want per-user read scoping

### Step 4: Create the `payments` Collection

1. **Collection ID**: `payments`
2. **Name**: `Payments`

**Attributes:**

| Attribute | Type | Size | Required | Default |
|-----------|------|------|----------|---------|
| `userId` | String | 36 | Yes | — |
| `subscriptionId` | String | 255 | No | — |
| `providerPaymentId` | String | 255 | Yes | — |
| `amount` | Integer | — | Yes | — |
| `currency` | String | 10 | Yes | `PHP` |
| `status` | String | 20 | Yes | `pending` |
| `method` | String | 50 | No | — |
| `paidAt` | String | 30 | No | — |
| `createdAt` | String | 30 | Yes | — |

**Indexes:**

| Key | Type | Attributes |
|-----|------|------------|
| `idx_userId` | Key | `userId` (ASC) |
| `idx_providerPaymentId` | Unique | `providerPaymentId` (ASC) |
| `idx_createdAt` | Key | `createdAt` (DESC) |

**Permissions:**

- **Role: Users** → Read
- Server writes only (Appwrite Functions)

---

## Phase 3 — Create an API Key

1. Go to **Appwrite Console → Project Settings → API Keys**
2. Click **"Create API Key"**
3. Name: `Server Functions Key`
4. Scopes: select at minimum:
   - `databases.read`
   - `databases.write`
   - `users.read`
5. Copy the key — you'll use it as `APPWRITE_API_KEY` in your functions

---

## Phase 4 — Deploy Appwrite Functions

Each function is in `appwrite/functions/`. You can deploy them via the Appwrite CLI or Console.

### Using Appwrite CLI:

```bash
# Install CLI
npm install -g appwrite-cli

# Login
appwrite login

# Deploy each function
cd appwrite/functions/create-xendit-subscription
appwrite functions create \
  --functionId "create-xendit-subscription" \
  --name "Create Xendit Subscription" \
  --runtime "node-18.0" \
  --entrypoint "src/main.js"
```

### Function Environment Variables

Set these in **Appwrite Console → Functions → [function] → Settings → Variables**:

| Variable | Value |
|----------|-------|
| `APPWRITE_ENDPOINT` | `https://cloud.appwrite.io/v1` |
| `APPWRITE_PROJECT_ID` | Your project ID |
| `APPWRITE_API_KEY` | The API key from Phase 3 |
| `XENDIT_SECRET_KEY` | Your Xendit secret key |
| `XENDIT_WEBHOOK_VERIFICATION_TOKEN` | From Xendit Dashboard → Webhook settings |
| `FRONTEND_URL` | `https://yourapp.com` (or `http://localhost:5173` for dev) |
| `DATABASE_ID` | `photobooth_db` |
| `COLLECTION_PAYMENTS` | `payments` |
| `COLLECTION_SUBSCRIPTIONS` | `subscriptions` |

### Function Execution Permissions

| Function | Who can execute |
|----------|-----------------|
| `create-xendit-subscription` | **Users** (authenticated) |
| `cancel-xendit-subscription` | **Users** (authenticated) |
| `renew-xendit-subscription` | **Users** (authenticated) |
| `check-user-subscription-access` | **Users** (authenticated) |
| `xendit-webhook-handler` | **Any** (Xendit sends unauthenticated POST) |
| `sync-xendit-payment-history` | **Admin only** or CRON schedule |

### Xendit Webhook URL

After deploying `xendit-webhook-handler`, get its execution URL from the Appwrite Console:

```
https://cloud.appwrite.io/v1/functions/xendit-webhook-handler/executions
```

Set this URL in **Xendit Dashboard → Settings → Callbacks/Webhooks → Invoice Callback URL**.

---

## Phase 5 — Configure Email Verification

1. Go to **Appwrite Console → Auth → Templates**
2. Customize the **Verification** email template
3. Make sure SMTP is configured (Appwrite Cloud handles this automatically)
4. The verification URL will be: `{YOUR_FRONTEND_URL}/verify-email`

---

## Phase 6 — Test Locally

### Frontend

```bash
cd photobooth-website
npm install
npm run dev
```

The frontend runs at `http://localhost:5173`.

### Test each feature:

1. **Sign Up**: Go to `/signup`, fill in name + email + password → should create Appwrite user + profile doc + send verification email
2. **Email Verification**: Check your email, click the link → lands on `/verify-email?userId=xxx&secret=yyy`
3. **Sign In**: Go to `/signin`, enter email + password → should create session and redirect to `/account`
4. **Account Dashboard**: `/account` should show your profile info, subscription status, and payment history
5. **Sign Out**: Click sign out → clears session and redirects to `/`
6. **Pricing**: Go to `/pricing`, select a plan → calls `create-xendit-subscription` function → redirects to Xendit checkout

### Test Xendit Webhooks locally:

Use [ngrok](https://ngrok.com/) or a similar tunnel to expose your Appwrite Function URL during development, or test directly on Appwrite Cloud.

---

## Files Created / Modified

### New Files

| File | Purpose |
|------|---------|
| `.env.example` | Environment variable template |
| `.env` | Your local environment variables |
| `src/app/lib/appwrite.ts` | Appwrite Web SDK client (public config only) |
| `src/app/lib/auth.service.ts` | Auth operations (signup, signin, signout, verification) |
| `src/app/lib/database.service.ts` | Database queries for profiles, subscriptions, payments |
| `src/app/lib/database.constants.ts` | Database/collection IDs and field name constants |
| `src/app/lib/subscription.service.ts` | Frontend → Appwrite Functions bridge for Xendit operations |
| `src/app/pages/VerifyEmail.tsx` | Email verification callback page |
| `src/app/pages/VerifyEmailSent.tsx` | "Check your email" page after signup |
| `appwrite/functions/create-xendit-subscription/` | Creates Xendit checkout invoice |
| `appwrite/functions/cancel-xendit-subscription/` | Cancels user subscription |
| `appwrite/functions/renew-xendit-subscription/` | Renews/reactivates subscription |
| `appwrite/functions/xendit-webhook-handler/` | Processes Xendit webhook events |
| `appwrite/functions/sync-xendit-payment-history/` | Periodic sync from Xendit |
| `appwrite/functions/check-user-subscription-access/` | Server-side subscription check |

### Modified Files

| File | Changes |
|------|---------|
| `src/app/context/AuthContext.tsx` | Replaced JWT/localStorage auth with Appwrite SDK |
| `src/app/pages/SignUp.tsx` | Added Full Name field, use Appwrite signup, redirect to verify page |
| `src/app/pages/SignIn.tsx` | Redirect to `/account` after login |
| `src/app/pages/Account.tsx` | Load data from Appwrite Database instead of Express API |
| `src/app/pages/Pricing.tsx` | Call Appwrite Function for checkout instead of Express API |
| `src/app/pages/CheckoutSuccess.tsx` | Poll Appwrite Database instead of Express API |
| `src/app/App.tsx` | Added `/verify-email` and `/verify-email-sent` routes |
| `package.json` | Added `appwrite` dependency |

### Files You Can Remove (optional, after full migration)

| File | Reason |
|------|--------|
| `src/app/lib/api.ts` | Old Express API client (replaced by Appwrite services) |
| `server/` (entire folder) | Old Express backend (replaced by Appwrite) |

---

## Implementation Order (Recommended)

1. ✅ Create Appwrite project + web platform
2. ✅ Fill in `.env` with project ID + endpoint
3. ✅ Create database + collections + attributes + indexes in Appwrite Console
4. ✅ Create API key in Appwrite Console
5. ✅ Test signup flow (creates user + profile doc)
6. ✅ Test email verification flow
7. ✅ Test signin / signout
8. ✅ Test account dashboard data loading
9. ✅ Deploy Appwrite Functions
10. ✅ Set function environment variables
11. ✅ Set Xendit webhook URL to point to `xendit-webhook-handler`
12. ✅ Test pricing → checkout → webhook → subscription activation flow
13. ✅ Test subscription access check from dashboard
14. ✅ Remove old Express server code (optional)
