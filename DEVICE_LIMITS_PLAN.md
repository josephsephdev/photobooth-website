# Plan: Device Limits + Billing Config Page

## Overview

Add configurable device limits (min 2, max 10 per subscription), a new `/billing/configure` page before Xendit checkout, and a device manager card in the Account dashboard. The desktop app registers its device on login and enforces the limit.

**Pricing formula:**

```
periodPrice  = plan.price × durationUnits
extraDevices = max(0, deviceLimit − 2)
deviceAddOn  = Math.round(periodPrice × extraDevices × 0.20)
total        = periodPrice + deviceAddOn
```

> All prices in centavos (÷100 for display / Xendit API).

---

## Phase 1 — Appwrite Console (manual — blocks everything else)

- [x] **1.1** `subscriptions` collection → add `deviceLimit` (integer, min 2, default 2, required)
- [x] **1.2** `payments` collection → add `durationUnits` (integer, optional), `durationDays` (integer, optional), `deviceLimit` (integer, optional, default 2)
- [x] **1.3** Create `devices` collection with attributes:
  | Attribute | Type | Size | Required |
  |-----------|------|------|----------|
  | `userId` | string | 36 | yes |
  | `deviceId` | string | 64 | yes |
  | `deviceName` | string | 100 | yes |
  | `platform` | string | 20 | no |
  | `lastActive` | datetime | — | no |
  | `createdAt` | datetime | — | yes |

  Each doc created with `Permission.read(Role.user(userId))` + `Permission.delete(Role.user(userId))`.

---

## Phase 2 — New Appwrite Function: `manage-device`

- [x] **2.1** Create `functions/manage-device/package.json` (model after `cancel-xendit-payment`)
- [x] **2.2** Create `functions/manage-device/src/main.js`
  - Auth: `x-appwrite-user-id` header required (401 if missing)
  - **`register` action**: check subscription `deviceLimit` → count current devices → 429 if at limit (returns device list) → upsert `lastActive` if already registered → else create new doc
  - **`remove` action**: query by `userId + deviceId` → delete → 200
- [x] **2.3** Add to `appwrite.config.json`:
  ```json
  {
    "$id": "manage-device",
    "name": "manage-device",
    "runtime": "node-22",
    "path": "functions/manage-device",
    "entrypoint": "src/main.js",
    "execute": ["users"],
    "enabled": true,
    "logging": true,
    "events": [],
    "schedule": "",
    "timeout": 15,
    "commands": "npm install",
    "scopes": ["documents.read", "documents.write"],
    "specification": "s-0.5vcpu-512mb"
  }
  ```

---

## Phase 3 — Update Existing Appwrite Functions

- [x] **3.1** `functions/create-xendit-subscription/src/main.js`
  - Parse `durationUnits` (default 1) and `deviceLimit` (default 2, min 2) from body
  - Calculate dynamic price using formula above
  - Store `durationUnits`, `durationDays` (= `plan.durationDays × durationUnits`), `deviceLimit` on the payment doc
  - Update Xendit invoice description to show duration + device count

- [x] **3.2** `functions/xendit-webhook-handler/src/main.js` → inside `activateSubscription`
  - Read `paymentDoc.durationDays` (fallback: `PLANS[planId].durationDays`)
  - Read `paymentDoc.deviceLimit` (fallback: `2`)
  - Use `durationDays` for `expiresAt` / `nextBillingDate` calculation
  - Store `deviceLimit` on the subscription doc

---

## Phase 4 — Frontend Services & Constants

- [x] **4.1** `src/app/lib/database.constants.ts` — add:
  - `DEVICES: 'devices'` to `COLLECTION`
  - New field constants: `DEVICE_LIMIT`, `DURATION_UNITS`, `DURATION_DAYS`, `DEVICE_ID`, `DEVICE_NAME`, `PLATFORM`, `LAST_ACTIVE`

- [x] **4.2** `src/app/lib/subscription.service.ts` — update signature:
  ```ts
  createXenditCheckout(planId: string, durationUnits = 1, deviceLimit = 2)
  ```
  Payload: `JSON.stringify({ planId, durationUnits, deviceLimit })`

- [x] **4.3** Create `src/app/lib/device.service.ts`
  - `getUserDevices(): Promise<DeviceDocument[]>`
  - `removeDevice(documentId: string): Promise<void>` (calls `manage-device` function)
  - Export `DeviceDocument` interface

---

## Phase 5 — BillingConfig Page + UI Wiring

- [x] **5.1** Create `src/app/pages/BillingConfig.tsx` at `/billing/configure?plan={planId}`
  - **Duration picker** (preset buttons per plan):
    - `event_pass`: 1, 2, 3, 5, 7 days
    - `monthly`: 1, 3, 6, 12 months
    - `yearly`: 1, 2, 3 years
  - **Device stepper**: min 2, max 10, +/− buttons
  - **Live price breakdown**:
    - Base (Plan × N units) → cost
    - Device add-on (+N devices × 20%) → add-on *(hidden when extraDevices = 0)*
    - **Total** → sum
  - **Proceed button** → `createXenditCheckout(planId, durationUnits, deviceLimit)` → redirect to Xendit

- [x] **5.2** `src/app/App.tsx` → add route:
  ```tsx
  <Route path="/billing/configure" element={<BillingConfig />} />
  ```

- [x] **5.3** `src/app/pages/Pricing.tsx` → update `handleSelectPlan`:
  - Replace checkout call with `navigate(`/billing/configure?plan=${planId}`)`
  - Remove `loadingPlan` state and `createXenditCheckout` import

- [x] **5.4** `src/app/pages/Account.tsx` → add Registered Devices card:
  - `devices` state + `removingDeviceId` state
  - Fetch devices in existing `useEffect`
  - New `DashboardCard` with `Monitor` icon
  - Each row: device name, platform badge, last active, Remove button

---

## Phase 6 — Desktop App (separate repo: `photobooth-app`)

- [x] **6.1** Create `photobooth-app/services/deviceService.js`
  - `getOrCreateDeviceId()` — persists UUID to `.device-id` file in `DATA_ROOT`
  - `registerDevice(appwriteSessionSecret)` — calls `manage-device` with session cookie auth
  - Returns `{ success, limitReached, devices }`

- [x] **6.2** `photobooth-app/routes/website-auth.js` → after `saveSession()`:
  - Call `deviceService.registerDevice(appwriteSessionSecret)`
  - Include `deviceLimitReached` + `registeredDevices` in JSON response

---

## Phase 7 — Deploy

- [ ] **7.1** `appwrite push function` for `manage-device`, `create-xendit-subscription`, `xendit-webhook-handler`
- [ ] **7.2** `npm run build` + push to GitHub Pages
- [ ] **7.3** Restart desktop app

---

## Files Summary

| File | Action |
|------|--------|
| `functions/manage-device/package.json` | CREATE |
| `functions/manage-device/src/main.js` | CREATE |
| `functions/create-xendit-subscription/src/main.js` | UPDATE |
| `functions/xendit-webhook-handler/src/main.js` | UPDATE |
| `appwrite.config.json` | UPDATE |
| `src/app/lib/database.constants.ts` | UPDATE |
| `src/app/lib/subscription.service.ts` | UPDATE |
| `src/app/lib/device.service.ts` | CREATE |
| `src/app/pages/BillingConfig.tsx` | CREATE |
| `src/app/App.tsx` | UPDATE |
| `src/app/pages/Pricing.tsx` | UPDATE |
| `src/app/pages/Account.tsx` | UPDATE |
| `photobooth-app/services/deviceService.js` | CREATE *(separate repo)* |
| `photobooth-app/routes/website-auth.js` | UPDATE *(separate repo)* |

---

## Decisions

- **MIN_DEVICES = 2**, **MAX_DEVICES = 10**, **ADD_ON_RATE = 20%** per extra device per period price
- `durationUnits` multiplies the base plan price — does NOT change the plan type
- Free accounts (no active subscription) are blocked from registering any device
- **Phase 1 must be done manually in Appwrite Console before deploying any code**
- Desktop changes live in a separate repo (`photobooth-app`)
