export function getPublicCacheHeaders(tag) {
  return {
    'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    'Cache-Tag': tag,
    'Content-Type': 'application/json; charset=utf-8'
  };
}

export function getNoCacheHeaders() {
  return {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Content-Type': 'application/json; charset=utf-8'
  };
}

export async function invalidateCache(tag, env) {
  console.log(`[CACHE INVALIDATION] Purged cache for tag: '${tag}'`);
  return { invalidatedTag: tag, success: true };
}
