# Xendit Mode Toggling Guide (Updated)

## TL;DR — Quick Commands

### Windows (PowerShell)
```bash
# Check current mode
npm run xendit:status

# Toggle between test/live
npm run xendit:toggle

# Go to test mode
npm run xendit:test

# Go to live mode (⚠️ REAL MONEY)
npm run xendit:live
```

### Mac/Linux (Bash)
```bash
# Check current mode
./toggle-xendit-mode.sh

# Toggle between test/live
./toggle-xendit-mode.sh

# Go to test mode
./toggle-xendit-mode.sh test

# Go to live mode
./toggle-xendit-mode.sh live
```

## How It Works

Previously, you had to manually update Xendit credentials in the Appwrite Console for **6 different functions**. Now:

1. **One config file** (`appwrite/functions/xendit-config.js`) controls all functions
2. **One command** (`npm run xendit:toggle`) updates everything at once
3. **Automatic Appwrite updates** via scripts

## Credentials

### Test Mode (Safe for Development)
```
Secret Key: xnd_development_nvOb3Cbyg7lt60XRUmqQs5zcKgoCpNRoWH59EQN6gSgN2VWnl4WyOiwm4LDSuiM
Webhook: KoqQVhwe3lCPfWr5EusPLJVN5YCj85ypAmkisgiVV8C8yGbs
Test Card: 4111 1111 1111 1111
```

### Live Mode (Real Money ⚠️)
```
Secret Key: xnd_production_zOsu3KMkhbVKV3tYhsNbjWohDSR7UJlt7cU43qztjJQZwyqzyxzxlspgWne
Webhook: xwttqFPZuIA79uL2stbpig9ijRAcOiibLPxUZ3uErka1tWYD
```

## Step-by-Step Workflow

### 1. Check Current Mode
```bash
npm run xendit:status
```
Output:
```
🧪 Xendit is in TEST mode
Safe to test! Use test card: 4111 1111 1111 1111
```

### 2. Toggle or Switch Modes
```bash
# Option A: Toggle (test → live or live → test)
npm run xendit:toggle

# Option B: Go to specific mode
npm run xendit:test    # Always use test
npm run xendit:live    # Switch to live
```

### 3. Verify Changes
The script will:
- ✅ Update `appwrite/functions/xendit-config.js`
- ✅ Update all 6 Appwrite functions:
  - `create-xendit-subscription`
  - `cancel-xendit-payment`
  - `cancel-xendit-subscription`
  - `renew-xendit-subscription`
  - `sync-xendit-payment-history`
  - `xendit-webhook-handler`

### 4. Test Your Changes
```bash
# Start dev server
npm run dev

# Go to http://localhost:5173/pricing
```

## Function Files

These Appwrite functions use Xendit:

| Function | Purpose | Variables Updated |
|----------|---------|-------------------|
| `create-xendit-subscription` | Creates checkout session | `XENDIT_SECRET_KEY` |
| `cancel-xendit-payment` | Cancels pending payment | `XENDIT_SECRET_KEY` |
| `cancel-xendit-subscription` | Cancels active subscription | `XENDIT_SECRET_KEY` |
| `renew-xendit-subscription` | Renews subscription | `XENDIT_SECRET_KEY` |
| `sync-xendit-payment-history` | Syncs payment data | `XENDIT_SECRET_KEY` |
| `xendit-webhook-handler` | Handles Xendit webhooks | `XENDIT_SECRET_KEY`, `XENDIT_WEBHOOK_VERIFICATION_TOKEN` |

## Advanced: Manual Setup (If Scripts Don't Work)

If you need to manually update Appwrite:

1. Open [Appwrite Console](https://cloud.appwrite.io)
2. Go to **Functions**
3. For each function above:
   - Click the function
   - Go to **Settings → Variables**
   - Update `XENDIT_SECRET_KEY`:
     - Test: `xnd_development_nvOb3Cbyg7lt60XRUmqQs5zcKgoCpNRoWH59EQN6gSgN2VWnl4WyOiwm4LDSuiM`
     - Live: `xnd_production_zOsu3KMkhbVKV3tYhsNbjWohDSR7UJlt7cU43qztjJQZwyqzyxzxlspgWne`
   - Update `XENDIT_WEBHOOK_VERIFICATION_TOKEN`:
     - Test: `KoqQVhwe3lCPfWr5EusPLJVN5YCj85ypAmkisgiVV8C8yGbs`
     - Live: `xwttqFPZuIA79uL2stbpig9ijRAcOiibLPxUZ3uErka1tWYD`

## Requirements

- PowerShell 5.1+ (Windows) or Bash (Mac/Linux)
- [Appwrite CLI](https://appwrite.io/docs/command-line) installed and configured
- Your Appwrite project credentials in `~/.appwrite` (from `appwrite login`)

## Troubleshooting

### Scripts won't run (Windows)
```powershell
# Allow scripts to run once
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
npm run xendit:toggle
```

### Appwrite CLI not recognized
```bash
# Install Appwrite CLI
npm install -g appwrite

# Or login again
appwrite login
```

### Still showing old credentials
1. Check `appwrite/functions/xendit-config.js` — is MODE correct?
2. Clear browser cache (Ctrl+Shift+Delete)
3. Restart dev server (`npm run dev`)
4. Check Appwrite Console to verify functions updated

## Best Practices

✅ **DO:**
- Run `npm run xendit:status` before testing
- Use test mode for development
- Test live mode on staging before production
- Keep both webhook URLs in Xendit settings

❌ **DON'T:**
- Forget to switch back to test after live testing
- Use live keys in development
- Commit production keys to git (they're already exposed here, rotate them!)

## Security Note

🔒 Your test keys are visible in code (safe, test-only).
🔒 Your live keys should be rotated as they're now exposed in version history.

To rotate keys:
1. Go to [Xendit Dashboard](https://dashboard.xendit.co)
2. Generate new keys
3. Update `xnd_production_*` and webhook in this file and scripts
