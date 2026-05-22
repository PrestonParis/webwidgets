/**
 * Error handling utilities for consistent error detection and handling
 */

/**
 * Check if an error is an abort error (from AbortController or fetch timeout)
 */
export function isAbortError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.name === 'AbortError' ||
      error.name === 'TimeoutError' ||
      error.message.includes('abort') ||
      error.message.includes('timeout') ||
      error.message.includes('Lock was stolen')
    );
  }
  // Supabase returns a plain PostgrestError object (not an Error instance) when
  // a query is aborted via .abortSignal(). Check its message/hint fields directly.
  if (error !== null && typeof error === 'object') {
    const e = error as Record<string, unknown>;
    const msg = String(e.message ?? '').toLowerCase();
    const hint = String(e.hint ?? '').toLowerCase();
    return msg.includes('abort') || hint.includes('abort') || hint.includes('cancellation');
  }
  return false;
}

/**
 * Check if an error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.name === 'TypeError' && 
      error.message.includes('fetch')
    );
  }
  return false;
}

/**
 * Safely execute an async function with abort handling
 * Returns null for abort errors, rethrows other errors
 */
export async function withAbortHandling<T>(
  fn: () => Promise<T>,
  onError?: (error: Error) => void
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    if (isAbortError(error)) {
      // Silently ignore abort errors
      return null;
    }
    
    if (onError && error instanceof Error) {
      onError(error);
    }
    
    throw error;
  }
}
