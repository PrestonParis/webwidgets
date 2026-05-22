/**
 * Request deduplication utility to prevent duplicate in-flight requests
 * Same URL + same user + same params should share one in-flight promise
 */

interface DedupeKey {
  url: string;
  userId?: string;
  params?: string;
}

interface DedupeEntry {
  promise: Promise<unknown>;
  timestamp: number;
}

const dedupeCache = new Map<string, DedupeEntry>();

/**
 * Generate a deduplication key from request parameters
 */
function generateKey(key: DedupeKey): string {
  const paramsStr = key.params ? JSON.stringify(key.params) : '';
  return `${key.url}:${key.userId || 'anonymous'}:${paramsStr}`;
}

/**
 * Execute a request with deduplication
 * If the same request is already in-flight, return the existing promise
 */
export async function withDeduplication<T>(
  key: DedupeKey,
  fn: () => Promise<T>
): Promise<T> {
  const cacheKey = generateKey(key);
  const existing = dedupeCache.get(cacheKey);

  // Return existing in-flight promise
  if (existing && Date.now() - existing.timestamp < 5000) {
    return existing.promise as Promise<T>;
  }

  // Create new promise
  const promise = fn().finally(() => {
    // Clean up after completion (with small delay to allow immediate retries)
    setTimeout(() => {
      dedupeCache.delete(cacheKey);
    }, 100);
  });

  dedupeCache.set(cacheKey, {
    promise,
    timestamp: Date.now(),
  });

  return promise;
}

/**
 * Clear all deduplication cache entries
 */
export function clearDedupeCache(): void {
  dedupeCache.clear();
}

/**
 * Clear deduplication cache for a specific URL pattern
 */
export function clearDedupeCacheForUrl(urlPattern: string): void {
  for (const key of dedupeCache.keys()) {
    if (key.includes(urlPattern)) {
      dedupeCache.delete(key);
    }
  }
}
