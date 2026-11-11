/**
 * Security utilities to prevent API key exposure and sanitize logs/errors.
 */

/**
 * Sanitizes any string or error message to guarantee API keys and sensitive tokens
 * are never leaked in server logs, API responses, or error traces.
 */
export function sanitizeText(text: string | undefined | null): string {
  if (!text) return '';

  let sanitized = String(text);
  const currentKey = process.env.GEMINI_API_KEY;

  // 1. Redact the exact configured key if present
  if (currentKey && currentKey.length > 5) {
    sanitized = sanitized.split(currentKey).join('[REDACTED_API_KEY]');
  }

  // 2. Redact standard Google API key format (AIzaSy...)
  sanitized = sanitized.replace(/AIza[0-9A-Za-z-_]{35}/g, '[REDACTED_API_KEY]');

  // 3. Redact any key parameter in query strings or headers (e.g. key=xxx, api_key=xxx, x-goog-api-key: xxx)
  sanitized = sanitized.replace(/([?&](?:api_)?key=)[^&\s"']+/gi, '$1[REDACTED]');
  sanitized = sanitized.replace(/(x-goog-api-key[:=]\s*)[^\s,"']+/gi, '$1[REDACTED]');
  sanitized = sanitized.replace(/(authorization[:=]\s*bearer\s+)[^\s,"']+/gi, '$1[REDACTED]');

  return sanitized;
}

/**
 * Returns a clean, user-safe error message guaranteed not to contain secrets.
 */
export function sanitizeError(error: any, fallbackMessage = 'An unexpected error occurred'): string {
  if (!error) return fallbackMessage;

  const rawMsg = error.message || (typeof error === 'string' ? error : fallbackMessage);
  return sanitizeText(rawMsg);
}
