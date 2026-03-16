/**
 * Xendit Configuration — Centralized Mode Toggle
 * 
 * Instead of changing XENDIT_SECRET_KEY in Appwrite Console manually,
 * all functions import this config file and use the SECRET_KEY.
 * 
 * To switch modes:
 * 1. Change MODE to 'test' or 'live'
 * 2. Deploy all functions (or just update this file in Appwrite)
 * 3. No need to update each function's environment variables separately
 */

// ── TOGGLE THIS TO SWITCH MODES ──────────────────────────────────
const MODE = 'test'; // 'test' or 'live'

// ── Xendit Keys (keep these secure!) ──────────────────────────────
const XENDIT_KEYS = {
  test: {
    secret: 'xnd_development_nvOb3Cbyg7lt60XRUmqQs5zcKgoCpNRoWH59EQN6gSgN2VWnl4WyOiwm4LDSuiM',
    webhook_token: 'KoqQVhwe3lCPfWr5EusPLJVN5YCj85ypAmkisgiVV8C8yGbs',
    api_url: 'https://api.xendit.co', // Test and live use same API URL
  },
  live: {
    secret: process.env.XENDIT_SECRET_KEY_LIVE || 'MISSING_LIVE_KEY',
    webhook_token: process.env.XENDIT_WEBHOOK_TOKEN_LIVE || 'MISSING_LIVE_TOKEN',
    api_url: 'https://api.xendit.co',
  },
};

export const XENDIT_SECRET_KEY = XENDIT_KEYS[MODE].secret;
export const XENDIT_WEBHOOK_TOKEN = XENDIT_KEYS[MODE].webhook_token;
export const XENDIT_API_URL = XENDIT_KEYS[MODE].api_url;
export const XENDIT_MODE = MODE;

// Debug: Log which mode is active (remove in production if desired)
if (typeof process !== 'undefined' && process.stdout) {
  console.log(`[Xendit] Using ${MODE.toUpperCase()} mode`);
}
