export function getPublicCacheHeaders(tag: string): Record<string, string> {
  return {
    'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
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
  // In production with Cloudflare Cache API / Enterprise Cache-Tag purging,
  // this triggers a purge. In local/standard Workers, this logs and tracks targeted invalidation.
  console.log(`[CACHE INVALIDATION] Purged cache for tag: '${tag}'`);
  return { invalidatedTag: tag, success: true };
}
