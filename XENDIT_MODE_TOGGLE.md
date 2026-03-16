# Xendit Mode Toggle Guide

## Quick Reference

**Your Test Mode Key:**
```
API KEY: xnd_development_nvOb3Cbyg7lt60XRUmqQs5zcKgoCpNRoWH59EQN6gSgN2VWnl4WyOiwm4LDSuiM
WEBHOOK TOKEN: KoqQVhwe3lCPfWr5EusPLJVN5YCj85ypAmkisgiVV8C8yGbs
```

## Method 1: Switch via Appwrite Console (Easiest for occasional changes)

1. Go to **Appwrite Console** → **Functions**
2. For each function below, update the `XENDIT_SECRET_KEY`:
   - `create-xendit-subscription`
   - `cancel-xendit-payment`
   - `cancel-xendit-subscription`
   - `renew-xendit-subscription`
   - `sync-xendit-payment-history`

3. In each function's **Settings → Variables** tab:
   - Change `XENDIT_SECRET_KEY` to your test or live key
   - Also update `XENDIT_WEBHOOK_VERIFICATION_TOKEN` if provided

4. Save and the functions will reload

## Method 2: Use Configuration File (Recommended for frequent toggling)

A centralized config file is already created at:
```
appwrite/functions/xendit-config.js
```

**To use this approach in your functions:**

1. Update the config file to toggle the MODE:
   ```javascript
   const MODE = 'test'; // Change to 'live' when ready
   ```

2. In each Appwrite Function, replace:
   ```javascript
   const XENDIT_SECRET = process.env.XENDIT_SECRET_KEY;
   ```
   
   With:
   ```javascript
   import { XENDIT_SECRET_KEY } from '../xendit-config.js';
   const XENDIT_SECRET = XENDIT_SECRET_KEY;
   ```

3. Deploy functions after changes

## Method 3: Use Environment Variables + Script (Most flexible)

Store both keys as Appwrite environment variables:
```
XENDIT_SECRET_KEY_TEST=xnd_development_nvOb3Cbyg7lt60XRUmqQs5zcKgoCpNRoWH59EQN6gSgN2VWnl4WyOiwm4LDSuiM
XENDIT_SECRET_KEY_LIVE=xnd_production_xxxxx (your production key)
XENDIT_MODE=test
```

Then in functions:
```javascript
const mode = process.env.XENDIT_MODE || 'test';
const XENDIT_SECRET = mode === 'test' 
  ? process.env.XENDIT_SECRET_KEY_TEST
  : process.env.XENDIT_SECRET_KEY_LIVE;
```

## Which Function Uses Xendit?

These functions call the Xendit API:
- ✅ `create-xendit-subscription` - Creates checkout
- ✅ `cancel-xendit-payment` - Cancels pending payment
- ✅ `cancel-xendit-subscription` - Cancels active subscription
- ✅ `renew-xendit-subscription` - Renews subscription
- ✅ `sync-xendit-payment-history` - Syncs payment data
- ✅ `xendit-webhook-handler` - Receives webhook callbacks

## Testing Your Change

1. After switching modes, go to `/pricing`
2. Select a plan
3. You should see the checkout page from **your selected mode** (test shows "TEST MODE" watermark)
4. Don't complete test payments with real cards!

## Webhook Token

When using **test mode**, also update:
- **Xendit Dashboard** → **Webhooks/Callbacks** → Set to:
  ```
  Token: KoqQVhwe3lCPfWr5EusPLJVN5YCj85ypAmkisgiVV8C8yGbs
  ```

This ensures the `xendit-webhook-handler` function can verify incoming webhook callbacks.

## Always Use Test First!

✅ **Test first** on your local machine or staging  
✅ **Test with fake payment details** (Xendit provides test card numbers)  
✅ **Never** activate live mode in development  
✅ Only switch to `live` when deploying to production
