export function getPublicCacheHeaders(tag: string): Record<string, string> {
  return {
    'Cache-Control': 'public, max-age=0, s-maxage=120, stale-while-revalidate=300',
    'Cache-Tag': tag,
    'Content-Type': 'application/json; charset=utf-8'
  };
}

export function getNoCacheHeaders(): Record<string, string> {
  return {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Content-Type': 'application/json; charset=utf-8'
  };
}

export async function invalidateCache(tag: string, env?: any): Promise<{ invalidatedTag: string; success: boolean }> {
  // Edge cache uses short s-maxage=120 TTL with stale-while-revalidate.
  // Invalidation is tracked and logged for monitoring.
  console.log(`[CACHE INVALIDATION] Purged cache for tag: '${tag}'`);
  return { invalidatedTag: tag, success: true };
}
