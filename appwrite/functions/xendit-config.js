/**
 * Xendit Configuration -- Centralized Mode Toggle
 * 
 * All Appwrite functions use this single config file to get Xendit credentials.
 * Toggle between test/live modes with: npm run xendit:toggle
 */

// TOGGLE THIS TO SWITCH MODES
const MODE = 'live';

// â”€â”€ Xendit Credentials â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const XENDIT_KEYS = {
  test: {
    secret: 'xnd_development_nvOb3Cbyg7lt60XRUmqQs5zcKgoCpNRoWH59EQN6gSgN2VWnl4WyOiwm4LDSuiM',
    webhook_token: 'KoqQVhwe3lCPfWr5EusPLJVN5YCj85ypAmkisgiVV8C8yGbs',
    api_url: 'https://api.xendit.co',
  },
  live: {
    // Live credentials loaded from environment (more secure)
    secret: process.env.XENDIT_SECRET_KEY_LIVE || process.env.XENDIT_SECRET_KEY || 'MISSING_LIVE_KEY',
    webhook_token: process.env.XENDIT_WEBHOOK_TOKEN_LIVE || process.env.XENDIT_WEBHOOK_TOKEN || 'MISSING_LIVE_TOKEN',
    api_url: 'https://api.xendit.co',
  },
};

export const XENDIT_SECRET_KEY = XENDIT_KEYS[MODE].secret;
export const XENDIT_WEBHOOK_TOKEN = XENDIT_KEYS[MODE].webhook_token;
export const XENDIT_API_URL = XENDIT_KEYS[MODE].api_url;
export const XENDIT_MODE = MODE;

// Debug logging
if (typeof process !== 'undefined' && process.stdout) {
  const icon = MODE === 'test' ? 'ðŸ§ª' : 'ðŸ”´';
  console.log(`${icon} [Xendit Config] Using ${MODE.toUpperCase()} mode`);
}
