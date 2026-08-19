// ================================================================
// CENTRAL ADMIN AUTHENTICATION DISPATCHER (JS Mirror)
// Feature-flagged dispatch between Cloudflare Access (default) and D1 Session auth
// ================================================================

import { authenticateAdmin as authenticateAdminAccess } from './access.js';
import { authenticateAdminSession } from './session.js';
import { ForbiddenError } from '../errors.js';

/**
 * Authenticates an admin request using the configured AUTH_MODE.
 *
 * Modes:
 * - 'SESSION': Authenticates via __Host-admin_session cookie against D1 admin_sessions.
 * - 'ACCESS' (default): Authenticates via Cf-Access-Jwt-Assertion header.
 *
 * Fail-Closed Policy:
 * If AUTH_MODE is absent, empty, or set to an unrecognized value,
 * it strictly fails closed to 'ACCESS' mode to preserve production security.
 */
export async function authenticateAdmin(request, env) {
  const configuredMode = (env.AUTH_MODE || 'ACCESS').trim().toUpperCase();

  if (configuredMode === 'SESSION') {
    // CSRF Protection for state-changing admin requests in SESSION mode
    const method = request.method.toUpperCase();
    const isStateChanging = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);

    if (isStateChanging) {
      const adminHeader = request.headers.get('X-Admin-Request');
      const secFetchSite = request.headers.get('Sec-Fetch-Site');

      // Reject cross-site state-changing requests if explicitly marked as cross-site
      if (secFetchSite === 'cross-site') {
        throw new ForbiddenError('Cross-site state-changing requests are strictly forbidden');
      }

      // If X-Admin-Request is configured/expected by the Admin SPA client
      if (adminHeader && adminHeader !== '1' && adminHeader.toLowerCase() !== 'true') {
        throw new ForbiddenError('Invalid X-Admin-Request CSRF header value');
      }
    }

    return await authenticateAdminSession(request, env);
  }

  // Default / Fail-Closed: Cloudflare Access JWT Assertion
  return await authenticateAdminAccess(request, env);
}
