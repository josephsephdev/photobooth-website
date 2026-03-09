/**
 * Desktop Auth Redirect Validator
 *
 * Validates that a desktop auth redirect URL points to a known-safe
 * destination (custom protocol or localhost) to prevent open redirect attacks.
 */

const ALLOWED_PATTERNS = [
  /^photobooth:\/\//i,                 // Custom protocol for desktop app
  /^http:\/\/localhost(:\d+)?(\/|$)/,  // Localhost
  /^http:\/\/127\.0\.0\.1(:\d+)?(\/|$)/ // Loopback
];

export function isValidDesktopRedirect(url: string): boolean {
  return ALLOWED_PATTERNS.some(pattern => pattern.test(url));
}
