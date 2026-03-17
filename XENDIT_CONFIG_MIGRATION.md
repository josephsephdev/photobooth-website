# Xendit Config File Migration (March 2026)

## What Changed

Your 6 Xendit functions now **import from the config file** with **automatic fallback to environment variables**.

This enables the `npm run xendit:toggle` system to work without manual Appwrite environment variable updates.

## How It Works

Each Xendit function now does:

```javascript
// Import Xendit credentials from config file, fallback to environment variables
let XENDIT_SECRET;
try {
  const config = await import('../xendit-config.js');
  XENDIT_SECRET = config.XENDIT_SECRET_KEY;
} catch (e) {
  log('Using environment variable for Xendit credentials');
  XENDIT_SECRET = process.env.XENDIT_SECRET_KEY;
}
```

**Priority:**
1. ✅ Try to import from `xendit-config.js` (config file)
2. 🔄 If that fails, fall back to `process.env.XENDIT_SECRET_KEY` (environment variable)
3. ❌ If both fail, function will error

## Updated Functions

All 6 Xendit functions have been updated:
1. `functions/create-xendit-subscription/src/main.js`
2. `functions/cancel-xendit-payment/src/main.js`
3. `functions/cancel-xendit-subscription/src/main.js`
4. `functions/renew-xendit-subscription/src/main.js`
5. `functions/sync-xendit-payment-history/src/main.js`
6. `functions/xendit-webhook-handler/src/main.js`

## Testing the Change

1. Run `npm run xendit:status` to check current mode
2. Run `npm run xendit:toggle` to switch modes
3. Deploy functions: `appwrite deploy function`
4. Test at `/pricing` to verify checkout works

## Emergency Rollback

If something breaks, you have **two safety mechanisms**:

### Option A: Use Environment Variables (Fastest)
The functions automatically fall back to `process.env.XENDIT_SECRET_KEY`, so:
1. Go to Appwrite Console → Functions
2. Manually set `XENDIT_SECRET_KEY` in each function's environment variables
3. Functions will use that instead of the config file
4. No code changes needed!

### Option B: Remove Config Import (Complete Rollback)
If you want to remove the config file import entirely:
1. Delete the try/catch import block from each function
2. Replace with: `const XENDIT_SECRET = process.env.XENDIT_SECRET_KEY;`
3. Re-deploy functions

## Why This Design

✅ **Enables toggle system** - One command switches all functions  
✅ **Safe fallback** - Works with environment variables if config import fails  
✅ **Easy to disable** - Just use env vars, no code needed  
✅ **No deployment required** - Changing mode doesn't require function redeploy

## Toggle System

Now you can easily switch between test/live modes:

```bash
npm run xendit:status      # Check current mode
npm run xendit:toggle      # Switch test ↔ live
npm run xendit:test        # Force test mode
npm run xendit:live        # Force live mode (CAREFUL!)
```

The toggle command updates `appwrite/functions/xendit-config.js` with the new MODE.

## Questions/Issues?

If functions still won't load the config file:
1. Make sure config file exists at: `appwrite/functions/xendit-config.js`
2. Check the logs: `appwrite functions get-logs --function-id=<function-id>`
3. Verify environment variables are set in Appwrite as fallback
4. See "Emergency Rollback" section above
