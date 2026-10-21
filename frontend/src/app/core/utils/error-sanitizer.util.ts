import { isDevMode } from '@angular/core';

export const GENERIC_ERROR_MESSAGE = 'Something went wrong. Please try again.';

/**
 * Checks whether an error message or error response represents a raw, technical,
 * internal server, or unrouted endpoint error (such as 404 "Resource not found: /api/...").
 */
export function isRawOrTechnicalError(err: any): boolean {
  if (!err) return false;

  const status = typeof err.status === 'number' ? err.status : undefined;
  // HTTP 404 for an API endpoint or 502/504 technical gateway errors
  if (status === 404 || status === 502 || status === 504) {
    return true;
  }

  const rawMessage = typeof err === 'string'
    ? err
    : (err?.error?.message || (typeof err?.error === 'string' ? err?.error : '') || err?.message || '');

  if (typeof rawMessage !== 'string' || !rawMessage.trim()) {
    return false;
  }

  const lower = rawMessage.toLowerCase();
  return (
    lower.includes('/api/') ||
    lower.includes('resource not found') ||
    lower.includes('cannot get') ||
    lower.includes('cannot post') ||
    lower.includes('cannot put') ||
    lower.includes('cannot delete') ||
    lower.includes('cannot patch') ||
    lower.includes('<!doctype') ||
    lower.includes('<html') ||
    lower.includes('internal server error') ||
    lower.includes('econnrefused') ||
    lower.includes('etimedout') ||
    lower.includes('enotfound') ||
    lower.includes('casterror') ||
    lower.includes('mongoserverselectionerror') ||
    lower.includes('mongonetworkerror') ||
    lower.includes('jwt expired') ||
    lower.includes('jwt malformed') ||
    lower.includes('syntaxerror') ||
    lower.includes('unexpected token')
  );
}

/**
 * Extracts a safe, user-friendly message from any error.
 * Logs full technical details ONLY in development.
 */
export function getCleanErrorMessage(err: any, fallbackMessage = GENERIC_ERROR_MESSAGE): string {
  if (isDevMode()) {
    console.error('[App Error Debug Details]:', err);
  }

  if (isRawOrTechnicalError(err)) {
    return GENERIC_ERROR_MESSAGE;
  }

  const msg = err?.error?.message || (typeof err?.error === 'string' ? err?.error : null) || err?.message;
  if (typeof msg === 'string' && msg.trim() && !isRawOrTechnicalError(msg)) {
    return msg.trim();
  }

  return fallbackMessage;
}
