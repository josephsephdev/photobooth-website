import DOMPurify from 'dompurify';

/**
 * Sanitize plain text by removing any HTML tags
 * Safe for displaying user-provided content
 */
export function sanitizeText(text: string): string {
  if (!text) return '';
  // Remove all HTML tags, keep only text
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
}

/**
 * Sanitize user names for safe display
 * Removes HTML, limits length to 200 chars, trims whitespace
 */
export function sanitizeUserName(name: string): string {
  if (!name) return '';
  const cleaned = sanitizeText(name).trim();
  return cleaned.substring(0, 200);
}

/**
 * Sanitize and validate email addresses
 * Converts to lowercase, removes whitespace, validates format
 */
export function sanitizeEmail(email: string): string {
  if (!email) return '';
  const cleaned = email.toLowerCase().trim();
  // Basic email validation pattern
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(cleaned) ? cleaned : '';
}

/**
 * Sanitize user content allowing only safe formatting tags
 * Allows: <b>, <i>, <em>, <strong>, <br>
 */
export function sanitizeContent(content: string): string {
  if (!content) return '';
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br'],
    ALLOWED_ATTR: [],
  });
}
